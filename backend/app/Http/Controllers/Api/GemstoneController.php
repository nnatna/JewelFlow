<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Gemstone;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GemstoneController extends Controller
{
    /**
     * Display a listing of gemstones.
     */
    public function index(Request $request): JsonResponse
    {
        $search = $request->query('search');
        $query = Gemstone::query()
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
     * Store a newly created gemstone.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'shape' => 'nullable|string|max:100',
            'carat_weight' => 'nullable|numeric|min:0',
            'clarity' => 'nullable|string|max:50',
            'color' => 'nullable|string|max:50',
            'cost_price' => 'nullable|numeric|min:0',
        ]);

        $gemstone = Gemstone::create($validated);

        return response()->json($gemstone, 201);
    }

    /**
     * Display the specified gemstone.
     */
    public function show($id): JsonResponse
    {
        $gemstone = Gemstone::findOrFail($id);

        return response()->json($gemstone);
    }

    /**
     * Update the specified gemstone.
     */
    public function update(Request $request, $id): JsonResponse
    {
        $gemstone = Gemstone::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'shape' => 'nullable|string|max:100',
            'carat_weight' => 'nullable|numeric|min:0',
            'clarity' => 'nullable|string|max:50',
            'color' => 'nullable|string|max:50',
            'cost_price' => 'nullable|numeric|min:0',
        ]);

        $gemstone->update($validated);

        return response()->json($gemstone);
    }

    /**
     * Remove the specified gemstone.
     */
    public function destroy($id): JsonResponse
    {
        $gemstone = Gemstone::findOrFail($id);
        $gemstone->delete();

        return response()->json([
            'success' => true,
            'message' => 'Gemstone deleted successfully.',
        ]);
    }
}
