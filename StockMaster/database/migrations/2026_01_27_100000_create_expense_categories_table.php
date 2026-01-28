<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('expense_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('description')->nullable();
            $table->timestamps();
        });

        // Seed default categories
        DB::table('expense_categories')->insert([
            ['name' => 'Rent', 'description' => 'Office or shop rent', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Utilities', 'description' => 'Electricity, water, internet, etc.', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Salaries', 'description' => 'Employee salaries', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Marketing', 'description' => 'Advertising and promotions', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Supplies', 'description' => 'Office supplies and consumables', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Maintenance', 'description' => 'Repairs and maintenance', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Other', 'description' => 'Miscellaneous expenses', 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('expense_categories');
    }
};
