<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\PurchaseReturn;
use App\Models\PurchaseReturnItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PurchaseReturnController extends Controller
{
    public function index(Request $request)
    {
        $perPage = $request->input('per_page', 10);
        $returns = PurchaseReturn::with(['supplier'])
            ->withCount('items')
            ->latest()
            ->paginate($perPage);

        return response()->json($returns);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'supplier_id' => 'required|exists:suppliers,id',
            'date' => 'required|date',
            // 'reference' => 'required|string|unique:purchase_returns,reference', // Auto-generated now
            'note' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_cost' => 'required|numeric|min:0',
        ]);

        return DB::transaction(function () use ($validated, $request) {
            // Auto-generate reference if not present or just overwrite to ensure system sequence
            // Format: PR-00001
            $latestReturn = PurchaseReturn::latest()->first();
            $nextId = $latestReturn ? $latestReturn->id + 1 : 1;
            $reference = 'PR-' . str_pad($nextId, 5, '0', STR_PAD_LEFT);

            $totalAmount = 0;
            foreach ($validated['items'] as $item) {
                $totalAmount += $item['quantity'] * $item['unit_cost'];
            }

            $purchaseReturn = PurchaseReturn::create([
                'user_id' => $request->user()->id,
                'supplier_id' => $validated['supplier_id'],
                'reference' => $reference, // Use generated reference
                'date' => $validated['date'],
                'total_amount' => $totalAmount,
                'note' => $validated['note'],
                'status' => 'completed',
            ]);

            foreach ($validated['items'] as $item) {
                PurchaseReturnItem::create([
                    'purchase_return_id' => $purchaseReturn->id,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'unit_cost' => $item['unit_cost'],
                    'subtotal' => $item['quantity'] * $item['unit_cost'],
                ]);

                // Decrement product quantity
                $product = Product::findOrFail($item['product_id']);

                // Real-time stock update
                $product->decrement('quantity', $item['quantity']);
            }

            return response()->json([
                'message' => 'Purchase return created successfully',
                'purchase_return' => $purchaseReturn->load('items.product', 'supplier'),
            ], 201);
        });
    }

    public function show($id)
    {
        $purchaseReturn = PurchaseReturn::with(['items.product', 'supplier'])
            ->findOrFail($id);

        return response()->json($purchaseReturn);
    }

    public function destroy($id)
    {
        $purchaseReturn = PurchaseReturn::with('items')->findOrFail($id);

        return DB::transaction(function () use ($purchaseReturn) {
            // Reverse stock changes
            foreach ($purchaseReturn->items as $item) {
                $product = Product::find($item->product_id);
                if ($product) {
                    $product->increment('quantity', $item->quantity);
                }
            }

            $purchaseReturn->delete();

            return response()->json([
                'message' => 'Purchase return deleted and stock reversed successfully',
            ]);
        });
    }
}
