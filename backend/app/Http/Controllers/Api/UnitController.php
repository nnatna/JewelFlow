<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Unit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UnitController extends Controller
{
    /**
     * Display a listing of all active units.
     */
    public function index(Request $request): JsonResponse
    {
        $search = $request->query('search');
        $type = $request->query('type');
        $isActive = $request->query('is_active');

        $query = Unit::query()
            ->when($search, function ($q, $search) {
                $q->where(function ($sub) use ($search) {
                    $sub->where('name', 'like', "%{$search}%")
                        ->orWhere('name_kh', 'like', "%{$search}%")
                        ->orWhere('code', 'like', "%{$search}%")
                        ->orWhere('symbol', 'like', "%{$search}%");
                });
            })
            ->when($type, function ($q, $type) {
                $q->where('type', $type);
            })
            ->when($isActive !== null, function ($q) use ($isActive) {
                $q->where('is_active', filter_var($isActive, FILTER_VALIDATE_BOOLEAN));
            })
            ->orderBy('sort_order', 'asc')
            ->orderBy('id', 'asc');

        return response()->json($query->get());
    }

    /**
     * Store a newly created unit.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'name_kh' => 'nullable|string|max:100',
            'code' => 'required|string|max:50|unique:units,code',
            'symbol' => 'nullable|string|max:50',
            'conversion_factor' => 'required|numeric|min:0.000001',
            'base_unit' => 'nullable|string|max:20',
            'type' => 'nullable|string|in:weight,count,gemstone,volume',
            'sort_order' => 'nullable|integer',
            'is_active' => 'nullable|boolean',
            'description' => 'nullable|string',
        ]);

        $unit = Unit::create($validated);

        return response()->json($unit, 201);
    }

    /**
     * Display the specified unit.
     */
    public function show(int $id): JsonResponse
    {
        $unit = Unit::withCount(['materials', 'products', 'saleItems', 'madeProducts', 'buybacks', 'gemstones'])->findOrFail($id);
        return response()->json($unit);
    }

    /**
     * Update the specified unit.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $unit = Unit::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:100',
            'name_kh' => 'nullable|string|max:100',
            'code' => "sometimes|required|string|max:50|unique:units,code,{$id}",
            'symbol' => 'nullable|string|max:50',
            'conversion_factor' => 'sometimes|required|numeric|min:0.000001',
            'base_unit' => 'nullable|string|max:20',
            'type' => 'nullable|string|in:weight,count,gemstone,volume',
            'sort_order' => 'nullable|integer',
            'is_active' => 'nullable|boolean',
            'description' => 'nullable|string',
        ]);

        $unit->update($validated);

        return response()->json($unit);
    }

    /**
     * Remove the specified unit.
     */
    public function destroy(int $id): JsonResponse
    {
        $unit = Unit::findOrFail($id);
        $unit->delete();

        return response()->json(['message' => 'Unit deleted successfully']);
    }
}
