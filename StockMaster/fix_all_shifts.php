<?php

use App\Models\Employee;
use App\Models\EmployeeShift;

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$employees = Employee::whereIn('name', ['Ali Raza', 'Numan'])->get();
$morning = EmployeeShift::where('name', 'LIKE', '%Moring%')->first();
$evening = EmployeeShift::where('name', 'LIKE', '%Evening%')->first();

if ($morning && $evening) {
    foreach ($employees as $emp) {
        $emp->shifts()->sync([$morning->id, $evening->id]);
        echo "Assigned Morning & Evening to " . $emp->name . "\n";
    }
} else {
    echo "Shifts not found.\n";
}
