<?php

use App\Models\Employee;
use App\Models\EmployeePayroll;
use App\Models\EmployeeLeave;
use App\Models\EmployeeShift;
use App\Models\EmployeePerformance;
use App\Models\User;

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$email = 'muhammadtalhabajwa69@gmail.com';
$user = User::where('email', $email)->first();

if (!$user) {
    echo "User not found: {$email}\n";
    exit(1);
}

$employees = Employee::where('user_id', $user->id)->get();

if ($employees->isEmpty()) {
    echo "No employees found for this user. Creating one...\n";
    $employee = Employee::create([
        'user_id' => $user->id,
        'name' => 'Ali Raza',
        'email' => 'ali.raza@example.com',
        'phone' => '03001234567',
        'position' => 'Senior Cashier',
        'salary' => 45000,
        'hire_date' => now()->subYear(),
        'status' => 'active',
        'employee_code' => 'EMP'.rand(1000, 9999),
        'role' => 'cashier',
        'department' => 'Sales'
    ]);
    $employees = collect([$employee]);
}

// 0. Create Shifts for this user if they don't exist
$shifts = EmployeeShift::where('user_id', $user->id)->get();
if ($shifts->isEmpty()) {
    $morning = EmployeeShift::create([
        'user_id' => $user->id,
        'name' => 'Morning Shift',
        'start_time' => '09:00:00',
        'end_time' => '17:00:00',
        'late_threshold' => 15,
        'weekly_off' => ['Sunday']
    ]);
    
    $evening = EmployeeShift::create([
        'user_id' => $user->id,
        'name' => 'Evening Shift',
        'start_time' => '17:00:00',
        'end_time' => '01:00:00',
        'late_threshold' => 15,
        'weekly_off' => ['Sunday']
    ]);
    echo " - Shifts created for user\n";
}

foreach ($employees as $employee) {
    echo "Processing data for: {$employee->name} (ID: {$employee->id})\n";

    // 1. Clean up existing data for this employee to re-seed correctly
    EmployeePayroll::where('employee_id', $employee->id)->delete();
    EmployeeLeave::where('employee_id', $employee->id)->delete();
    EmployeePerformance::where('employee_id', $employee->id)->delete();

    // 2. Create Payrolls for last 3 months
    for ($i = 0; $i < 3; $i++) {
        $month = now()->subMonths($i)->format('Y-m');
        
        EmployeePayroll::create([
            'employee_id' => $employee->id,
            'month' => $month,
            'basic_salary' => $employee->salary,
            'bonus' => 2000,
            'commission' => 1500,
            'overtime_pay' => 500,
            'late_deduction' => 200,
            'advance_salary' => 0,
            'net_salary' => $employee->salary + 2000 + 1500 + 500 - 200,
            'status' => 'paid',
            'payment_date' => now()->subMonths($i)->startOfMonth()->addDays(2),
            'notes' => 'Monthly disbursement'
        ]);
        echo " - Payroll created for {$month}\n";
    }

    // 3. Create Leaves
    EmployeeLeave::create([
        'employee_id' => $employee->id,
        'type' => 'sick',
        'start_date' => now()->subDays(10)->format('Y-m-d'),
        'end_date' => now()->subDays(8)->format('Y-m-d'),
        'reason' => 'Recovery from fever',
        'status' => 'approved'
    ]);
    
    EmployeeLeave::create([
        'employee_id' => $employee->id,
        'type' => 'casual',
        'start_date' => now()->addDays(5)->format('Y-m-d'),
        'end_date' => now()->addDays(7)->format('Y-m-d'),
        'reason' => 'Family event',
        'status' => 'pending'
    ]);
    echo " - Leaves created\n";

    // 4. Create Performance records
    for ($i = 0; $i < 3; $i++) {
        $month = now()->subMonths($i)->format('Y-m');
        EmployeePerformance::create([
            'employee_id' => $employee->id,
            'month' => $month,
            'sales_count' => rand(50, 200),
            'sales_amount' => rand(10000, 50000),
            'attendance_days' => 22,
            'late_days' => rand(0, 3),
            'rating' => 4.5,
            'feedback' => 'Excellent work consistency.',
            'metrics' => json_encode(['efficiency' => 95, 'punctuality' => 98])
        ]);
    }
    echo " - Performance records created\n";
}

echo "Seeding completed successfully for user ID {$user->id}\n";
