<?php

use App\Models\Employee;
use App\Models\EmployeeShift;

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$numan = Employee::where('name', 'LIKE', '%Numan%')->first();

if (!$numan) {
    echo "Numan not found\n";
    exit(1);
}

$morning = EmployeeShift::where('name', 'LIKE', '%Moring%')->first();
$evening = EmployeeShift::where('name', 'LIKE', '%Evening%')->first();

if ($morning && $evening) {
    $numan->shifts()->sync([$morning->id, $evening->id]);
    echo "Successfully assigned Morning & Evening shifts to Numan.\n";
    echo "Shifts: " . $numan->shifts()->pluck('name')->implode(' & ') . "\n";
} else {
    echo "Shifts not found. Morning: " . ($morning ? 'Yes' : 'No') . ", Evening: " . ($evening ? 'Yes' : 'No') . "\n";
}
