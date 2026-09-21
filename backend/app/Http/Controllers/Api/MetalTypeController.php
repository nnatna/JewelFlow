<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MetalType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MetalTypeController extends Controller
{
    /**
     * Display a listing of metal types.
     */
    public function index(Request $request): JsonResponse
    {
        $search = $request->query('search');
        $query = MetalType::query()
            ->when($search, function ($q, $search) {
                $q->where('name', 'like', "%{$search}%");
            })
            ->latest();

        if ($request->has('page') || $request->query('paginate')) {
            $perPage = (int) $request->query('per_page', 10);
            return response()->json($query->paginate($perPage));
        }

        return response()->json($query->get());
    }

    /**
     * Store a newly created metal type.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:metal_types,name',
            'purity_percentage' => 'nullable|numeric|min:0|max:100',
        ]);

        $metalType = MetalType::create($validated);

        return response()->json($metalType, 201);
    }

    /**
     * Display the specified metal type.
     */
    public function show($id): JsonResponse
    {
        $metalType = MetalType::with('products')->findOrFail($id);

        return response()->json($metalType);
    }

    /**
     * Update the specified metal type.
     */
    public function update(Request $request, $id): JsonResponse
    {
        $metalType = MetalType::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255|unique:metal_types,name,' . $metalType->id,
            'purity_percentage' => 'nullable|numeric|min:0|max:100',
        ]);

        $metalType->update($validated);

        return response()->json($metalType);
    }

    /**
     * Remove the specified metal type.
     */
    public function destroy($id): JsonResponse
    {
        $metalType = MetalType::findOrFail($id);
        $metalType->delete();

        return response()->json([
            'success' => true,
            'message' => 'Metal type deleted successfully.',
        ]);
    }
}
