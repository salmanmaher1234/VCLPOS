<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\EmployeeAttendance;
use App\Models\EmployeePerformance;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class EmployeeController extends Controller
{
    /**
     * Display a listing of employees.
     */
    public function index(Request $request)
    {
        $query = Employee::where('user_id', $request->user()->id)
            ->with(['shifts', 'shift', 'attendance' => function($q) {
                $q->where('date', now()->toDateString());
            }]);

        // Filter by status
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Filter by role
        if ($request->has('role') && $request->role !== 'all') {
            $query->where('role', $request->role);
        }

        // Search
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('employee_code', 'like', "%{$search}%");
            });
        }

        $employees = $query->latest()->get();

        return response()->json($employees);
    }

    /**
     * Store a newly created employee.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:employees,email',
            'phone' => 'nullable|string|max:20',
            'position' => 'required|string|max:255',
            'department' => 'nullable|string|max:255',
            'role' => 'required|in:admin,manager,cashier,inventory_manager,sales_person',
            'salary' => 'nullable|numeric|min:0',
            'commission_rate' => 'nullable|numeric|min:0|max:100',
            'hire_date' => 'required|date',
            'permissions' => 'nullable|array',
            'shift_id' => 'nullable|exists:employee_shifts,id',
            'shift_ids' => 'nullable|array'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Generate employee code (globally unique and robust)
        $lastEmployee = Employee::where('employee_code', 'LIKE', 'EMP%')
            ->orderByRaw('CAST(SUBSTRING(employee_code, 4) AS UNSIGNED) DESC')
            ->first();
        
        $nextNumber = 1;
        if ($lastEmployee) {
            $lastNumber = intval(substr($lastEmployee->employee_code, 3));
            $nextNumber = $lastNumber + 1;
        }

        $employeeCode = 'EMP' . str_pad($nextNumber, 5, '0', STR_PAD_LEFT);

        $employee = Employee::create([
            'user_id' => $request->user()->id,
            'employee_code' => $employeeCode,
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'position' => $request->position,
            'department' => $request->department,
            'role' => $request->role,
            'salary' => $request->salary,
            'commission_rate' => $request->commission_rate ?? 0,
            'hire_date' => $request->hire_date,
            'status' => 'active',
            'permissions' => $request->permissions ?? [],
            'shift_id' => $request->shift_id != '' ? $request->shift_id : null
        ]);

        if ($request->has('shift_ids')) {
            $employee->shifts()->sync($request->shift_ids);
        } elseif ($request->shift_id) {
            $employee->shifts()->sync([$request->shift_id]);
        }

        return response()->json($employee, 201);
    }

    /**
     * Display the specified employee.
     */
    public function show(Request $request, $id)
    {
        $employee = Employee::where('user_id', $request->user()->id)
            ->with(['attendance', 'performance', 'shift', 'shifts'])
            ->findOrFail($id);

        return response()->json($employee);
    }

    /**
     * Update the specified employee.
     */
    public function update(Request $request, $id)
    {
        $employee = Employee::where('user_id', $request->user()->id)->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|unique:employees,email,' . $id,
            'phone' => 'nullable|string|max:20',
            'position' => 'sometimes|required|string|max:255',
            'department' => 'nullable|string|max:255',
            'role' => 'sometimes|required|in:admin,manager,cashier,inventory_manager,sales_person',
            'salary' => 'nullable|numeric|min:0',
            'commission_rate' => 'nullable|numeric|min:0|max:100',
            'hire_date' => 'sometimes|required|date',
            'status' => 'sometimes|required|in:active,inactive,on_leave',
            'permissions' => 'nullable|array',
            'shift_id' => 'nullable|exists:employee_shifts,id',
            'shift_ids' => 'nullable|array'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $request->except(['employee_code', 'user_id']); // Don't allow updating these
        if (isset($data['shift_id']) && $data['shift_id'] == '') {
            $data['shift_id'] = null;
        }

        $employee->update($data);

        if ($request->has('shift_ids')) {
            $employee->shifts()->sync($request->shift_ids);
        } elseif ($request->has('shift_id')) {
            $employee->shifts()->sync($request->shift_id ? [$request->shift_id] : []);
        }

        $employee->load(['shift', 'shifts']); // Ensure shift info is updated in the response

        // Sync with today's attendance if status is on_leave or inactive
        if ($request->has('status') && ($request->status === 'on_leave' || $request->status === 'inactive')) {
            EmployeeAttendance::updateOrCreate(
                ['employee_id' => $id, 'date' => now()->toDateString()],
                ['status' => 'absent', 'time_in' => null, 'time_out' => null, 'total_hours' => null]
            );
        }

        return response()->json($employee);
    }

    /**
     * Remove the specified employee.
     */
    public function destroy(Request $request, $id)
    {
        $employee = Employee::where('user_id', $request->user()->id)->findOrFail($id);
        $employee->forceDelete();

        return response()->json(['message' => 'Employee and all related data deleted permanently']);
    }

    /**
     * Clock in/out for attendance
     */
    public function clockInOut(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'employee_id' => 'required|exists:employees,id',
            'type' => 'required|in:in,out'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $employee = Employee::where('user_id', $request->user()->id)
            ->with(['shift', 'shifts'])
            ->findOrFail($request->employee_id);

        $today = now()->toDateString();
        $attendance = EmployeeAttendance::firstOrCreate(
            [
                'employee_id' => $request->employee_id,
                'date' => $today
            ],
            [
                'status' => 'present'
            ]
        );

        if ($request->type === 'in') {
            $attendance->time_in = now()->format('H:i:s');
            
            // Check for lateness against all assigned shifts
            $activeShifts = $employee->shifts->isNotEmpty() ? $employee->shifts : ($employee->shift ? collect([$employee->shift]) : collect());
            
            if ($activeShifts->isNotEmpty()) {
                $isLate = true;
                foreach ($activeShifts as $s) {
                    $shiftStart = \Carbon\Carbon::parse($today . ' ' . $s->start_time);
                    $gracePeriod = $s->late_threshold ?? 15;
                    if (now()->lte($shiftStart->copy()->addMinutes($gracePeriod))) {
                        $isLate = false;
                        break;
                    }
                }
                if ($isLate) {
                    $attendance->status = 'late';
                }
            } else {
                // Fallback for no shift (Default 9:00 AM + 15m grace)
                if (now()->format('H:i') > '09:15') {
                    $attendance->status = 'late';
                }
            }
        } else {
            $attendance->time_out = now()->format('H:i:s');
            $attendance->calculateTotalHours();
        }

        $attendance->save();

        // Sync performance for the month
        $this->syncPerformance($employee->id, now()->format('Y-m'));

        return response()->json($attendance);
    }

    /**
     * Get attendance records
     */
    public function getAttendance(Request $request)
    {
        $query = EmployeeAttendance::whereHas('employee', function($q) use ($request) {
            $q->where('user_id', $request->user()->id);
        })->with('employee');

        if ($request->has('employee_id')) {
            $query->where('employee_id', $request->employee_id);
        }

        if ($request->has('date_from')) {
            $query->where('date', '>=', $request->date_from);
        }

        if ($request->has('date_to')) {
            $query->where('date', '<=', $request->date_to);
        }

        $attendance = $query->orderBy('date', 'desc')->get();

        return response()->json($attendance);
    }

    /**
     * Get consolidated attendance for a specific date (all employees)
     */
    public function getDailyAttendance(Request $request)
    {
        $date = $request->input('date', now()->toDateString());
        $userId = $request->user()->id;

        // Get all active employees with Shift and Leaves
        $employees = Employee::where('user_id', $userId)
            ->where('status', '!=', 'inactive')
            ->with(['shift', 'shifts', 'leaves' => function($q) use ($date) {
                $q->where('status', 'approved')
                  ->whereDate('start_date', '<=', $date)
                  ->whereDate('end_date', '>=', $date);
            }])
            ->get();

        // Get attendance for these employees on the specific date
        $attendance = EmployeeAttendance::whereIn('employee_id', $employees->pluck('id'))
            ->where('date', $date)
            ->get()
            ->keyBy('employee_id');

        $result = $employees->map(function ($employee) use ($attendance, $date) {
            $record = $attendance->get($employee->id);
            $status = $record ? $record->status : ($date >= now()->toDateString() ? 'upcoming' : 'absent');
            
            // Real-time Status Inference for Today or Future if no record
            if (!$record && $date >= now()->toDateString()) {
                // Check if on Leave
                if ($employee->leaves->isNotEmpty()) {
                    $status = 'on_leave';
                } 
                // Check if Weekly Off
                elseif ($employee->shift && $employee->shift->weekly_off && in_array(\Carbon\Carbon::parse($date)->format('l'), $employee->shift->weekly_off)) {
                    $status = 'weekend';
                }
                // Check if Late (Any Shift Started + grace) - ONLY FOR TODAY
                elseif ($date === now()->toDateString()) {
                    $activeShifts = $employee->shifts->isNotEmpty() ? $employee->shifts : ($employee->shift ? collect([$employee->shift]) : collect());
                    
                    if ($activeShifts->isNotEmpty()) {
                        $isLateCandidate = false;
                        foreach ($activeShifts as $s) {
                            $shiftStart = \Carbon\Carbon::parse($date . ' ' . $s->start_time);
                            if (now()->gt($shiftStart->copy()->addMinutes($s->late_threshold ?? 15))) {
                                $isLateCandidate = true;
                            } else {
                                // If any shift hasn't reached late threshold yet, mark as upcoming
                                $status = 'upcoming';
                                $isLateCandidate = false;
                                break;
                            }
                        }
                        if ($isLateCandidate) $status = 'late';
                    }
                }
            }

            return [
                'id' => $record ? $record->id : null,
                'employee_id' => $employee->id,
                'employee_name' => $employee->name,
                'employee_code' => $employee->employee_code,
                'position' => $employee->position,
                'photo' => $employee->photo,
                'date' => $date,
                'status' => $status,
                'time_in' => $record ? $record->time_in : null,
                'time_out' => $record ? $record->time_out : null,
                'total_hours' => $record ? $record->total_hours : null,
                'shift_name' => $employee->shifts->isNotEmpty() ? $employee->shifts->pluck('name')->implode(' & ') : ($employee->shift ? $employee->shift->name : 'Standard'),
                'shift_times' => $employee->shifts->isNotEmpty() ? $employee->shifts->map(fn($s) => substr($s->start_time, 0, 5) . '-' . substr($s->end_time, 0, 5))->implode(', ') : ($employee->shift ? substr($employee->shift->start_time, 0, 5) . ' - ' . substr($employee->shift->end_time, 0, 5) : '09:00 - 17:00'),
                'employee' => $employee
            ];
        });

        return response()->json($result);
    }

    /**
     * Batch mark attendance for a specific date
     */
    public function batchMarkAttendance(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'date' => 'required|date',
            'status' => 'required|in:present,absent',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $date = $request->date;
        $status = $request->status;
        $userId = $request->user()->id;

        $employees = Employee::where('user_id', $userId)
            ->where('status', 'active')
            ->get();

        foreach ($employees as $employee) {
            EmployeeAttendance::firstOrCreate(
                [
                    'employee_id' => $employee->id,
                    'date' => $date
                ],
                [
                    'status' => $status,
                    'time_in' => $status === 'present' ? '09:00:00' : null,
                ]
            );
        }

        return response()->json(['message' => 'Attendance marked successfully']);
    }

    /**
     * Update an attendance record
     */
    public function updateAttendance(Request $request, $id)
    {
        $attendance = EmployeeAttendance::whereHas('employee', function($q) use ($request) {
            $q->where('user_id', $request->user()->id);
        })->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'status' => 'required|in:present,late,absent',
            'time_in' => 'nullable|string',
            'time_out' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $attendance->update($request->all());

        if ($attendance->time_in && $attendance->time_out) {
            $attendance->calculateTotalHours();
        } else {
            $attendance->total_hours = null;
            $attendance->save();
        }

        return response()->json($attendance);
    }

    /**
     * Mark or update attendance for a single employee
     */
    public function markSingleAttendance(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'employee_id' => 'required|exists:employees,id',
            'date' => 'required|date',
            'status' => 'required|in:present,absent,late,half_day,on_leave',
            'time_in' => 'nullable|string',
            'time_out' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Verify ownership
        $employee = Employee::where('user_id', $request->user()->id)
            ->with(['shift', 'shifts'])
            ->findOrFail($request->employee_id);

        // Determine default time_in from shift if not provided
        $defaultTimeIn = null;
        if ($request->status === 'present' && !$request->time_in) {
            if ($employee->shifts->isNotEmpty()) {
                $defaultTimeIn = $employee->shifts->first()->start_time;
            } elseif ($employee->shift) {
                $defaultTimeIn = $employee->shift->start_time;
            } else {
                $defaultTimeIn = '09:00:00';
            }
        }

        $timeIn = $request->time_in ?? $defaultTimeIn;
        $timeOut = $request->time_out;

        // Calculate total hours if both time_in and time_out are provided
        $totalHours = null;
        if ($timeIn && $timeOut) {
            $parsedIn = \Carbon\Carbon::parse($timeIn);
            $parsedOut = \Carbon\Carbon::parse($timeOut);
            if ($parsedOut->lt($parsedIn)) {
                $parsedOut->addDay(); // handle overnight shifts
            }
            $totalHours = $parsedOut->diffInMinutes($parsedIn);
        }

        $attendance = EmployeeAttendance::updateOrCreate(
            [
                'employee_id' => $employee->id,
                'date' => $request->date
            ],
            [
                'status' => $request->status,
                'time_in' => $timeIn,
                'time_out' => $timeOut,
                'total_hours' => $totalHours
            ]
        );

        // Sync main employee status if date is today
        if ($request->date === now()->toDateString()) {
            if ($request->status === 'on_leave') {
                $employee->update(['status' => 'on_leave']);
            } elseif (in_array($request->status, ['present', 'late', 'half_day', 'absent'])) {
                $employee->update(['status' => 'active']);
            }
        }

        // Sync performance record for the month
        $this->syncPerformance($employee->id, \Carbon\Carbon::parse($request->date)->format('Y-m'));

        return response()->json($attendance);
    }

    /**
     * Get performance records
     */
    public function getPerformance(Request $request)
    {
        $query = EmployeePerformance::whereHas('employee', function($q) use ($request) {
            $q->where('user_id', $request->user()->id);
        })->with('employee');

        if ($request->has('employee_id')) {
            $query->where('employee_id', $request->employee_id);
        }

        if ($request->has('month')) {
            $query->where('month', $request->month);
        }

        $performance = $query->orderBy('month', 'desc')->get();

        // Add performance scores
        $performance->each(function($record) {
            $record->performance_score = $record->calculatePerformanceScore();
        });

        return response()->json($performance);
    }

    /**
     * Update or create performance record
     */
    public function updatePerformance(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'employee_id' => 'required|exists:employees,id',
            'month' => 'required|date_format:Y-m',
            'sales_count' => 'nullable|integer|min:0',
            'sales_amount' => 'nullable|numeric|min:0',
            'attendance_days' => 'nullable|integer|min:0',
            'late_days' => 'nullable|integer|min:0',
            'rating' => 'nullable|numeric|min:0|max:5',
            'feedback' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $employee = Employee::where('user_id', $request->user()->id)
            ->findOrFail($request->employee_id);

        $performance = EmployeePerformance::updateOrCreate(
            [
                'employee_id' => $request->employee_id,
                'month' => $request->month
            ],
            [
                'sales_count' => $request->sales_count ?? 0,
                'sales_amount' => $request->sales_amount ?? 0,
                'attendance_days' => $request->attendance_days ?? 0,
                'late_days' => $request->late_days ?? 0,
                'rating' => $request->rating ?? 0,
                'feedback' => $request->feedback
            ]
        );

        $performance->performance_score = $performance->calculatePerformanceScore();

        return response()->json($performance);
    }

    /**
     * Get employee dashboard stats
     */
    public function getStats(Request $request)
    {
        $userId = $request->user()->id;
        
        $totalEmployees = Employee::where('user_id', $userId)->count();
        $activeEmployees = Employee::where('user_id', $userId)->active()->count();
        
        $todayPresent = EmployeeAttendance::whereHas('employee', function($q) use ($userId) {
            $q->where('user_id', $userId);
        })
        ->where('date', now()->toDateString())
        ->whereIn('status', ['present', 'late', 'half_day'])
        ->count();

        $avgPerformance = EmployeePerformance::whereHas('employee', function($q) use ($userId) {
            $q->where('user_id', $userId);
        })
        ->where('month', now()->format('Y-m'))
        ->avg('rating');

        return response()->json([
            'total_employees' => $totalEmployees,
            'active_employees' => $activeEmployees,
            'today_present' => $todayPresent,
            'avg_performance' => round($avgPerformance ?? 0, 2)
        ]);
    }

    /**
     * Get Activity Logs
     */
    public function getActivityLogs(Request $request)
    {
        $logs = \App\Models\EmployeeActivityLog::whereHas('employee', function($q) use ($request) {
            $q->where('user_id', $request->user()->id);
        })
        ->with('employee')
        ->latest()
        ->limit(50)
        ->get();

        return response()->json($logs);
    }

    /**
     * Sync performance record from real attendance data
     */
    private function syncPerformance($employeeId, $month)
    {
        $employee = Employee::with('shift')->findOrFail($employeeId);
        
        // 1. Calculate Attendance Stats
        $attendances = EmployeeAttendance::where('employee_id', $employeeId)
            ->where('date', 'like', "$month%")
            ->get();

        $presentDays = $attendances->whereIn('status', ['present', 'late', 'half_day'])->count();
        $lateDays = $attendances->where('status', 'late')->count();
        
        // 2. Calculate Sales (if applicable)
        $salesAmount = \App\Models\Sale::where('employee_id', $employeeId)
            ->where('created_at', 'like', "$month%")
            ->sum('total_amount');
        $salesCount = \App\Models\Sale::where('employee_id', $employeeId)
            ->where('created_at', 'like', "$month%")
            ->count();

        // 3. Update or Create Performance Record
        $performance = EmployeePerformance::updateOrCreate(
            ['employee_id' => $employeeId, 'month' => $month],
            [
                'attendance_days' => $presentDays,
                'late_days' => $lateDays,
                'sales_amount' => $salesAmount,
                'sales_count' => $salesCount,
                'rating' => $presentDays > 0 ? min(5, (4 + ($presentDays / 22) - ($lateDays / 10))) : 0,
                'feedback' => $presentDays > 0 ? "Automatically updated from attendance records." : "Awaiting data.",
                'metrics' => [
                    'efficiency' => $presentDays > 0 ? round((($presentDays - $lateDays) / 22) * 100) : 0,
                    'punctuality' => $presentDays > 0 ? round((1 - ($lateDays / $presentDays)) * 100) : 100
                ]
            ]
        );

        return $performance;
    }

    /**
     * Helper to log employee activity
     */
    private function logActivity($employeeId, $action, $module, $description)
    {
        return \App\Models\EmployeeActivityLog::create([
            'employee_id' => $employeeId,
            'action' => $action,
            'module' => $module,
            'description' => $description,
            'ip_address' => request()->ip()
        ]);
    }

}
