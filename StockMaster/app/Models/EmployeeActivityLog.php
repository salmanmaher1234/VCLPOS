<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EmployeeActivityLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'action',
        'module',
        'description',
        'ip_address'
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }
}
