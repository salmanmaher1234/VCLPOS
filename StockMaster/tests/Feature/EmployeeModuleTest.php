<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Employee;
use App\Models\EmployeeShift;
use App\Models\EmployeeLeave;
use App\Models\EmployeePayroll;
use App\Models\EmployeeActivityLog;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Carbon\Carbon;

class EmployeeModuleTest extends TestCase
{
    use RefreshDatabase;

    protected $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    /** @test */
    public function test_can_fetch_shifts()
    {
        EmployeeShift::create([
            'user_id' => $this->user->id,
            'name' => 'Morning Shift',
            'start_time' => '09:00:00',
            'end_time' => '17:00:00',
            'late_threshold' => 15,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
                         ->getJson('/api/employee-shifts');

        $response->assertStatus(200)
                 ->assertJsonCount(1)
                 ->assertJsonFragment(['name' => 'Morning Shift']);
    }

    /** @test */
    public function test_can_apply_for_leave()
    {
        $employee = Employee::create([
            'user_id' => $this->user->id,
            'employee_code' => 'EMP001',
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'position' => 'Developer',
            'salary' => 5000,
            'hire_date' => '2026-01-01',
            'status' => 'active',
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
                         ->postJson('/api/employee-leaves', [
                             'employee_id' => $employee->id,
                             'type' => 'casual',
                             'start_date' => '2026-03-01',
                             'end_date' => '2026-03-05',
                             'reason' => 'Family vacation',
                         ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('employee_leaves', [
            'employee_id' => $employee->id,
            'type' => 'casual',
            'status' => 'pending',
        ]);
    }

    /** @test */
    public function test_can_generate_payrolls()
    {
        $employee = Employee::create([
            'user_id' => $this->user->id,
            'employee_code' => 'EMP001',
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'position' => 'Developer',
            'salary' => 5000,
            'hire_date' => '2026-01-01',
            'status' => 'active',
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
                         ->postJson('/api/employee-payrolls/generate', [
                             'month' => Carbon::now()->format('Y-m'),
                         ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('employee_payrolls', [
            'employee_id' => $employee->id,
            'month' => Carbon::now()->format('Y-m'),
            'basic_salary' => 5000,
        ]);
    }

    /** @test */
    public function test_can_fetch_activity_logs()
    {
        $employee = Employee::create([
            'user_id' => $this->user->id,
            'employee_code' => 'EMP001',
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'position' => 'Developer',
            'salary' => 5000,
            'hire_date' => '2026-01-01',
            'status' => 'active',
        ]);

        EmployeeActivityLog::create([
            'employee_id' => $employee->id,
            'action' => 'login',
            'module' => 'auth',
            'description' => 'Employee logged in',
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
                         ->getJson('/api/employee-activity-logs');

        $response->assertStatus(200)
                 ->assertJsonCount(1)
                 ->assertJsonFragment(['action' => 'login']);
    }
}
