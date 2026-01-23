<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PurchaseController extends Controller
{
    public function index(Request $request)
    {
        $perPage = $request->input('per_page', 10);
        $purchases = Purchase::with(['supplier'])
            ->withCount('items')
            ->latest()
            ->paginate($perPage);

        return response()->json($purchases);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'supplier_id' => 'required|exists:suppliers,id',
            'date' => 'required|date',
            'reference_no' => 'nullable|string',
            'note' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_cost' => 'required|numeric|min:0',
        ]);

        return DB::transaction(function () use ($validated, $request) {
            $totalAmount = 0;
            foreach ($validated['items'] as $item) {
                $totalAmount += $item['quantity'] * $item['unit_cost'];
            }

            $purchase = Purchase::create([
                'user_id' => $request->user()->id,
                'supplier_id' => $validated['supplier_id'],
                'reference_no' => $validated['reference_no'],
                'date' => $validated['date'],
                'total_amount' => $totalAmount,
                'note' => $validated['note'],
                'status' => 'received',
            ]);

            $responseItems = [];

            foreach ($validated['items'] as $item) {
                PurchaseItem::create([
                    'purchase_id' => $purchase->id,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'unit_cost' => $item['unit_cost'],
                    'subtotal' => $item['quantity'] * $item['unit_cost'],
                ]);

                // Increment product quantity (Stock In)
                $product = Product::findOrFail($item['product_id']);
                $product->increment('quantity', $item['quantity']);

                // Optional: Update product cost price to latest purchase price?
                // $product->update(['cost' => $item['unit_cost']]); 
                // Ensuring we only update if needed. For now, strict increment.
            }

            return response()->json([
                'message' => 'Purchase created and stock received successfully',
                'purchase' => $purchase->load('items.product', 'supplier'),
            ], 201);
        });
    }

    public function show($id)
    {
        $purchase = Purchase::with(['items.product', 'supplier'])
            ->findOrFail($id);

        return response()->json($purchase);
    }

    public function destroy($id)
    {
        $purchase = Purchase::with('items')->findOrFail($id);

        return DB::transaction(function () use ($purchase) {
            // Reverse stock changes (Stock Out/Cancel)
            foreach ($purchase->items as $item) {
                $product = Product::find($item->product_id);
                if ($product) {
                    $product->decrement('quantity', $item->quantity);
                }
            }

            $purchase->delete();

            return response()->json([
                'message' => 'Purchase deleted and stock reversed successfully',
            ]);
        });
    }
}
