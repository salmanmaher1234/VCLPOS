<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('product_returns', function (Blueprint $table) {
            $table->string('status')->default('pending')->after('quantity'); // pending, approved, rejected, canceled, completed
            $table->string('customer_name')->nullable()->after('product_id');
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete()->after('user_id');
            $table->timestamp('approved_at')->nullable()->after('approved_by');
            $table->boolean('refund_paid')->default(false)->after('refund_amount');
            $table->timestamp('refund_paid_at')->nullable()->after('refund_paid');
        });
    }

    public function down(): void
    {
        Schema::table('product_returns', function (Blueprint $table) {
            $table->dropForeign(['approved_by']);
            $table->dropColumn(['status', 'customer_name', 'approved_by', 'approved_at', 'refund_paid', 'refund_paid_at']);
        });
    }
};
