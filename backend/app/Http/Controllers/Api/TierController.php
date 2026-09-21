<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TierController extends Controller
{
    /**
     * Display a listing of VIP tiers sorted by min_spending.
     */
    public function index(): JsonResponse
    {
        $tiers = Tier::query()
            ->orderBy('min_spending', 'asc')
            ->get();

        return response()->json($tiers);
    }

    /**
     * Store a newly created VIP tier.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:50|unique:tiers,name',
            'min_spending' => 'required|numeric|min:0',
            'discount_rate' => 'required|numeric|min:0|max:100',
            'color' => 'nullable|string|max:30',
            'badge_color' => 'nullable|string|max:30',
            'description' => 'nullable|string',
            'sort_order' => 'nullable|integer|min:0',
            'is_active' => 'nullable|boolean',
        ]);

        if (isset($validated['badge_color']) && !isset($validated['color'])) {
            $validated['color'] = $validated['badge_color'];
        }

        $tier = Tier::create($validated);

        return response()->json($tier, 201);
    }

    /**
     * Display the specified VIP tier.
     */
    public function show($id): JsonResponse
    {
        $tier = Tier::findOrFail($id);

        return response()->json($tier);
    }

    /**
     * Update the specified VIP tier.
     */
    public function update(Request $request, $id): JsonResponse
    {
        $tier = Tier::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:50|unique:tiers,name,' . $tier->id,
            'min_spending' => 'sometimes|required|numeric|min:0',
            'discount_rate' => 'sometimes|required|numeric|min:0|max:100',
            'color' => 'nullable|string|max:30',
            'badge_color' => 'nullable|string|max:30',
            'description' => 'nullable|string',
            'sort_order' => 'nullable|integer|min:0',
            'is_active' => 'nullable|boolean',
        ]);

        if (isset($validated['badge_color']) && !isset($validated['color'])) {
            $validated['color'] = $validated['badge_color'];
        }

        $tier->update($validated);

        return response()->json($tier);
    }

    /**
     * Remove the specified VIP tier.
     */
    public function destroy($id): JsonResponse
    {
        $tier = Tier::findOrFail($id);
        $tier->delete();

        return response()->json([
            'success' => true,
            'message' => 'Tier deleted successfully.',
        ]);
    }
}
