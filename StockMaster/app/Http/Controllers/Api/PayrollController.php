<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\EmployeePayroll;
use App\Models\EmployeeAttendance;
use App\Models\EmployeePerformance;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class PayrollController extends Controller
{
    public function index(Request $request)
    {
        $month = $request->input('month', now()->format('Y-m'));
        $isCurrentMonth = $month === now()->format('Y-m');
        $userId = $request->user()->id;

        $employees = Employee::where('user_id', $userId)->where('status', '!=', 'inactive')->with(['shift', 'shifts'])->get();
        
        $existingPayrolls = EmployeePayroll::whereIn('employee_id', $employees->pluck('id'))
            ->where('month', $month)
            ->with('employee')
            ->get()
            ->keyBy('employee_id');

        $finalData = [];
        foreach ($employees as $employee) {
            $stats = $this->calculateRealTimeStats($employee, $month); // Calculate stats for all
            
            if ($existingPayrolls->has($employee->id)) {
                $payroll = $existingPayrolls->get($employee->id);
                
                // If UNPAID, dynamically update display fields with live stats
                // This ensures UI reflects latest attendance without re-generating DB record
                if ($payroll->status === 'unpaid') {
                    $payroll->commission = $stats['commission'];
                    $payroll->late_deduction = $stats['total_deduction'];
                    
                    // Recalculate Net with all factors
                    $netSalary = $payroll->basic_salary + $payroll->commission + ($payroll->overtime_pay ?? 0) 
                                - $payroll->late_deduction - ($payroll->custom_deduction ?? 0) + ($payroll->custom_allowance ?? 0);
                    $payroll->net_salary = max(0, $netSalary);
                }
                
                $payroll->stats = $stats;
                $finalData[] = $payroll;
            } elseif ($isCurrentMonth) {
                $finalData[] = [
                    'id' => 'live-' . $employee->id,
                    'employee_id' => $employee->id,
                    'employee' => $employee,
                    'month' => $month,
                    'basic_salary' => $employee->salary,
                    'commission' => $stats['commission'],
                    'late_deduction' => $stats['total_deduction'], // Sum of Late + Absent
                    'net_salary' => max(0, $employee->salary + $stats['commission'] - $stats['total_deduction']),
                    'status' => 'draft',
                    'is_live' => true,
                    'stats' => $stats // Pass detailed stats for frontend if needed
                ];
            }
        }

        return response()->json($finalData);
    }

    public function generate(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'month' => 'required|date_format:Y-m',
            'employee_id' => 'nullable|exists:employees,id'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $userId = $request->user()->id;
        $month = $request->month;
        
        $query = Employee::where('user_id', $userId)->where('status', '!=', 'inactive')->with(['shift', 'shifts']);
        if ($request->has('employee_id')) {
            $query->where('id', $request->employee_id);
        }
        $employees = $query->get();

        $results = [];
        foreach ($employees as $employee) {
            $stats = $this->calculateRealTimeStats($employee, $month);

            // preserve existing custom values if any
            $currentPayroll = EmployeePayroll::where('employee_id', $employee->id)->where('month', $month)->first();
            $customDeduction = $currentPayroll ? $currentPayroll->custom_deduction : 0;
            $customAllowance = $currentPayroll ? $currentPayroll->custom_allowance : 0;

            $netSalary = $employee->salary + $stats['commission'] - $stats['total_deduction'] - $customDeduction + $customAllowance;

            $payroll = EmployeePayroll::updateOrCreate(
                ['employee_id' => $employee->id, 'month' => $month],
                [
                    'basic_salary' => $employee->salary,
                    'commission' => $stats['commission'],
                    'late_deduction' => $stats['total_deduction'],
                    'net_salary' => $netSalary > 0 ? $netSalary : 0,
                    'status' => 'unpaid' // Default to unpaid upon generation
                ]
            );
            $results[] = $payroll;
        }

        return response()->json($results);
    }

    private function calculateRealTimeStats($employee, $month)
    {
        // ... (Keep existing implementation)
        // 1. Commission (Real-time Sales)
        $salesAmount = \App\Models\Sale::where('employee_id', $employee->id)
            ->where('created_at', 'like', "$month%")
            ->sum('total_amount');
        $commission = $salesAmount * ($employee->commission_rate / 100);

        // 2. Attendance Stats (Late & Auto-Absent Detection)
        $startOfMonth = Carbon::parse($month)->startOfMonth();
        $endOfCheck = Carbon::parse($month)->isCurrentMonth() ? now() : Carbon::parse($month)->endOfMonth();

        // Get all attendance records for the month
        $attendances = EmployeeAttendance::where('employee_id', $employee->id)
            ->where('date', 'like', "$month%")
            ->get()
            ->keyBy('date');

        $endOfMonth = $startOfMonth->copy()->endOfMonth();

        // Get approved leaves for the entire month (even future dates this month)
        $leaves = \App\Models\EmployeeLeave::where('employee_id', $employee->id)
            ->where('status', 'approved')
            ->where(function($q) use ($startOfMonth, $endOfMonth) {
                $q->where(function($q2) use ($startOfMonth, $endOfMonth) {
                    $q2->whereBetween('start_date', [$startOfMonth, $endOfMonth])
                       ->orWhereBetween('end_date', [$startOfMonth, $endOfMonth]);
                })->orWhere(function($q2) use ($startOfMonth, $endOfMonth) {
                    $q2->where('start_date', '<', $startOfMonth)
                       ->where('end_date', '>', $endOfMonth);
                });
            })->get();

        $absentDays = 0;
        $lateDays = 0;
        $halfDays = 0;
        $presentDays = 0;
        $leaveDays = 0;
        
        // Iterate through each day to detect status
        $current = $startOfMonth->copy();
        $endOfMonth = $startOfMonth->copy()->endOfMonth();
        
        while ($current->lte($endOfMonth)) {
            $dateStr = $current->toDateString();
            
            // A. Check for Explicit Attendance Record
            if ($attendances->has($dateStr)) {
                $status = $attendances[$dateStr]->status;
                if ($status === 'late') {
                    $lateDays++;
                    $presentDays++;
                } elseif ($status === 'half_day') {
                    $halfDays++;
                    $presentDays++;
                } elseif ($status === 'absent') {
                    $absentDays++;
                } elseif ($status === 'present') {
                    $presentDays++;
                } elseif ($status === 'on_leave') {
                    $leaveDays++;
                }
            } 
            // B. If NO record, check Leave model or Infer Absence
            else {
                // Check if on Approved Leave (via Leave model) - Do this for EVERY day of the month
                $isOnLeave = $leaves->filter(function($leave) use ($current) {
                    return $current->between($leave->start_date, $leave->end_date);
                })->isNotEmpty();

                if ($isOnLeave) {
                    $leaveDays++;
                } 
                // Only infer Absence for past/today
                elseif (!$current->isFuture()) {
                    // Check if Sunday (or weekly off)
                    $isOffDay = $current->isSunday(); 
                    if ($employee->shift && $employee->shift->weekly_off) {
                        $isOffDay = in_array($current->format('l'), $employee->shift->weekly_off);
                    }

                    // Check Hire Date or System Creation Date
                    // Prevents penalizing employees for days before they were added to the system, 
                    // even if their official hire_date is in the past.
                    $employeeStartDate = max(
                        Carbon::parse($employee->hire_date)->startOfDay(), 
                        $employee->created_at ? Carbon::parse($employee->created_at)->startOfDay() : Carbon::parse($employee->hire_date)->startOfDay()
                    );
                    
                    $isBeforeStart = $current->lt($employeeStartDate);

                    if (!$isOffDay && !$isBeforeStart) {
                        $absentDays++;
                    }
                }

            }
            
            $current->addDay();
        }

        // 3. Calculate Deductions
        // 30-day basis for daily salary calculation standard
        $dailySalary = $employee->salary > 0 ? ($employee->salary / 30) : 0; 
        $hourlySalary = $dailySalary / 8; // Assuming 8-hour shift standard

        $lateDeduction = $lateDays * $hourlySalary; // 1 Hour per Late
        $halfDeduction = $halfDays * ($dailySalary / 2); // 4 Hours per Half Day
        $absentDeduction = $absentDays * $dailySalary; // Full Day per Absent

        // 4. Shift Detection (Combined or Single)
        $shiftName = 'General Shift';
        $isOnShift = false;
        $activeShiftName = null;
        $currentTime = now()->format('H:i:s');

        if ($employee->shifts && $employee->shifts->count() > 0) {
            $shiftName = $employee->shifts->pluck('name')->implode(' & ');
            foreach ($employee->shifts as $s) {
                $start = $s->start_time;
                $end = $s->end_time;
                $currentIsOn = ($start > $end) 
                    ? ($currentTime >= $start || $currentTime <= $end)
                    : ($currentTime >= $start && $currentTime <= $end);
                if ($currentIsOn) {
                    $isOnShift = true;
                    $activeShiftName = $s->name;
                }
            }
        } elseif ($employee->shift) {
            $shiftName = $employee->shift->name;
            $start = $employee->shift->start_time;
            $end = $employee->shift->end_time;
            $isOnShift = ($start > $end) 
                ? ($currentTime >= $start || $currentTime <= $end)
                : ($currentTime >= $start && $currentTime <= $end);
            if ($isOnShift) $activeShiftName = $employee->shift->name;
        }

        return [
            'commission' => $commission,
            'late_count' => $lateDays,
            'absent_count' => $absentDays,
            'half_day_count' => $halfDays,
            'present_count' => $presentDays,
            'leave_count' => $leaveDays,
            'shift_name' => $shiftName,
            'active_shift_name' => $activeShiftName,
            'is_on_shift' => $isOnShift,
            'total_deduction' => $lateDeduction + $halfDeduction + $absentDeduction
        ];
    }

    public function updateStatus(Request $request, $id)
    {
        $payroll = EmployeePayroll::whereHas('employee', function($q) use ($request) {
            $q->where('user_id', $request->user()->id);
        })->findOrFail($id);

        $payroll->update([
            'status' => $request->status,
            'payment_date' => $request->status === 'paid' ? now()->toDateString() : null
        ]);

        return response()->json($payroll);
    }

    public function updateDetails(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'custom_deduction' => 'nullable|numeric|min:0',
            'custom_deduction_reason' => 'nullable|string',
            'custom_allowance' => 'nullable|numeric|min:0',
            'late_deduction' => 'nullable|numeric|min:0',
            'overtime_pay' => 'nullable|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $payroll = EmployeePayroll::whereHas('employee', function($q) use ($request) {
            $q->where('user_id', $request->user()->id);
        })->findOrFail($id);

        $payroll->custom_deduction = isset($request->custom_deduction) ? $request->custom_deduction : $payroll->custom_deduction;
        $payroll->custom_deduction_reason = $request->custom_deduction_reason ?? $payroll->custom_deduction_reason;
        $payroll->custom_allowance = isset($request->custom_allowance) ? $request->custom_allowance : $payroll->custom_allowance;
        $payroll->late_deduction = isset($request->late_deduction) ? $request->late_deduction : $payroll->late_deduction;
        $payroll->overtime_pay = isset($request->overtime_pay) ? $request->overtime_pay : $payroll->overtime_pay;
        
        // Recalculate Net
        $netSalary = $payroll->basic_salary + $payroll->commission + $payroll->overtime_pay - $payroll->late_deduction - $payroll->custom_deduction + $payroll->custom_allowance;
        $payroll->net_salary = max(0, $netSalary);
        
        $payroll->save();

        return response()->json($payroll);
    }
}
