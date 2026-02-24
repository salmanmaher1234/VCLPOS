<?php

use App\Models\Employee;
use App\Models\EmployeeShift;

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$ali = Employee::where('name', 'LIKE', '%Ali Raza%')->first();
$numan = Employee::where('name', 'LIKE', '%Numan%')->first();

$morning = EmployeeShift::where('name', 'LIKE', '%Moring%')->first();
$evening = EmployeeShift::where('name', 'LIKE', '%Evening%')->first();

if ($ali && $morning) {
    $ali->shifts()->sync([$morning->id]);
    echo "Ali Raza set to Morning Only.\n";
}

if ($numan && $evening) {
    $numan->shifts()->sync([$evening->id]);
    echo "Numan set to Evening Only.\n";
}
