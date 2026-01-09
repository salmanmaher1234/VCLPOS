<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class ProductReturnController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();
        $query = \App\Models\ProductReturn::with('product')->where('user_id', $user->id);

        if ($request->has('start_date') && $request->start_date) {
            $query->whereDate('created_at', '>=', $request->start_date);
        }
        if ($request->has('end_date') && $request->end_date) {
            $query->whereDate('created_at', '<=', $request->end_date);
        }

        $returns = $query->latest()->paginate($request->get('per_page', 20));

        // Format for frontend
        $formattedReturns = $returns->getCollection()->map(function ($ret) {
            return [
                'id' => $ret->id,
                'date' => $ret->created_at->format('Y-m-d'),
                'time' => $ret->created_at->format('H:i'),
                'product_name' => $ret->product ? $ret->product->name : 'Unknown Product',
                'quantity' => $ret->quantity,
                'type' => ucfirst($ret->return_type),
                'amount' => (float) $ret->refund_amount,
                'reason' => $ret->reason ?? '-',
            ];
        });

        return response()->json([
            'data' => $formattedReturns,
            'total' => $returns->total(),
            'current_page' => $returns->currentPage(),
            'last_page' => $returns->lastPage(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|integer|min:1',
            'return_type' => 'required|in:refund,replace',
            'reason' => 'nullable|string',
        ]);

        $product = \App\Models\Product::findOrFail($validated['product_id']);

        // Calculate Refund Amount
        $refundAmount = 0;
        if ($validated['return_type'] === 'refund') {
            $refundAmount = $product->price * $validated['quantity'];
        }

        // DB Transaction
        $return = \Illuminate\Support\Facades\DB::transaction(function () use ($validated, $product, $refundAmount) {
            // Create Record
            $ret = \App\Models\ProductReturn::create([
                'user_id' => auth()->id(),
                'product_id' => $validated['product_id'],
                'quantity' => $validated['quantity'],
                'return_type' => $validated['return_type'],
                'refund_amount' => $refundAmount,
                'reason' => $validated['reason'],
            ]);

            // Inventory Logic
            if ($validated['return_type'] === 'refund') {
                // Refund: We take product BACK (+Stock), give money OUT.
                $product->increment('quantity', $validated['quantity']);
            }
            // Replace: We take Bad product BACK (+1), give New product OUT (-1). Net change = 0.
            // So we do NOT update stock for 'replace' type.

            return $ret;
        });

        return response()->json([
            'message' => 'Return processed successfully',
            'return' => $return
        ], 201);
    }
}
