<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EmployeeShift extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'start_time',
        'end_time',
        'late_threshold',
        'weekly_off'
    ];

    protected $casts = [
        'weekly_off' => 'array',
    ];

    public function employees()
    {
        return $this->hasMany(Employee::class, 'shift_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
