<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Employee extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'shift_id',
        'employee_code',
        'name',
        'email',
        'phone',
        'position',
        'department',
        'role',
        'salary',
        'hourly_rate',
        'overtime_rate',
        'commission_rate',
        'hire_date',
        'photo',
        'status',
        'permissions'
    ];

    protected $casts = [
        'permissions' => 'array',
        'hire_date' => 'date',
    ];

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function shifts()
    {
        return $this->belongsToMany(EmployeeShift::class, 'employee_shift_pivot', 'employee_id', 'shift_id');
    }

    public function shift()
    {
        return $this->belongsTo(EmployeeShift::class, 'shift_id');
    }

    public function attendance()
    {
        return $this->hasMany(EmployeeAttendance::class);
    }

    public function performance()
    {
        return $this->hasMany(EmployeePerformance::class);
    }

    public function leaves()
    {
        return $this->hasMany(EmployeeLeave::class);
    }

    public function payrolls()
    {
        return $this->hasMany(EmployeePayroll::class);
    }

    public function documents()
    {
        return $this->hasMany(EmployeeDocument::class);
    }

    public function activityLogs()
    {
        return $this->hasMany(EmployeeActivityLog::class);
    }
}
