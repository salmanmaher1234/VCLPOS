<?php
foreach(\App\Models\Employee::all() as $emp) {
    \App\Models\EmployeeActivityLog::create([
        'employee_id' => $emp->id,
        'action' => 'Registration',
        'module' => 'Staff',
        'description' => 'Employee joined the workforce'
    ]);
}
echo "Created " . \App\Models\EmployeeActivityLog::count() . " activity logs.\n";
