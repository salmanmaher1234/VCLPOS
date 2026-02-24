<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});


// Authentication Routes - Using API Controller for React
Route::post('/login', [App\Http\Controllers\Api\AuthController::class, 'login']);
Route::post('/register', [App\Http\Controllers\Api\AuthController::class, 'register']);
Route::post('/logout', [App\Http\Controllers\Api\AuthController::class, 'logout'])->middleware('auth:sanctum');
Route::post('/forgot-password', [App\Http\Controllers\Auth\PasswordResetLinkController::class, 'store']);


// Dashboard Data
Route::middleware('auth:sanctum')->get('/dashboard-data', function (Request $request) {
    $user = $request->user();

    // Get stats using DB facade to strictly bypass scopes
    $totalSales = (float) \Illuminate\Support\Facades\DB::table('sales')
        ->where('user_id', $user->id)
        ->sum('total_amount');

    $revenue = $totalSales;

    $customersCount = (int) \Illuminate\Support\Facades\DB::table('customers')
        ->where('user_id', $user->id)
        ->count();

    $productsCount = (int) \Illuminate\Support\Facades\DB::table('products')
        ->where('user_id', $user->id)
        ->count();

    $suppliersCount = (int) \Illuminate\Support\Facades\DB::table('suppliers')
        ->where('user_id', $user->id)
        ->count();

    // Get recent sales raw
    $recentSales = \Illuminate\Support\Facades\DB::table('sales')
        ->where('sales.user_id', $user->id)
        ->leftJoin('customers', 'sales.customer_id', '=', 'customers.id')
        ->select('sales.id', 'sales.total_amount', 'sales.status', 'customers.name as customer_name')
        ->orderBy('sales.created_at', 'desc')
        ->limit(10)
        ->get()
        ->map(function ($sale) {
            return [
                'id' => $sale->id,
                'customer' => $sale->customer_name ?? 'Walk-in Customer',
                'status' => ucfirst($sale->status ?? 'completed'),
                'total' => (float) $sale->total_amount
            ];
        });

    return response()->json([
        'stats' => [
            'totalSales' => $totalSales,
            'revenue' => $revenue,
            'customersCount' => $customersCount,
            'productsCount' => $productsCount,
            'suppliersCount' => $suppliersCount
        ],
        'recentSales' => $recentSales
    ]);
});

// Products API
Route::middleware('auth:sanctum')->apiResource('products', App\Http\Controllers\Api\ProductController::class);

// Customers API
Route::middleware('auth:sanctum')->apiResource('customers', App\Http\Controllers\Api\CustomerController::class);

// Suppliers API
Route::middleware('auth:sanctum')->apiResource('suppliers', App\Http\Controllers\Api\SupplierController::class);

// Adjustments API
Route::middleware('auth:sanctum')->apiResource('adjustments', App\Http\Controllers\Api\AdjustmentController::class);

// POS API
Route::middleware('auth:sanctum')->post('/pos', [App\Http\Controllers\Api\PosController::class, 'store']);

// Sales List API
Route::get('/sales', [App\Http\Controllers\Api\SaleController::class, 'index'])->middleware('auth:sanctum');

// Profile API
Route::put('/profile', [App\Http\Controllers\Api\ProfileController::class, 'update'])->middleware('auth:sanctum');
Route::put('/profile/password', [App\Http\Controllers\Api\ProfileController::class, 'updatePassword'])->middleware('auth:sanctum');

// Returns API (Customer Returns)
Route::get('/returns', [App\Http\Controllers\Api\ProductReturnController::class, 'index'])->middleware('auth:sanctum');
Route::post('/returns', [App\Http\Controllers\Api\ProductReturnController::class, 'store'])->middleware('auth:sanctum');
Route::put('/returns/{id}/status', [App\Http\Controllers\Api\ProductReturnController::class, 'updateStatus'])->middleware('auth:sanctum');

// Purchase Returns API (Supplier Returns)
Route::middleware('auth:sanctum')->apiResource('purchase-returns', App\Http\Controllers\Api\PurchaseReturnController::class);

// Purchases API (Supplier Stock In)
Route::middleware('auth:sanctum')->apiResource('purchases', App\Http\Controllers\Api\PurchaseController::class);

// Expenses API
Route::get('/expense-categories', [App\Http\Controllers\Api\ExpenseController::class, 'categories'])->middleware('auth:sanctum');
Route::middleware('auth:sanctum')->apiResource('expenses', App\Http\Controllers\Api\ExpenseController::class);

// Employee Management API
Route::middleware('auth:sanctum')->group(function () {
    // Employee Management Routes
    Route::apiResource('employees', App\Http\Controllers\Api\EmployeeController::class);
    Route::post('/employees/clock-in-out', [App\Http\Controllers\Api\EmployeeController::class, 'clockInOut']);
    Route::get('/employees-daily-attendance', [App\Http\Controllers\Api\EmployeeController::class, 'getDailyAttendance']);
    Route::post('/employees-batch-attendance', [App\Http\Controllers\Api\EmployeeController::class, 'batchMarkAttendance']);
    Route::get('/employees-attendance', [App\Http\Controllers\Api\EmployeeController::class, 'getAttendance']);
    Route::put('/employees-attendance/{id}', [App\Http\Controllers\Api\EmployeeController::class, 'updateAttendance']);
    Route::get('/employees-performance', [App\Http\Controllers\Api\EmployeeController::class, 'getPerformance']);
    Route::post('/employees-performance', [App\Http\Controllers\Api\EmployeeController::class, 'updatePerformance']);
    Route::get('/employees-stats', [App\Http\Controllers\Api\EmployeeController::class, 'getStats']);

    // New Module Routes
    Route::apiResource('employee-shifts', App\Http\Controllers\Api\ShiftController::class);
    Route::get('/employee-leaves', [App\Http\Controllers\Api\LeaveController::class, 'index']);
    Route::post('/employee-leaves', [App\Http\Controllers\Api\LeaveController::class, 'store']);
    Route::put('/employee-leaves/{id}/status', [App\Http\Controllers\Api\LeaveController::class, 'updateStatus']);
    
    Route::get('/employee-payrolls', [App\Http\Controllers\Api\PayrollController::class, 'index']);
    Route::post('/employee-payrolls/generate', [App\Http\Controllers\Api\PayrollController::class, 'generate']);
    Route::put('/employee-payrolls/{id}/status', [App\Http\Controllers\Api\PayrollController::class, 'updateStatus']);
    Route::put('/employee-payrolls/{id}/details', [App\Http\Controllers\Api\PayrollController::class, 'updateDetails']);
    Route::get('/employee-activity-logs', [App\Http\Controllers\Api\EmployeeController::class, 'getActivityLogs']);
    Route::post('/employees-attendance/mark', [App\Http\Controllers\Api\EmployeeController::class, 'markSingleAttendance']);
});
