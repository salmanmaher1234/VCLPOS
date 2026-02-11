<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Employee;
use App\Models\EmployeeAttendance;
use App\Models\EmployeePerformance;
use App\Models\User;
use Carbon\Carbon;

class EmployeeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get the first user or create a test user
        $user = User::first();
        
        if (!$user) {
            $user = User::create([
                'name' => 'Test Admin',
                'email' => 'admin@test.com',
                'password' => bcrypt('password'),
            ]);
        }

        $employees = [
            [
                'name' => 'John Smith',
                'email' => 'john.smith@company.com',
                'phone' => '1234567890',
                'position' => 'Sales Manager',
                'department' => 'Sales',
                'role' => 'manager',
                'salary' => 50000,
                'hire_date' => '2026-02-01',
                'permissions' => ['manage_sales', 'view_reports', 'manage_team'],
            ],
            [
                'name' => 'Sarah Johnson',
                'email' => 'sarah.johnson@company.com',
                'phone' => '0987654321',
                'position' => 'Cashier',
                'department' => 'Sales',
                'role' => 'cashier',
                'salary' => 30000,
                'hire_date' => '2026-02-05',
                'permissions' => ['pos_access', 'process_sales'],
            ],
            [
                'name' => 'Michael Chen',
                'email' => 'michael.chen@company.com',
                'phone' => '5551234567',
                'position' => 'Inventory Manager',
                'department' => 'Warehouse',
                'role' => 'inventory_manager',
                'salary' => 45000,
                'hire_date' => '2026-01-15',
                'permissions' => ['manage_inventory', 'view_stock', 'create_adjustments'],
            ],
            [
                'name' => 'Emily Rodriguez',
                'email' => 'emily.rodriguez@company.com',
                'phone' => '5559876543',
                'position' => 'Sales Person',
                'department' => 'Sales',
                'role' => 'sales_person',
                'salary' => 35000,
                'hire_date' => '2026-02-10',
                'permissions' => ['create_sales', 'view_products'],
            ],
            [
                'name' => 'David Wilson',
                'email' => 'david.wilson@company.com',
                'phone' => '5555555555',
                'position' => 'System Administrator',
                'department' => 'IT',
                'role' => 'admin',
                'salary' => 60000,
                'hire_date' => '2025-12-01',
                'permissions' => ['full_access', 'manage_users', 'system_settings', 'view_all_reports'],
            ],
            [
                'name' => 'Lisa Anderson',
                'email' => 'lisa.anderson@company.com',
                'phone' => '5551112222',
                'position' => 'Cashier',
                'department' => 'Sales',
                'role' => 'cashier',
                'salary' => 28000,
                'hire_date' => '2026-02-08',
                'permissions' => ['pos_access', 'process_sales'],
            ],
            [
                'name' => 'Robert Taylor',
                'email' => 'robert.taylor@company.com',
                'phone' => '5553334444',
                'position' => 'Store Manager',
                'department' => 'Management',
                'role' => 'manager',
                'salary' => 55000,
                'hire_date' => '2025-11-20',
                'permissions' => ['manage_sales', 'view_reports', 'manage_team', 'view_all_data'],
            ],
        ];

        $this->command->info('Creating employees...');

        foreach ($employees as $index => $employeeData) {
            // Generate employee code
            $employeeCode = 'EMP' . str_pad($index + 1, 5, '0', STR_PAD_LEFT);

            $employee = Employee::create([
                'user_id' => $user->id,
                'employee_code' => $employeeCode,
                'name' => $employeeData['name'],
                'email' => $employeeData['email'],
                'phone' => $employeeData['phone'],
                'position' => $employeeData['position'],
                'department' => $employeeData['department'],
                'role' => $employeeData['role'],
                'salary' => $employeeData['salary'],
                'hire_date' => $employeeData['hire_date'],
                'status' => 'active',
                'permissions' => $employeeData['permissions'],
            ]);

            $this->command->info("✅ Created: {$employee->name} ({$employeeCode})");

            // Create attendance records for the past 7 days
            for ($i = 6; $i >= 0; $i--) {
                $date = Carbon::now()->subDays($i);
                
                // Random time-in between 8:30 and 9:30
                $timeIn = Carbon::create($date->year, $date->month, $date->day, 8, rand(30, 90));
                
                // Random time-out between 17:00 and 18:00
                $timeOut = Carbon::create($date->year, $date->month, $date->day, 17, rand(0, 60));
                
                // Determine status based on time-in
                $status = $timeIn->format('H:i') > '09:00' ? 'late' : 'present';
                
                // Occasional absences
                if (rand(1, 10) > 8) {
                    $status = 'absent';
                    $timeIn = null;
                    $timeOut = null;
                }

                if ($timeIn && $timeOut) {
                    $totalHours = abs($timeOut->diffInMinutes($timeIn));
                } else {
                    $totalHours = null;
                }

                EmployeeAttendance::create([
                    'employee_id' => $employee->id,
                    'date' => $date->toDateString(),
                    'time_in' => $timeIn ? $timeIn->format('H:i:s') : null,
                    'time_out' => $timeOut ? $timeOut->format('H:i:s') : null,
                    'total_hours' => $totalHours,
                    'status' => $status,
                    'notes' => $status === 'absent' ? 'Day off' : null,
                ]);
            }

            // Create performance record for current month
            $presentDays = EmployeeAttendance::where('employee_id', $employee->id)
                ->whereMonth('date', Carbon::now()->month)
                ->where('status', '!=', 'absent')
                ->count();

            $lateDays = EmployeeAttendance::where('employee_id', $employee->id)
                ->whereMonth('date', Carbon::now()->month)
                ->where('status', 'late')
                ->count();

            EmployeePerformance::create([
                'employee_id' => $employee->id,
                'month' => Carbon::now()->format('Y-m'),
                'sales_count' => rand(20, 100),
                'sales_amount' => rand(10000, 50000),
                'attendance_days' => $presentDays,
                'late_days' => $lateDays,
                'rating' => rand(30, 50) / 10, // 3.0 to 5.0
                'feedback' => 'Good performance overall. Keep up the good work!',
            ]);
        }

        $this->command->info("\n✨ Successfully created " . count($employees) . " employees with attendance and performance data!");
    }
}
