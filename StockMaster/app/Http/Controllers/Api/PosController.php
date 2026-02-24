<?php

namespace App\Http\Controllers\Api;

use App\Models\Product;
use App\Models\Customer;
use App\Models\Sale;
use App\Models\SaleItem;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;

class PosController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'customer_id' => 'nullable|exists:customers,id',
            'employee_id' => 'nullable|exists:employees,id',
            'cart' => 'required|array',
            'cart.*.id' => 'required|exists:products,id',
            'cart.*.qty' => 'required|integer|min:1',
            'cart.*.price' => 'required|numeric|min:0',
            'total_amount' => 'required|numeric|min:0',
            'paid_amount' => 'required|numeric|min:0',
            'payment_method' => 'required|string',
            'tax_rate' => 'nullable|numeric|min:0|max:100',
            'discount_amount' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string|max:500',
        ]);

        $sale = DB::transaction(function () use ($validated, $request) {
            // Calculate tax amount
            $taxRate = $validated['tax_rate'] ?? 0;
            $discountAmount = $validated['discount_amount'] ?? 0;

            // Calculate subtotal from cart items
            $subtotal = 0;
            foreach ($validated['cart'] as $item) {
                $subtotal += $item['qty'] * $item['price'];
            }

            $taxAmount = ($subtotal * $taxRate) / 100;
            $totalAmount = $subtotal + $taxAmount - $discountAmount;

            // Create Sale
            $sale = Sale::create([
                'user_id' => $request->user()->id,
                'customer_id' => $validated['customer_id'] ?? null,
                'employee_id' => $validated['employee_id'] ?? null,
                'total_amount' => $totalAmount,
                'paid_amount' => $validated['paid_amount'],
                'tax_rate' => $taxRate,
                'tax_amount' => $taxAmount,
                'discount_amount' => $discountAmount,
                'payment_method' => $validated['payment_method'],
                'status' => 'completed',
                'notes' => $validated['notes'] ?? null,
            ]);

            // Create Sale Items and Update Stock
            foreach ($validated['cart'] as $item) {
                $product = Product::where('user_id', $request->user()->id)
                    ->findOrFail($item['id']);

                // Check if enough stock is available
                if ($product->quantity < $item['qty']) {
                    throw new \Exception("Insufficient stock for product: {$product->name}");
                }

                SaleItem::create([
                    'sale_id' => $sale->id,
                    'product_id' => $item['id'],
                    'quantity' => $item['qty'],
                    'price' => $item['price'],
                    'total' => $item['qty'] * $item['price'],
                ]);

                // Decrement Stock
                $product->decrement('quantity', $item['qty']);
            }
            // Log Activity
            if (!empty($validated['employee_id'])) {
                \App\Models\EmployeeActivityLog::create([
                    'employee_id' => $validated['employee_id'],
                    'action' => 'processed_sale',
                    'module' => 'sales',
                    'description' => "Processed sale #{$sale->id} for $" . number_format($totalAmount, 2),
                    'ip_address' => $request->ip()
                ]);
            }

            return $sale;
        });

        return response()->json([
            'success' => true,
            'message' => 'Sale completed successfully!',
            'sale_id' => $sale->id,
            'receipt_number' => $sale->receipt_number
        ]);
    }
}
