<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Material;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MaterialController extends Controller
{
    private const WITH = ['materialCategory', 'metalType.goldRates', 'supplier'];

    public function index(Request $request): JsonResponse
    {
        $search = $request->query('search');
        $categoryId = $request->query('category_id');
        $metalTypeId = $request->query('metal_type_id');
        $status = $request->query('status');

        $query = Material::with(self::WITH);

        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%")
                  ->orWhere('purity', 'like', "%{$search}%");
            });
        }

        if (!empty($categoryId) && $categoryId !== 'all') {
            $query->where('material_category_id', $categoryId);
        }

        if (!empty($metalTypeId) && $metalTypeId !== 'all') {
            $query->where('metal_type_id', $metalTypeId);
        }

        if (!empty($status) && $status !== 'all') {
            $query->where('status', $status);
        }

        $query->latest();

        if ($request->has('page') || $request->query('paginate')) {
            $perPage = (int) $request->query('per_page', 10);
            return response()->json($query->paginate($perPage));
        }

        return response()->json($query->get());
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'material_category_id' => 'nullable|exists:material_categories,id',
            'metal_type_id' => 'nullable|exists:metal_types,id',
            'supplier_id' => 'nullable|exists:suppliers,id',
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|max:100',
            'unit' => 'nullable|string|max:20',
            'stock_qty' => 'nullable|numeric|min:0',
            'min_stock_level' => 'nullable|numeric|min:0',
            'cost_price' => 'nullable|numeric|min:0',
            'use_metal_rate' => 'nullable|boolean',
            'purity' => 'nullable|string|max:50',
            'status' => 'nullable|string|in:in_stock,low_stock,out_of_stock',
            'notes' => 'nullable|string',
        ]);

        $validated['code'] = !empty($validated['code'])
            ? $validated['code']
            : ('MAT-' . strtoupper(bin2hex(random_bytes(3))));
        $validated['unit'] = $validated['unit'] ?? 'g';
        $validated['stock_qty'] = $validated['stock_qty'] ?? 0;
        $validated['status'] = $validated['status'] ?? ($validated['stock_qty'] > 0 ? 'in_stock' : 'out_of_stock');

        $material = Material::create($validated);
        $material->load(self::WITH);

        return response()->json($material, 201);
    }

    public function show($id): JsonResponse
    {
        $material = Material::with(self::WITH)->findOrFail($id);
        return response()->json($material);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $material = Material::findOrFail($id);

        $validated = $request->validate([
            'material_category_id' => 'nullable|exists:material_categories,id',
            'metal_type_id' => 'nullable|exists:metal_types,id',
            'supplier_id' => 'nullable|exists:suppliers,id',
            'name' => 'sometimes|required|string|max:255',
            'code' => 'nullable|string|max:100',
            'unit' => 'nullable|string|max:20',
            'stock_qty' => 'nullable|numeric|min:0',
            'min_stock_level' => 'nullable|numeric|min:0',
            'cost_price' => 'nullable|numeric|min:0',
            'use_metal_rate' => 'nullable|boolean',
            'purity' => 'nullable|string|max:50',
            'status' => 'nullable|string|in:in_stock,low_stock,out_of_stock',
            'notes' => 'nullable|string',
        ]);

        if (isset($validated['stock_qty']) && !isset($validated['status'])) {
            $min = $validated['min_stock_level'] ?? $material->min_stock_level;
            if ($validated['stock_qty'] <= 0) {
                $validated['status'] = 'out_of_stock';
            } elseif ($validated['stock_qty'] <= $min) {
                $validated['status'] = 'low_stock';
            } else {
                $validated['status'] = 'in_stock';
            }
        }

        $material->update($validated);
        $material->load(self::WITH);

        return response()->json($material);
    }

    /**
     * Quick restock vault material.
     */
    public function quickRestock(Request $request, $id): JsonResponse
    {
        $material = Material::findOrFail($id);
        $validated = $request->validate([
            'quantity' => 'required|numeric|min:0.001',
            'notes' => 'nullable|string',
        ]);

        $qty = (float) $validated['quantity'];
        $material->increment('stock_qty', $qty);
        $newStock = (float) $material->stock_qty;
        $min = (float) ($material->min_stock_level ?? 10);
        $material->update([
            'status' => $newStock <= 0 ? 'out_of_stock' : ($newStock <= $min ? 'low_stock' : 'in_stock'),
        ]);

        $material->load(self::WITH);

        return response()->json([
            'success' => true,
            'message' => "Successfully restocked {$qty}g of {$material->name}.",
            'data' => $material,
        ]);
    }

    public function destroy($id): JsonResponse
    {
        $material = Material::findOrFail($id);
        $material->delete();

        return response()->json([
            'success' => true,
            'message' => 'Material record deleted successfully.',
        ]);
    }
}
