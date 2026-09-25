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
            'notes' => 'nullable|string',
            'items' => 'nullable|array',
        ]);

        $purchase = Purchase::create($validated);

        // If directly created as completed, replenish materials stock
        if ($purchase->status === 'completed' && !empty($purchase->items)) {
            $this->replenishMaterialsStock($purchase->items);
        }

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
        $oldStatus = $purchase->status;

        $validated = $request->validate([
            'supplier_id' => 'sometimes|required|exists:suppliers,id',
            'invoice_no' => 'sometimes|required|string|max:255|unique:purchases,invoice_no,' . $purchase->id,
            'total_amount' => 'sometimes|required|numeric|min:0',
            'purchase_date' => 'sometimes|required|date',
            'status' => 'sometimes|required|in:pending,completed,cancelled',
            'notes' => 'nullable|string',
            'items' => 'nullable|array',
        ]);

        $purchase->update($validated);

        // If transitioned to completed, replenish materials stock
        if ($oldStatus !== 'completed' && $purchase->status === 'completed' && !empty($purchase->items)) {
            $this->replenishMaterialsStock($purchase->items);
        }

        return response()->json($purchase->load('supplier'));
    }

    /**
     * Confirm arrival of a purchase order (marks status as completed).
     */
    public function confirmArrival($id): JsonResponse
    {
        $purchase = Purchase::findOrFail($id);
        $oldStatus = $purchase->status;
        $purchase->update(['status' => 'completed']);

        if ($oldStatus !== 'completed' && !empty($purchase->items)) {
            $this->replenishMaterialsStock($purchase->items);
        }

        return response()->json([
            'success' => true,
            'message' => 'Purchase shipment arrival confirmed successfully.',
            'data' => $purchase->load('supplier'),
        ]);
    }

    /**
     * Helper to replenish materials stock when purchase order arrives.
     */
    protected function replenishMaterialsStock(array $items): void
    {
        foreach ($items as $item) {
            $materialId = $item['material_id'] ?? $item['id'] ?? null;
            $qty = isset($item['quantity']) ? (float)$item['quantity'] : (isset($item['qty']) ? (float)$item['qty'] : 0);

            if ($materialId && $qty > 0) {
                $material = \App\Models\Material::find($materialId);
                if ($material) {
                    $material->increment('stock_qty', $qty);
                }
            }
        }
    }

    /**
     * Cancel a purchase order (marks status as cancelled).
     */
    public function cancelOrder($id): JsonResponse
    {
        $purchase = Purchase::findOrFail($id);
        $purchase->update(['status' => 'cancelled']);

        return response()->json([
            'success' => true,
            'message' => 'Purchase order marked as cancelled.',
            'data' => $purchase->load('supplier'),
        ]);
    }

    /**
     * Remove the specified purchase.
     */
    public function destroy($id): JsonResponse
    {
        $purchase = Purchase::findOrFail($id);
        if (method_exists($purchase, 'payments')) {
            $purchase->payments()->delete();
        }
        $purchase->delete();

        return response()->json([
            'success' => true,
            'message' => 'Purchase deleted successfully.',
        ]);
    }
}
