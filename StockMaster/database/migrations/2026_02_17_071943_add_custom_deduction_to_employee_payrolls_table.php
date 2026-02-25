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
        Schema::table('employee_payrolls', function (Blueprint $table) {
            $table->decimal('custom_deduction', 12, 2)->default(0)->after('late_deduction');
            $table->text('custom_deduction_reason')->nullable()->after('custom_deduction');
            $table->decimal('custom_allowance', 12, 2)->default(0)->after('custom_deduction_reason');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employee_payrolls', function (Blueprint $table) {
            $table->dropColumn(['custom_deduction', 'custom_deduction_reason', 'custom_allowance']);
        });
    }
};
