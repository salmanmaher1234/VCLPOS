<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EmployeePayroll extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'month',
        'basic_salary',
        'bonus',
        'commission',
        'overtime_pay',
        'late_deduction',
        'advance_salary',
        'net_salary',
        'status',
        'payment_date',
        'notes'
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }
}
