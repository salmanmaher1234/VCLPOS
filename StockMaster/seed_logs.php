<?php

use App\Models\Employee;
use App\Models\EmployeeActivityLog;
use App\Models\User;

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$email = 'muhammadtalhabajwa69@gmail.com';
$user = User::where('email', $email)->first();

if (!$user) {
    echo "User not found\n";
    exit(1);
}

$numan = Employee::where('user_id', $user->id)->where('name', 'LIKE', '%Numan%')->first();

if (!$numan) {
    echo "Numan not found\n";
    exit(1);
}

// Clear existing logs to seed fresh
EmployeeActivityLog::where('employee_id', $numan->id)->delete();

$actions = [
    ['action' => 'ORDER_CREATED', 'module' => 'Sales', 'desc' => 'Created a new retail order #INV-8821'],
    ['action' => 'STOCK_ADJUSTED', 'module' => 'Inventory', 'desc' => 'Updated quantities for "Organic Rice 5kg"'],
    ['action' => 'LOGIN_SUCCESS', 'module' => 'Auth', 'desc' => 'Secured login from workstation 04'],
    ['action' => 'PRICE_MODIFIED', 'module' => 'Products', 'desc' => 'Adjusted selling price for "Mineral Water"'],
    ['action' => 'CUSTOMER_ADDED', 'module' => 'CRM', 'desc' => 'Registered new loyalty member: Sarah Khan']
];

foreach ($actions as $item) {
    EmployeeActivityLog::create([
        'employee_id' => $numan->id,
        'action' => $item['action'],
        'module' => $item['module'],
        'description' => $item['desc'],
        'ip_address' => '192.168.1.' . rand(1, 254),
        'created_at' => now()->subHours(rand(1, 48))
    ]);
}

echo "Successfully seeded " . count($actions) . " activity logs for Numan.\n";
