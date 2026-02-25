<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ExpenseController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Expense::with(['category', 'user'])
            ->orderBy('date', 'desc')
            ->orderBy('created_at', 'desc');

        if ($request->has('start_date') && $request->has('end_date')) {
            $query->whereBetween('date', [$request->start_date, $request->end_date]);
        }

        if ($request->has('category_id')) {
            $query->where('expense_category_id', $request->category_id);
        }

        return response()->json($query->paginate(20));
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'expense_category_id' => 'required|exists:expense_categories,id',
            'amount' => 'required|numeric|min:0.01',
            'date' => 'required|date',
            'reference_no' => 'nullable|string|max:255',
            'description' => 'nullable|string',
        ]);

        $expense = Expense::create([
            'user_id' => $request->user()->id,
            'expense_category_id' => $validated['expense_category_id'],
            'amount' => $validated['amount'],
            'date' => $validated['date'],
            'reference_no' => $validated['reference_no'],
            'description' => $validated['description'],
        ]);

        return response()->json([
            'message' => 'Expense created successfully',
            'expense' => $expense->load('category', 'user')
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Expense $expense)
    {
        return response()->json($expense->load('category', 'user'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Expense $expense)
    {
        $validated = $request->validate([
            'expense_category_id' => 'required|exists:expense_categories,id',
            'amount' => 'required|numeric|min:0.01',
            'date' => 'required|date',
            'reference_no' => 'nullable|string|max:255',
            'description' => 'nullable|string',
        ]);

        $expense->update($validated);

        return response()->json([
            'message' => 'Expense updated successfully',
            'expense' => $expense->load('category', 'user')
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Expense $expense)
    {
        $expense->delete();
        return response()->json(['message' => 'Expense deleted successfully']);
    }

    /**
     * Get all expense categories.
     */
    public function categories()
    {
        return response()->json(ExpenseCategory::all());
    }
}
