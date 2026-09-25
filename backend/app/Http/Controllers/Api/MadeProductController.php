<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MadeProduct;
use App\Models\Material;
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
    private const WITH = ['product', 'metalType', 'material', 'supplier', 'user'];

    /**
     * Display a listing of made products (crafting orders) with the
     * related product, metal type, supplier, and craftsman eager-loaded.
     */
    public function index(Request $request): JsonResponse
    {
        $search = $request->query('search');
        $status = $request->query('status');
        $metalTypeId = $request->query('metal_type_id');
        $materialId = $request->query('material_id');
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

        if (!empty($materialId) && $materialId !== 'all') {
            $query->where('material_id', $materialId);
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
     * Check if material stock is available for the given metal type or product.
     */
    private function validateMaterialStock(?int $metalTypeId, ?int $productId, float $metalWeightUsed, int $quantity, string $status, ?int $materialId = null): ?JsonResponse
    {
        if (!in_array($status, ['in_progress', 'completed'], true)) {
            return null;
        }

        $material = null;
        if ($materialId) {
            $material = Material::find($materialId);
        }
        if (!$material && $productId) {
            $prod = Product::find($productId);
            if ($prod && $prod->material_id) {
                $material = Material::find($prod->material_id);
            }
        }
        if (!$material && $metalTypeId) {
            $material = Material::where('metal_type_id', $metalTypeId)->first();
        }

        $required = ($metalWeightUsed > 0 ? $metalWeightUsed : 1) * max(1, $quantity);

        if (!$material || (float) $material->stock_qty <= 0 || (float) $material->stock_qty < $required) {
            $matName = $material ? $material->name : 'Precious Metal Material';
            $currentStock = $material ? (float) $material->stock_qty : 0;
            return response()->json([
                'success' => false,
                'message' => "Cannot set status to '" . ($status === 'in_progress' ? 'In Progress' : 'Completed') . "' because material stock is 0 or insufficient for {$matName} (Available: {$currentStock}g, Required: {$required}g). Please purchase materials from supplier first.",
                'error_type' => 'material_stock_empty',
                'material_id' => $material?->id,
                'material_name' => $matName,
                'current_stock' => $currentStock,
                'required_stock' => $required,
            ], 422);
        }

        return null;
    }

    /**
     * Store a newly created made product (crafting order).
     */
    public function store(Request $request): JsonResponse
    {
        // Sanitize empty strings to null or defaults
        $data = $request->all();
        foreach (['material_id', 'supplier_id', 'user_id', 'unit_id', 'started_at', 'completed_at', 'notes'] as $field) {
            if (array_key_exists($field, $data) && ($data[$field] === '' || $data[$field] === 'null')) {
                $data[$field] = null;
            }
        }
        foreach (['metal_weight_used', 'waste_weight', 'crafting_cost'] as $numField) {
            if (array_key_exists($numField, $data) && ($data[$numField] === '' || !is_numeric($data[$numField]))) {
                $data[$numField] = 0;
            }
        }

        // Auto-resolve material_id if not explicitly provided or invalid
        if (empty($data['material_id']) || !\App\Models\Material::where('id', $data['material_id'])->exists()) {
            $resolvedMatId = null;
            if (!empty($data['product_id'])) {
                $prod = \App\Models\Product::find($data['product_id']);
                if ($prod && !empty($prod->material_id) && \App\Models\Material::where('id', $prod->material_id)->exists()) {
                    $resolvedMatId = $prod->material_id;
                } elseif ($prod && !empty($prod->metal_type_id)) {
                    $matchedMat = \App\Models\Material::where('metal_type_id', $prod->metal_type_id)->first();
                    if ($matchedMat) {
                        $resolvedMatId = $matchedMat->id;
                    }
                }
            }
            if (!$resolvedMatId && !empty($data['metal_type_id'])) {
                $matchedMat = \App\Models\Material::where('metal_type_id', $data['metal_type_id'])->first();
                if ($matchedMat) {
                    $resolvedMatId = $matchedMat->id;
                }
            }
            if (!$resolvedMatId) {
                $firstMat = \App\Models\Material::first();
                if ($firstMat) {
                    $resolvedMatId = $firstMat->id;
                }
            }
            $data['material_id'] = $resolvedMatId;
        }

        // Validate supplier_id & user_id existence
        if (!empty($data['supplier_id']) && !\App\Models\Supplier::where('id', $data['supplier_id'])->exists()) {
            $data['supplier_id'] = null;
        }
        if (!empty($data['user_id']) && !\App\Models\User::where('id', $data['user_id'])->exists()) {
            $data['user_id'] = null;
        }

        $request->merge($data);

        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'material_id' => 'required|exists:materials,id',
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
        $validated['supplier_id'] = !empty($validated['supplier_id']) ? $validated['supplier_id'] : null;
        $validated['user_id'] = !empty($validated['user_id']) ? $validated['user_id'] : null;
        $validated['started_at'] = !empty($validated['started_at']) ? $validated['started_at'] : null;
        $validated['completed_at'] = !empty($validated['completed_at']) ? $validated['completed_at'] : null;
        $validated['notes'] = !empty($validated['notes']) ? $validated['notes'] : null;

        // Enforce material stock validation if attempting to start or complete immediately
        if (in_array($validated['status'], ['in_progress', 'completed'], true)) {
            $stockCheck = $this->validateMaterialStock(
                null,
                $validated['product_id'] ?? null,
                (float) ($validated['metal_weight_used'] ?? 0) + (float) ($validated['waste_weight'] ?? 0),
                (int) ($validated['quantity'] ?? 1),
                $validated['status'],
                $validated['material_id'] ?? null
            );
            if ($stockCheck) {
                return $stockCheck;
            }
        }

        $madeProduct = MadeProduct::create($validated);
        $madeProduct->load(self::WITH);

        return response()->json($madeProduct, 201);
    }

    /**
     * Helper to find a made product by numeric ID or string order_no.
     */
    private function findMadeProduct($id): MadeProduct
    {
        if (is_numeric($id)) {
            $item = MadeProduct::find($id);
            if ($item) {
                return $item;
            }
        }

        $item = MadeProduct::where('order_no', $id)->first();
        if ($item) {
            return $item;
        }

        return MadeProduct::findOrFail($id);
    }

    /**
     * Display the specified made product.
     */
    public function show($id): JsonResponse
    {
        $madeProduct = $this->findMadeProduct($id);
        $madeProduct->load(self::WITH);

        return response()->json($madeProduct);
    }

    /**
     * Update the specified made product.
     */
    public function update(Request $request, $id): JsonResponse
    {
        $madeProduct = $this->findMadeProduct($id);

        // Sanitize empty strings to null or defaults
        $data = $request->all();
        foreach (['supplier_id', 'user_id', 'unit_id', 'started_at', 'completed_at', 'notes'] as $field) {
            if (array_key_exists($field, $data) && ($data[$field] === '' || $data[$field] === 'null')) {
                $data[$field] = null;
            }
        }
        foreach (['metal_weight_used', 'waste_weight', 'crafting_cost'] as $numField) {
            if (array_key_exists($numField, $data) && $data[$numField] === '') {
                $data[$numField] = 0;
            }
        }
        $request->merge($data);

        $validated = $request->validate([
            'product_id' => 'sometimes|required|exists:products,id',
            'material_id' => 'sometimes|required|exists:materials,id',
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

        if (array_key_exists('supplier_id', $validated)) {
            $validated['supplier_id'] = !empty($validated['supplier_id']) ? $validated['supplier_id'] : null;
        }
        if (array_key_exists('user_id', $validated)) {
            $validated['user_id'] = !empty($validated['user_id']) ? $validated['user_id'] : null;
        }
        if (array_key_exists('started_at', $validated)) {
            $validated['started_at'] = !empty($validated['started_at']) ? $validated['started_at'] : null;
        }
        if (array_key_exists('completed_at', $validated)) {
            $validated['completed_at'] = !empty($validated['completed_at']) ? $validated['completed_at'] : null;
        }

        $targetStatus = $validated['status'] ?? $madeProduct->status;
        if (in_array($targetStatus, ['in_progress', 'completed'], true)) {
            $materialId = $validated['material_id'] ?? $madeProduct->material_id;
            $productId = $validated['product_id'] ?? $madeProduct->product_id;
            $weightUsed = (float) ($validated['metal_weight_used'] ?? $madeProduct->metal_weight_used ?? 0) + (float) ($validated['waste_weight'] ?? $madeProduct->waste_weight ?? 0);
            $qty = (int) ($validated['quantity'] ?? $madeProduct->quantity ?? 1);

            $stockCheck = $this->validateMaterialStock(null, $productId, $weightUsed, $qty, $targetStatus, $materialId);
            if ($stockCheck) {
                return $stockCheck;
            }
        }

        $madeProduct->update($validated);
        $madeProduct->load(self::WITH);

        return response()->json($madeProduct);
    }

    /**
     * Update only the status of a made product (e.g. mark in_progress / completed / cancelled).
     */
    public function updateStatus(Request $request, $id): JsonResponse
    {
        $madeProduct = $this->findMadeProduct($id);

        $validated = $request->validate([
            'status' => 'required|in:pending,in_progress,completed,cancelled',
        ]);

        $oldStatus = $madeProduct->status;
        $newStatus = $validated['status'];

        if (in_array($newStatus, ['in_progress', 'completed'], true)) {
            $weightUsed = (float) ($madeProduct->metal_weight_used ?? 0) + (float) ($madeProduct->waste_weight ?? 0);
            $qty = (int) ($madeProduct->quantity ?? 1);

            $stockCheck = $this->validateMaterialStock(null, $madeProduct->product_id, $weightUsed, $qty, $newStatus, $madeProduct->material_id);
            if ($stockCheck) {
                return $stockCheck;
            }
        }

        $updates = ['status' => $newStatus];
        if ($newStatus === 'in_progress' && !$madeProduct->started_at) {
            $updates['started_at'] = now();
        }
        if (in_array($newStatus, ['completed', 'cancelled'], true) && !$madeProduct->completed_at) {
            $updates['completed_at'] = now();
        }

        $madeProduct->update($updates);

        // Auto replenish finished Product stock & deduct raw materials when status becomes completed
        if ($newStatus === 'completed' && $oldStatus !== 'completed') {
            // 1. Replenish crafted finished Product stock
            $product = $madeProduct->product;
            if ($product) {
                $qty = $madeProduct->quantity ?? 1;
                $product->increment('stock_qty', $qty);
                if ($product->stock_qty > 0 && $product->status === 'out_of_stock') {
                    $product->update(['status' => 'active']);
                }
            }

            // 2. Deduct raw gold / metal material stock used for crafting
            $metalUsed = ((float) ($madeProduct->metal_weight_used ?? 0) + (float) ($madeProduct->waste_weight ?? 0)) * ($madeProduct->quantity ?? 1);
            if ($metalUsed > 0 && $madeProduct->material_id) {
                $material = Material::find($madeProduct->material_id);
                if ($material) {
                    $newMatStock = max(0, (float) $material->stock_qty - $metalUsed);
                    $material->update([
                        'stock_qty' => $newMatStock,
                        'status' => $newMatStock <= 0 ? 'out_of_stock' : ($newMatStock <= ($material->min_stock_level ?? 10) ? 'low_stock' : 'in_stock'),
                    ]);
                }
            }
        } elseif ($oldStatus === 'completed' && $newStatus !== 'completed') {
            // Revert finished product stock
            $product = $madeProduct->product;
            if ($product) {
                $qty = $madeProduct->quantity ?? 1;
                $newStock = max(0, $product->stock_qty - $qty);
                $product->update([
                    'stock_qty' => $newStock,
                    'status' => $newStock <= 0 ? 'out_of_stock' : $product->status,
                ]);
            }

            // Restore raw material stock
            $metalUsed = ((float) ($madeProduct->metal_weight_used ?? 0) + (float) ($madeProduct->waste_weight ?? 0)) * ($madeProduct->quantity ?? 1);
            if ($metalUsed > 0 && $madeProduct->material_id) {
                $material = Material::find($madeProduct->material_id);
                if ($material) {
                    $newMatStock = (float) $material->stock_qty + $metalUsed;
                    $material->update([
                        'stock_qty' => $newMatStock,
                        'status' => $newMatStock <= 0 ? 'out_of_stock' : ($newMatStock <= ($material->min_stock_level ?? 10) ? 'low_stock' : 'in_stock'),
                    ]);
                }
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
        $madeProduct = is_numeric($id) ? MadeProduct::find($id) : null;
        if (!$madeProduct) {
            $madeProduct = MadeProduct::where('order_no', $id)->first() ?? MadeProduct::find($id);
        }
        if ($madeProduct) {
            $madeProduct->delete();
        }

        return response()->json([
            'success' => true,
            'message' => 'Made product record deleted successfully.',
        ]);
    }
}
