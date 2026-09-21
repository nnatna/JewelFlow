<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GoldRate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GoldRateController extends Controller
{
    /**
     * Display a listing of gold rates.
     */
    public function index(Request $request): JsonResponse
    {
        $query = GoldRate::with('metalType')->latest();

        if ($request->has('page') || $request->query('paginate')) {
            $perPage = (int) $request->query('per_page', 10);
            return response()->json($query->paginate($perPage));
        }

        return response()->json($query->get());
    }

    /**
     * Store a newly created gold rate.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'metal_type_id' => 'required|exists:metal_types,id',
            'buy_rate' => 'required|numeric|min:0',
            'sell_rate' => 'required|numeric|min:0',
            'effective_date' => 'nullable|date',
        ]);

        $validated['effective_date'] = $validated['effective_date'] ?? now()->toDateString();
        $rate = GoldRate::create($validated);

        return response()->json($rate->load('metalType'), 201);
    }

    /**
     * Display the specified gold rate.
     */
    public function show($id): JsonResponse
    {
        $rate = GoldRate::with('metalType')->findOrFail($id);

        return response()->json($rate);
    }

    /**
     * Update the specified gold rate.
     */
    public function update(Request $request, $id): JsonResponse
    {
        $rate = GoldRate::findOrFail($id);

        $validated = $request->validate([
            'metal_type_id' => 'sometimes|required|exists:metal_types,id',
            'buy_rate' => 'sometimes|required|numeric|min:0',
            'sell_rate' => 'sometimes|required|numeric|min:0',
            'effective_date' => 'nullable|date',
        ]);

        $rate->update($validated);

        return response()->json($rate->load('metalType'));
    }

    /**
     * Remove the specified gold rate.
     */
    public function destroy($id): JsonResponse
    {
        $rate = GoldRate::findOrFail($id);
        $rate->delete();

        return response()->json([
            'success' => true,
            'message' => 'Gold rate deleted successfully.',
        ]);
    }
}
