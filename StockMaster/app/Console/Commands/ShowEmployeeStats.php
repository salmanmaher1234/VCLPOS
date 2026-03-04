<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Employee;
use App\Models\EmployeeAttendance;
use App\Models\EmployeePerformance;

class ShowEmployeeStats extends Command
{
    protected $signature = 'employees:stats';
    protected $description = 'Show employee statistics and test data';

    public function handle()
    {
        $this->info('═══════════════════════════════════════════════');
        $this->info('        EMPLOYEE MANAGEMENT STATISTICS         ');
        $this->info('═══════════════════════════════════════════════');
        $this->newLine();

        // Statistics
        $totalEmployees = Employee::count();
        $activeEmployees = Employee::where('status', 'active')->count();
        $totalAttendance = EmployeeAttendance::count();
        $totalPerformance = EmployeePerformance::count();

        $this->info("📊 Database Records:");
        $this->line("   Total Employees: {$totalEmployees}");
        $this->line("   Active Employees: {$activeEmployees}");
        $this->line("   Attendance Records: {$totalAttendance}");
        $this->line("   Performance Records: {$totalPerformance}");
        $this->newLine();

        // Employee list
        $this->info("👥 Employee List:");
        $employees = Employee::all();
        
        $headers = ['Code', 'Name', 'Role', 'Department', 'Email', 'Status'];
        $rows = [];

        foreach ($employees as $emp) {
            $rows[] = [
                $emp->employee_code,
                $emp->name,
                ucfirst(str_replace('_', ' ', $emp->role)),
                $emp->department ?? 'N/A',
                $emp->email,
                ucfirst($emp->status)
            ];
        }

        $this->table($headers, $rows);
        $this->newLine();

        // Today's attendance
        $this->info("⏰ Today's Attendance:");
        $today = now()->toDateString();
        $todayAttendance = EmployeeAttendance::where('date', $today)
            ->with('employee')
            ->get();

        if ($todayAttendance->count() > 0) {
            $attHeaders = ['Employee', 'Time In', 'Time Out', 'Hours', 'Status'];
            $attRows = [];

            foreach ($todayAttendance as $att) {
                $hours = $att->total_hours ? round($att->total_hours / 60, 2) . 'h' : '-';
                $attRows[] = [
                    $att->employee->name,
                    $att->time_in ?? '-',
                    $att->time_out ?? '-',
                    $hours,
                    ucfirst($att->status)
                ];
            }

            $this->table($attHeaders, $attRows);
        } else {
            $this->line("   No attendance records for today.");
        }
        $this->newLine();

        // Performance summary
        $this->info("📈 Current Month Performance:");
        $currentMonth = now()->format('Y-m');
        $performance = EmployeePerformance::where('month', $currentMonth)
            ->with('employee')
            ->get();

        if ($performance->count() > 0) {
            $perfHeaders = ['Employee', 'Sales', 'Amount', 'Attendance', 'Late Days', 'Rating'];
            $perfRows = [];

            foreach ($performance as $perf) {
                $perfRows[] = [
                    $perf->employee->name,
                    $perf->sales_count,
                    '$' . number_format($perf->sales_amount, 2),
                    $perf->attendance_days . ' days',
                    $perf->late_days,
                    $perf->rating . '/5.0'
                ];
            }

            $this->table($perfHeaders, $perfRows);
        } else {
            $this->line("   No performance records for this month.");
        }

        $this->newLine();
        $this->info('✅ Data successfully loaded and displayed!');
        $this->newLine();

        return Command::SUCCESS;
    }
}
