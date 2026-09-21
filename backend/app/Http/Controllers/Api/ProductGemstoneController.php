<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProductGemstone;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductGemstoneController extends Controller
{
    /**
     * Display a listing of product gemstones.
     */
    public function index(Request $request): JsonResponse
    {
        $productId = $request->query('product_id');

        $query = ProductGemstone::with(['product', 'gemstone'])
            ->when($productId, fn($q) => $q->where('product_id', $productId))
            ->latest();

        if ($request->has('page') || $request->query('paginate')) {
            $perPage = (int) $request->query('per_page', 10);
            return response()->json($query->paginate($perPage));
        }

        return response()->json($query->get());
    }

    /**
     * Store a newly created product gemstone attachment.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'gemstone_id' => 'required|exists:gemstones,id',
            'quantity' => 'required|integer|min:1',
            'total_carat' => 'required|numeric|min:0',
            'setting_cost' => 'nullable|numeric|min:0',
        ]);

        $validated['setting_cost'] = $validated['setting_cost'] ?? 0;
        $productGemstone = ProductGemstone::create($validated);

        return response()->json($productGemstone->load(['product', 'gemstone']), 201);
    }

    /**
     * Display the specified product gemstone.
     */
    public function show($id): JsonResponse
    {
        $productGemstone = ProductGemstone::with(['product', 'gemstone'])->findOrFail($id);

        return response()->json($productGemstone);
    }

    /**
     * Update the specified product gemstone.
     */
    public function update(Request $request, $id): JsonResponse
    {
        $productGemstone = ProductGemstone::findOrFail($id);

        $validated = $request->validate([
            'product_id' => 'sometimes|required|exists:products,id',
            'gemstone_id' => 'sometimes|required|exists:gemstones,id',
            'quantity' => 'sometimes|required|integer|min:1',
            'total_carat' => 'sometimes|required|numeric|min:0',
            'setting_cost' => 'nullable|numeric|min:0',
        ]);

        $productGemstone->update($validated);

        return response()->json($productGemstone->load(['product', 'gemstone']));
    }

    /**
     * Remove the specified product gemstone.
     */
    public function destroy($id): JsonResponse
    {
        $productGemstone = ProductGemstone::findOrFail($id);
        $productGemstone->delete();

        return response()->json([
            'success' => true,
            'message' => 'Product gemstone removed successfully.',
        ]);
    }
}
