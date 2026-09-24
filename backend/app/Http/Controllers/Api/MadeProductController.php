<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MadeProduct;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class MadeProductController extends Controller
{
    /**
     * Relations always eager-loaded so responses show the crafted
     * product's name/details instead of bare foreign key ids.
     */
    private const WITH = ['product', 'metalType', 'supplier', 'user'];

    /**
     * Display a listing of made products (crafting orders) with the
     * related product, metal type, supplier, and craftsman eager-loaded.
     */
    public function index(Request $request): JsonResponse
    {
        $search = $request->query('search');
        $status = $request->query('status');
        $metalTypeId = $request->query('metal_type_id');
        $supplierId = $request->query('supplier_id');
        $sort = $request->query('sort', 'created_at');
        $direction = strtolower($request->query('direction', 'desc')) === 'asc' ? 'asc' : 'desc';

        $query = MadeProduct::with(self::WITH);

        // Search by order number or the crafted product's name / SKU
        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('order_no', 'like', "%{$search}%")
                    ->orWhereHas('product', function ($p) use ($search) {
                        $p->where('name', 'like', "%{$search}%")
                          ->orWhere('code_sku', 'like', "%{$search}%");
                    });
            });
        }

        if (!empty($status) && $status !== 'all') {
            $query->where('status', $status);
        }

        if (!empty($metalTypeId) && $metalTypeId !== 'all') {
            $query->where('metal_type_id', $metalTypeId);
        }

        if (!empty($supplierId) && $supplierId !== 'all') {
            $query->where('supplier_id', $supplierId);
        }

        $allowedSorts = [
            'id',
            'order_no',
            'quantity',
            'metal_weight_used',
            'waste_weight',
            'crafting_cost',
            'status',
            'started_at',
            'completed_at',
            'created_at',
            'updated_at',
        ];

        if (in_array($sort, $allowedSorts, true)) {
            $query->orderBy($sort, $direction);
        } else {
            $query->latest();
        }

        if ($request->has('page') || $request->query('paginate')) {
            $perPage = (int) $request->query('per_page', 10);
            return response()->json($query->paginate($perPage));
        }

        return response()->json($query->get());
    }

    /**
     * Store a newly created made product (crafting order).
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'metal_type_id' => 'required|exists:metal_types,id',
            'supplier_id' => 'nullable|exists:suppliers,id',
            'user_id' => 'nullable|exists:users,id',
            'order_no' => 'nullable|string|max:255|unique:made_products,order_no',
            'quantity' => 'nullable|integer|min:1',
            'metal_weight_used' => 'nullable|numeric|min:0',
            'waste_weight' => 'nullable|numeric|min:0',
            'crafting_cost' => 'nullable|numeric|min:0',
            'status' => 'nullable|in:pending,in_progress,completed,cancelled',
            'started_at' => 'nullable|date',
            'completed_at' => 'nullable|date',
            'notes' => 'nullable|string',
        ]);

        $validated['order_no'] = !empty($validated['order_no'])
            ? $validated['order_no']
            : ('MP-' . strtoupper(bin2hex(random_bytes(4))));
        $validated['quantity'] = $validated['quantity'] ?? 1;
        $validated['status'] = $validated['status'] ?? 'pending';

        $madeProduct = MadeProduct::create($validated);
        $madeProduct->load(self::WITH);

        return response()->json($madeProduct, 201);
    }

    /**
     * Display the specified made product.
     */
    public function show($id): JsonResponse
    {
        $madeProduct = MadeProduct::with(self::WITH)->findOrFail($id);

        return response()->json($madeProduct);
    }

    /**
     * Update the specified made product.
     */
    public function update(Request $request, $id): JsonResponse
    {
        $madeProduct = MadeProduct::findOrFail($id);

        $validated = $request->validate([
            'product_id' => 'sometimes|required|exists:products,id',
            'metal_type_id' => 'sometimes|required|exists:metal_types,id',
            'supplier_id' => 'nullable|exists:suppliers,id',
            'user_id' => 'nullable|exists:users,id',
            'order_no' => [
                'sometimes',
                'required',
                'string',
                'max:255',
                Rule::unique('made_products', 'order_no')->ignore($madeProduct->id),
            ],
            'quantity' => 'nullable|integer|min:1',
            'metal_weight_used' => 'nullable|numeric|min:0',
            'waste_weight' => 'nullable|numeric|min:0',
            'crafting_cost' => 'nullable|numeric|min:0',
            'status' => 'nullable|in:pending,in_progress,completed,cancelled',
            'started_at' => 'nullable|date',
            'completed_at' => 'nullable|date',
            'notes' => 'nullable|string',
        ]);

        $madeProduct->update($validated);
        $madeProduct->load(self::WITH);

        return response()->json($madeProduct);
    }

    /**
     * Update only the status of a made product (e.g. mark in_progress / completed / cancelled).
     */
    public function updateStatus(Request $request, $id): JsonResponse
    {
        $madeProduct = MadeProduct::findOrFail($id);

        $validated = $request->validate([
            'status' => 'required|in:pending,in_progress,completed,cancelled',
        ]);

        $oldStatus = $madeProduct->status;
        $newStatus = $validated['status'];

        $updates = ['status' => $newStatus];
        if ($newStatus === 'in_progress' && !$madeProduct->started_at) {
            $updates['started_at'] = now();
        }
        if (in_array($newStatus, ['completed', 'cancelled'], true) && !$madeProduct->completed_at) {
            $updates['completed_at'] = now();
        }

        $madeProduct->update($updates);

        // Auto replenish finished Product stock when status becomes completed
        if ($newStatus === 'completed' && $oldStatus !== 'completed') {
            $product = $madeProduct->product;
            if ($product) {
                $qty = $madeProduct->quantity ?? 1;
                $product->increment('stock_qty', $qty);
                if ($product->stock_qty > 0 && $product->status === 'out_of_stock') {
                    $product->update(['status' => 'active']);
                }
            }
        } elseif ($oldStatus === 'completed' && $newStatus !== 'completed') {
            $product = $madeProduct->product;
            if ($product) {
                $qty = $madeProduct->quantity ?? 1;
                $newStock = max(0, $product->stock_qty - $qty);
                $product->update([
                    'stock_qty' => $newStock,
                    'status' => $newStock <= 0 ? 'out_of_stock' : $product->status,
                ]);
            }
        }

        $madeProduct->load(self::WITH);

        return response()->json([
            'success' => true,
            'message' => 'Made product status updated successfully.',
            'data' => $madeProduct,
        ]);
    }

    /**
     * Remove the specified made product.
     */
    public function destroy($id): JsonResponse
    {
        $madeProduct = MadeProduct::findOrFail($id);
        $madeProduct->delete();

        return response()->json([
            'success' => true,
            'message' => 'Made product record deleted successfully.',
        ]);
    }
}
