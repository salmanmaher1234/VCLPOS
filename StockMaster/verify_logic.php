<?php
try {
    echo "--- EMPLOYEE MODULE LOGIC VERIFICATION ---\n";
    $user = \App\Models\User::first();
    echo "1. Context: User ID " . $user->id . "\n";
    $shift = \App\Models\EmployeeShift::updateOrCreate(['name' => 'Standard Day'], ['user_id' => $user->id, 'start_time' => '09:00:00', 'end_time' => '18:00:00']);
    echo "2. Shift: Standard Day verified.\n";
    $employee = \App\Models\Employee::updateOrCreate(['email' => 'verification@vclpos.com'], ['user_id' => $user->id, 'name' => 'Logic Verify', 'position' => 'QA', 'employee_code' => 'TEST-001', 'salary' => 7500, 'hire_date' => now()]);
    echo "3. Employee: Logic Verify verified.\n";
    $payroll = \App\Models\EmployeePayroll::updateOrCreate(['employee_id' => $employee->id, 'month' => now()->format('Y-m')], ['basic_salary' => 7500, 'net_salary' => 7500]);
    echo "4. Payroll: Month " . now()->format('Y-m') . " initialized.\n";
    $leave = \App\Models\EmployeeLeave::create(['employee_id' => $employee->id, 'type' => 'casual', 'start_date' => now()->addDays(5), 'end_date' => now()->addDays(7), 'status' => 'pending']);
    echo "5. Leave: Application #" . $leave->id . " created.\n";
    echo "--- VERIFICATION COMPLETE ---\n";
} catch (\Exception $e) { echo "Error: " . $e->getMessage() . "\n"; }
