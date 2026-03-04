<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    public function index(Request $request)
    {
        $perPage = $request->get('per_page', 10);
        $customers = Customer::where('user_id', $request->user()->id)
            ->latest()
            ->paginate($perPage);

        return response()->json($customers);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'required|string|max:20',
            'address' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:100',
            'country' => 'nullable|string|max:100',
        ]);

        $validated['user_id'] = $request->user()->id;

        $customer = Customer::create($validated);

        return response()->json([
            'message' => 'Customer created successfully',
            'customer' => $customer
        ], 201);
    }

    public function show(Request $request, $id)
    {
        $customer = Customer::where('user_id', $request->user()->id)
            ->findOrFail($id);

        return response()->json($customer);
    }

    public function update(Request $request, $id)
    {
        $customer = Customer::where('user_id', $request->user()->id)
            ->findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'required|string|max:20',
            'address' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:100',
            'country' => 'nullable|string|max:100',
        ]);

        $customer->update($validated);

        return response()->json([
            'message' => 'Customer updated successfully',
            'customer' => $customer
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $customer = Customer::where('user_id', $request->user()->id)
            ->findOrFail($id);

        $customer->delete();

        return response()->json([
            'message' => 'Customer deleted successfully'
        ]);
    }

    public function activity(Request $request, $id)
    {
        $customer = Customer::where('user_id', $request->user()->id)->findOrFail($id);

        // Fetch Sales
        $sales = \App\Models\Sale::where('user_id', $request->user()->id)
            ->where('customer_id', $id)
            ->with(['items.product'])
            ->get()
            ->map(function ($sale) {
                return [
                    'id' => 'sale_' . $sale->id,
                    'record_id' => $sale->id,
                    'timestamp' => $sale->created_at,
                    'date' => $sale->created_at->format('Y-m-d H:i'),
                    'bill_no' => $sale->receipt_number ?? '#' . str_pad($sale->id, 6, '0', STR_PAD_LEFT),
                    'product' => $sale->items->first() && $sale->items->first()->product 
                                 ? $sale->items->first()->product->name . ($sale->items->count() > 1 ? ' (+' . ($sale->items->count() - 1) . ' more)' : '') 
                                 : 'Unknown Items',
                    'amount' => (float)$sale->total_amount,
                    'type' => $sale->payment_method ?? 'Purchase',
                    'status' => 'accept', // POS sales are completed purchases
                    'source' => 'sale'
                ];
            });

        // Fetch Returns
        $returns = \App\Models\ProductReturn::where('user_id', $request->user()->id)
            ->where('customer_name', $customer->name)
            ->with('product')
            ->get()
            ->map(function ($ret) {
                return [
                    'id' => 'return_' . $ret->id,
                    'record_id' => $ret->id,
                    'timestamp' => $ret->created_at,
                    'date' => $ret->created_at->format('Y-m-d H:i'),
                    'bill_no' => 'RET-' . str_pad($ret->id, 6, '0', STR_PAD_LEFT),
                    'product' => $ret->product_name ?? ($ret->product ? $ret->product->name : 'Unknown Product'),
                    'amount' => (float)$ret->refund_amount,
                    'type' => ucfirst($ret->return_type),
                    'status' => strtolower($ret->status) === 'pending' ? 'refund' : 
                                (strtolower($ret->status) === 'approved' || strtolower($ret->status) === 'completed' ? 'refund' : 'reject'),
                    'source' => 'return'
                ];
            });

        // Merge and sort descending
        $activity = $sales->concat($returns)->sortByDesc('timestamp')->values();

        return response()->json([
            'activity' => $activity
        ]);
    }
}
