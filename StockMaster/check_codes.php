<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Employee;

$codes = Employee::pluck('employee_code');
foreach ($codes as $code) {
    echo $code . PHP_EOL;
}
