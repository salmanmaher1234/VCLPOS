<?php

use App\Models\Employee;
use App\Models\Sale;
use App\Models\User;

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$employee = Employee::where('user_id', 2)->first();
if (!$employee) {
    echo "Employee not found\n";
    exit;
}

$month = date('Y-m');
$salesAmount = Sale::where('employee_id', $employee->id)
    ->where('created_at', 'like', "$month%")
    ->sum('total_amount');

$commission = $salesAmount * ($employee->commission_rate / 100);

echo "--- REAL TIME PAYROLL CHECK ---\n";
echo "Staff: {$employee->name}\n";
echo "Base: {$employee->salary}\n";
echo "Current Month Sales: {$salesAmount}\n";
echo "Commission Rate: {$employee->commission_rate}%\n";
echo "Earned Commission: {$commission}\n";
echo "Projected Net: " . ($employee->salary + $commission) . "\n";
echo "-------------------------------\n";
