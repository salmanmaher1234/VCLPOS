<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Sale;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class SaleController extends Controller
{
    /**
     * Display a listing of sales with stats.
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        $query = Sale::where('user_id', $user->id);

        // Date Filtering
        if ($request->has('start_date') && $request->start_date) {
            $query->whereDate('created_at', '>=', $request->start_date);
        }
        if ($request->has('end_date') && $request->end_date) {
            $query->whereDate('created_at', '<=', $request->end_date);
        }

        // Clone query for stats to avoid modifying the main pagination query
        $statsQuery = clone $query;

        // Calculate Stats
        $totalRevenue = $statsQuery->sum('total_amount');
        $transactionCount = $statsQuery->count();
        $avgOrderValue = $transactionCount > 0 ? $totalRevenue / $transactionCount : 0;

        // Get Paginated Sales
        // We eager load items and customer for the modal details
        $sales = $query->with(['customer', 'items.product'])
            ->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 20));

        // Format the response
        $formattedSales = $sales->getCollection()->map(function ($sale) {
            return [
                'id' => $sale->id,
                'sale_number' => $sale->sale_number ?? str_pad($sale->id, 6, '0', STR_PAD_LEFT),
                'customer_name' => $sale->customer ? $sale->customer->name : 'Walk-in Customer',
                'total_amount' => (float) $sale->total_amount,
                'status' => ucfirst($sale->status ?? 'completed'),
                'date' => $sale->created_at->format('Y-m-d'),
                'time' => $sale->created_at->format('H:i'),
                'items_count' => $sale->items->sum('quantity'),
                'first_product_name' => $sale->items->first() && $sale->items->first()->product ? $sale->items->first()->product->name : 'Unknown Product',
                'items' => $sale->items->map(function ($item) {
                    return [
                        'product_name' => $item->product ? $item->product->name : 'Unknown Product',
                        'quantity' => $item->quantity,
                        'price' => (float) $item->price,
                        'total' => (float) $item->total
                    ];
                })
            ];
        });

        // Paginate the formatted collection
        $paginatedResponse = new \Illuminate\Pagination\LengthAwarePaginator(
            $formattedSales,
            $sales->total(),
            $sales->perPage(),
            $sales->currentPage(),
            ['path' => \Illuminate\Pagination\Paginator::resolveCurrentPath()]
        );

        return response()->json([
            'stats' => [
                'total_revenue' => $totalRevenue,
                'transaction_count' => $transactionCount,
                'avg_order_value' => round($avgOrderValue, 2)
            ],
            'sales' => $paginatedResponse
        ]);
    }
}
