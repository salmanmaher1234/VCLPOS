<?php

use App\Models\Employee;
use App\Models\Sale;
use App\Models\User;

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$emp = Employee::where('user_id', 2)->first();
if ($emp) {
    // 1. Give employee a 5% commission rate
    $emp->update(['commission_rate' => 5]);
    echo "Updated {$emp->name} with 5% commission rate.\n";

    // 2. Add a fresh sale for today
    Sale::create([
        'user_id' => 2,
        'employee_id' => $emp->id,
        'receipt_number' => 'SALE-' . time(),
        'total_amount' => 10000,
        'paid_amount' => 10000,
        'payment_method' => 'cash',
        'status' => 'completed'
    ]);
    echo "Created a new sale of $10,000 for {$emp->name}.\n";
}
