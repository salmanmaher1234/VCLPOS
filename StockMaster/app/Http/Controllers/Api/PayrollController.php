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
        $payrolls = EmployeePayroll::whereHas('employee', function($q) use ($request) {
            $q->where('user_id', $request->user()->id);
        })->where('month', $month)->with('employee')->get();
        
        return response()->json($payrolls);
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
        
        $query = Employee::where('user_id', $userId)->where('status', '!=', 'inactive');
        if ($request->has('employee_id')) {
            $query->where('id', $request->employee_id);
        }
        $employees = $query->get();

        $results = [];
        foreach ($employees as $employee) {
            // 1. Basic Salary
            $basicSalary = $employee->salary;
            
            // 2. Overtime & Performance
            $performance = EmployeePerformance::where('employee_id', $employee->id)
                ->where('month', $month)
                ->first();
            
            $commission = 0;
            if ($performance) {
                $commission = $performance->sales_amount * ($employee->commission_rate / 100);
            }

            // 3. Late Deductions
            $lateDays = EmployeeAttendance::where('employee_id', $employee->id)
                ->where('month', 'like', "$month%") // Filter by month in date field
                ->where('status', 'late')
                ->count();
            
            $lateDeduction = $lateDays * ($basicSalary / 30 / 8); // Deduct 1 hour salary per late day as sample logic

            // 4. Totals
            $bonus = 0; // Manual entry usually
            $advance = 0; // Manual entry usually
            $netSalary = $basicSalary + $commission - $lateDeduction - $advance;

            $payroll = EmployeePayroll::updateOrCreate(
                ['employee_id' => $employee->id, 'month' => $month],
                [
                    'basic_salary' => $basicSalary,
                    'commission' => $commission,
                    'late_deduction' => $lateDeduction,
                    'net_salary' => $netSalary > 0 ? $netSalary : 0,
                    'status' => 'unpaid'
                ]
            );
            $results[] = $payroll;
        }

        return response()->json($results);
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
}
