<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class ProductReturnController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();
        // If owner/admin, show all. If staff, maybe only their own? For now, show all for owner.
        // Assuming simple role check or just showing all for now as requested "approval by myself"
        $query = \App\Models\ProductReturn::with(['product', 'user', 'approver']);

        if ($request->has('start_date') && $request->start_date) {
            $query->whereDate('created_at', '>=', $request->start_date);
        }
        if ($request->has('end_date') && $request->end_date) {
            $query->whereDate('created_at', '<=', $request->end_date);
        }
        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        $returns = $query->latest()->paginate($request->get('per_page', 20));

        // Format for frontend
        $formattedReturns = $returns->getCollection()->map(function ($ret) {
            return [
                'id' => $ret->id,
                'date' => $ret->created_at->format('Y-m-d'),
                'time' => $ret->created_at->format('H:i'),
                'product_name' => $ret->product_name ?? ($ret->product ? $ret->product->name : 'Unknown Product'),
                'customer_name' => $ret->customer_name ?? 'Walk-in',
                'quantity' => $ret->quantity,
                'type' => ucfirst($ret->return_type),
                'amount' => (float) $ret->refund_amount,
                'reason' => $ret->reason ?? '-',
                'status' => ucfirst($ret->status),
                'approved_by' => $ret->approver ? $ret->approver->name : '-',
                'refund_paid' => (bool) $ret->refund_paid,
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
            'product_id' => 'nullable|exists:products,id',
            'product_name' => 'nullable|required_without:product_id|string',
            'price' => 'nullable|required_without:product_id|numeric|min:0',
            'quantity' => 'required|integer|min:1',
            'return_type' => 'required|in:refund,replace',
            'reason' => 'nullable|string',
            'customer_name' => 'nullable|string',
        ]);

        $refundAmount = 0;
        $productName = $validated['product_name'] ?? null;

        if ($validated['product_id']) {
            $product = \App\Models\Product::findOrFail($validated['product_id']);
            $productName = $product->name; // Save name for history
            if ($validated['return_type'] === 'refund') {
                $refundAmount = $product->price * $validated['quantity'];
            }
        } else {
            // Custom Product Calculation
            if ($validated['return_type'] === 'refund') {
                $refundAmount = $validated['price'] * $validated['quantity'];
            }
        }

        try {
            // Create Pending Record
            $return = \App\Models\ProductReturn::create([
                'user_id' => auth()->id(),
                'product_id' => $validated['product_id'] ?? null,
                'product_name' => $productName,
                'customer_name' => $validated['customer_name'],
                'quantity' => $validated['quantity'],
                'return_type' => $validated['return_type'],
                'refund_amount' => $refundAmount,
                'reason' => $validated['reason'],
                'status' => 'pending', // Default
            ]);

            return response()->json([
                'message' => 'Return request submitted for approval.',
                'return' => $return
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Server Error: ' . $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ], 500);
        }
    }

    public function updateStatus(Request $request, $id)
    {
        $validated = $request->validate([
            'status' => 'required|in:approved,rejected,completed',
            'rejection_reason' => 'nullable|string',
        ]);

        $return = \App\Models\ProductReturn::findOrFail($id);

        if ($return->status === 'approved' && $validated['status'] === 'approved') {
            return response()->json(['message' => 'Already approved'], 200);
        }

        // Handle Approval Logic (One-time stock update)
        if ($validated['status'] === 'approved' && $return->status === 'pending') {
            \Illuminate\Support\Facades\DB::transaction(function () use ($return) {
                // Inventory Logic
                if ($return->return_type === 'refund' && $return->product_id) {
                    $product = \App\Models\Product::find($return->product_id);
                    if ($product) {
                        $product->increment('quantity', $return->quantity);
                    }
                }

                $return->update([
                    'status' => 'approved',
                    'approved_by' => auth()->id(),
                    'approved_at' => now(),
                ]);
            });
        } elseif ($validated['status'] === 'rejected') {
            $return->update([
                'status' => 'rejected',
                'rejection_reason' => $validated['rejection_reason'] ?? null,
            ]);
        } elseif ($validated['status'] === 'completed') {

            $return->update([
                'status' => 'completed',
                'refund_paid' => true,
                'refund_paid_at' => now()
            ]);
        }

        return response()->json([
            'message' => 'Return status updated',
            'return' => $return
        ]);
    }
}
