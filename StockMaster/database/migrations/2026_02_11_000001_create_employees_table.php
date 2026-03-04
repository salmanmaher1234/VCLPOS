<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Shifts Management
        Schema::create('employee_shifts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->time('start_time');
            $table->time('end_time');
            $table->integer('late_threshold')->default(15); // minutes
            $table->json('weekly_off')->nullable(); // ['Sunday']
            $table->timestamps();
        });

        // 2. Employees Core
        Schema::create('employees', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('shift_id')->nullable()->constrained('employee_shifts')->onDelete('set null');
            $table->string('employee_code')->unique();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('phone')->nullable();
            $table->string('position');
            $table->string('department')->nullable();
            $table->enum('role', ['admin', 'manager', 'cashier', 'inventory_manager', 'sales_person'])->default('cashier');
            
            // Payroll fields
            $table->decimal('salary', 12, 2)->default(0);
            $table->decimal('hourly_rate', 10, 2)->default(0);
            $table->decimal('overtime_rate', 10, 2)->default(0);
            $table->decimal('commission_rate', 5, 2)->default(0); // percentage
            
            $table->date('hire_date');
            $table->string('photo')->nullable();
            $table->enum('status', ['active', 'inactive', 'on_leave'])->default('active');
            $table->json('permissions')->nullable(); // Custom granular permissions
            $table->timestamps();
            $table->softDeletes();
        });

        // 3. Attendance
        Schema::create('employee_attendance', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained()->onDelete('cascade');
            $table->date('date');
            $table->time('time_in')->nullable();
            $table->time('time_out')->nullable();
            $table->integer('total_hours')->nullable(); // in minutes
            $table->enum('status', ['present', 'absent', 'late', 'half_day', 'on_leave'])->default('present');
            $table->text('notes')->nullable();
            $table->timestamps();
            
            $table->unique(['employee_id', 'date']);
        });

        // 4. Performance
        Schema::create('employee_performance', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained()->onDelete('cascade');
            $table->string('month'); // YYYY-MM format
            $table->integer('sales_count')->default(0);
            $table->decimal('sales_amount', 12, 2)->default(0);
            $table->integer('attendance_days')->default(0);
            $table->integer('late_days')->default(0);
            $table->decimal('rating', 3, 2)->default(0); // 0-5 rating
            $table->text('feedback')->nullable();
            $table->json('metrics')->nullable();
            $table->timestamps();
            
            $table->unique(['employee_id', 'month']);
        });

        // 5. Leave Management
        Schema::create('employee_leaves', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained()->onDelete('cascade');
            $table->enum('type', ['sick', 'casual', 'paid', 'unpaid'])->default('casual');
            $table->date('start_date');
            $table->date('end_date');
            $table->text('reason')->nullable();
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->unsignedBigInteger('approved_by')->nullable();
            $table->timestamps();
        });

        // 6. Payroll System
        Schema::create('employee_payrolls', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained()->onDelete('cascade');
            $table->string('month'); // YYYY-MM
            $table->decimal('basic_salary', 12, 2)->default(0);
            $table->decimal('bonus', 12, 2)->default(0);
            $table->decimal('commission', 12, 2)->default(0);
            $table->decimal('overtime_pay', 12, 2)->default(0);
            $table->decimal('late_deduction', 12, 2)->default(0);
            $table->decimal('advance_salary', 12, 2)->default(0);
            $table->decimal('net_salary', 12, 2)->default(0);
            $table->enum('status', ['paid', 'unpaid'])->default('unpaid');
            $table->date('payment_date')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            
            $table->unique(['employee_id', 'month']);
        });

        // 7. Employee Documents
        Schema::create('employee_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained()->onDelete('cascade');
            $table->string('title');
            $table->string('type'); // CNIC, Resume, Contract, etc.
            $table->string('file_path');
            $table->timestamps();
        });

        // 8. Activity Logs
        Schema::create('employee_activity_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->nullable()->constrained('employees')->onDelete('set null');
            $table->string('action'); // e.g., 'created_order', 'updated_price'
            $table->string('module'); // e.g., 'orders', 'inventory'
            $table->text('description')->nullable();
            $table->ipAddress('ip_address')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employee_activity_logs');
        Schema::dropIfExists('employee_documents');
        Schema::dropIfExists('employee_payrolls');
        Schema::dropIfExists('employee_leaves');
        Schema::dropIfExists('employee_performance');
        Schema::dropIfExists('employee_attendance');
        Schema::dropIfExists('employees');
        Schema::dropIfExists('employee_shifts');
    }
};
