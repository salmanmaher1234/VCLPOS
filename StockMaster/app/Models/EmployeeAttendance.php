<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EmployeeAttendance extends Model
{
    use HasFactory;

    protected $table = 'employee_attendance';

    protected $fillable = [
        'employee_id',
        'date',
        'time_in',
        'time_out',
        'total_hours',
        'status',
        'notes'
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function calculateTotalHours()
    {
        if ($this->time_in && $this->time_out) {
            $timeIn = \Carbon\Carbon::parse($this->time_in);
            $timeOut = \Carbon\Carbon::parse($this->time_out);
            if ($timeOut->lt($timeIn)) {
                $timeOut->addDay(); // handle overnight shifts
            }
            $this->total_hours = $timeOut->diffInMinutes($timeIn);
        }
    }
}
