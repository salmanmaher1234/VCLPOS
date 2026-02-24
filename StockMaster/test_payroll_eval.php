<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$e = App\Models\Employee::where('name', 'like', '%Talha%')->first(); 
$e->created_at = \Carbon\Carbon::now()->subDays(10);
$e->hire_date = \Carbon\Carbon::now()->subDays(10);

$pc = new App\Http\Controllers\Api\PayrollController();
$reflection = new ReflectionClass($pc);
$method = $reflection->getMethod('calculateRealTimeStats');
$method->setAccessible(true);
$ret = $method->invokeArgs($pc, [$e, '2026-02']);

print_r($ret);
