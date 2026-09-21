<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Purchase;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PurchaseController extends Controller
{
    /**
     * Display a listing of purchases.
     */
    public function index(Request $request): JsonResponse
    {
        $search = $request->query('search');
        $sort = $request->query('sort', 'created_at');
        $direction = strtolower($request->query('direction', 'desc')) === 'asc' ? 'asc' : 'desc';

        $query = Purchase::with('supplier')
            ->when($search, function ($q, $search) {
                $q->where('invoice_no', 'like', "%{$search}%")
                  ->orWhereHas('supplier', fn($s) => $s->where('company_name', 'like', "%{$search}%"))
                  ->orWhere('total_amount', 'like', "%{$search}%");
            })
            ->orderBy($sort, $direction);

        if ($request->has('page') || $request->query('paginate')) {
            $perPage = (int) $request->query('per_page', 10);
            return response()->json($query->paginate($perPage));
        }

        return response()->json($query->get());
    }

    /**
     * Store a newly created purchase.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'supplier_id' => 'required|exists:suppliers,id',
            'invoice_no' => 'required|string|max:255|unique:purchases,invoice_no',
            'total_amount' => 'required|numeric|min:0',
            'purchase_date' => 'required|date',
            'status' => 'required|in:pending,completed,cancelled',
        ]);

        $purchase = Purchase::create($validated);

        return response()->json($purchase->load('supplier'), 201);
    }

    /**
     * Display the specified purchase.
     */
    public function show($id): JsonResponse
    {
        $purchase = Purchase::with('supplier')->findOrFail($id);

        return response()->json($purchase);
    }

    /**
     * Update the specified purchase.
     */
    public function update(Request $request, $id): JsonResponse
    {
        $purchase = Purchase::findOrFail($id);

        $validated = $request->validate([
            'supplier_id' => 'sometimes|required|exists:suppliers,id',
            'invoice_no' => 'sometimes|required|string|max:255|unique:purchases,invoice_no,' . $purchase->id,
            'total_amount' => 'sometimes|required|numeric|min:0',
            'purchase_date' => 'sometimes|required|date',
            'status' => 'sometimes|required|in:pending,completed,cancelled',
        ]);

        $purchase->update($validated);

        return response()->json($purchase->load('supplier'));
    }

    /**
     * Remove the specified purchase.
     */
    public function destroy($id): JsonResponse
    {
        $purchase = Purchase::findOrFail($id);
        $purchase->delete();

        return response()->json([
            'success' => true,
            'message' => 'Purchase deleted successfully.',
        ]);
    }
}
