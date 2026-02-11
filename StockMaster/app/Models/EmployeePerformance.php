<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EmployeePerformance extends Model
{
    use HasFactory;

    protected $table = 'employee_performance';

    protected $fillable = [
        'employee_id',
        'month',
        'sales_count',
        'sales_amount',
        'attendance_days',
        'late_days',
        'rating',
        'feedback',
        'metrics'
    ];

    protected $casts = [
        'metrics' => 'array',
        'sales_amount' => 'decimal:2',
        'rating' => 'decimal:2'
    ];

    // Relationships
    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    // Calculate overall performance score
    public function calculatePerformanceScore()
    {
        // Simple scoring algorithm (can be customized)
        $salesScore = min(($this->sales_amount / 10000) * 100, 100);
        $attendanceScore = ($this->attendance_days / 26) * 100;
        $punctualityScore = max(100 - (($this->late_days / 26) * 100), 0);
        
        return ($salesScore * 0.4) + ($attendanceScore * 0.3) + ($punctualityScore * 0.3);
    }
}
