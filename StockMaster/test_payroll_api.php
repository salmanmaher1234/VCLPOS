<?php

use App\Models\Employee;
use App\Models\User;
use App\Http\Controllers\Api\PayrollController;
use Illuminate\Http\Request;

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$user = User::where('email', 'muhammadtalhabajwa69@gmail.com')->first();
$request = new Request();
$request->setUserResolver(fn() => $user);

$controller = new PayrollController();
$response = $controller->index($request);
$data = json_decode($response->getContent());

foreach ($data as $payroll) {
    $empName = $payroll->employee->name ?? 'Unknown';
    $shiftName = $payroll->stats->shift_name ?? 'N/A';
    echo "$empName: $shiftName\n";
}
