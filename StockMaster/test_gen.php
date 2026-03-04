<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Employee;
use App\Models\User;

$user = User::first();
if (!$user) {
    echo "No user found to associate employee with.";
    exit;
}

// Manually simulate the code generation logic to see what it produces
$lastEmployee = Employee::where('employee_code', 'LIKE', 'EMP%')
    ->orderByRaw('CAST(SUBSTRING(employee_code, 4) AS UNSIGNED) DESC')
    ->first();

$nextNumber = 1;
if ($lastEmployee) {
    $lastNumber = intval(substr($lastEmployee->employee_code, 3));
    $nextNumber = $lastNumber + 1;
}

$employeeCode = 'EMP' . str_pad($nextNumber, 5, '0', STR_PAD_LEFT);

echo "Next generated code will be: " . $employeeCode . PHP_EOL;

// Check if this code already exists
$exists = Employee::where('employee_code', $employeeCode)->exists();
if ($exists) {
    echo "Error: Code already exists!" . PHP_EOL;
} else {
    echo "Success: Code is unique and ready for use." . PHP_EOL;
}
