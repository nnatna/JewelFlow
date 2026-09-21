<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Buyback;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BuybackController extends Controller
{
    /**
     * Display a listing of buybacks.
     */
    public function index(Request $request): JsonResponse
    {
        $search = $request->query('search');
        $sort = $request->query('sort', 'buyback_date');
        $direction = strtolower($request->query('direction', 'desc')) === 'asc' ? 'asc' : 'desc';

        $query = Buyback::with(['customer', 'metalType'])
            ->when($search, function ($q, $search) {
                $q->whereHas('customer', fn($c) => $c->where('name', 'like', "%{$search}%"))
                  ->orWhereHas('metalType', fn($m) => $m->where('name', 'like', "%{$search}%"))
                  ->orWhere('buyback_rate', 'like', "%{$search}%")
                  ->orWhere('total_refund', 'like', "%{$search}%");
            })
            ->orderBy($sort, $direction)
            ->orderBy('id', 'desc');

        if ($request->has('page') || $request->query('paginate')) {
            $perPage = (int) $request->query('per_page', 10);
            return response()->json($query->paginate($perPage));
        }

        return response()->json($query->get());
    }

    /**
     * Store a newly created buyback.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'customer_id' => 'nullable|exists:customers,id',
            'metal_type_id' => 'required|exists:metal_types,id',
            'weight' => 'required|numeric|min:0',
            'buyback_rate' => 'required|numeric|min:0',
            'deduction_rate' => 'nullable|numeric|min:0',
            'labor_deduction' => 'nullable|numeric|min:0',
            'total_refund' => 'required|numeric|min:0',
            'buyback_date' => 'required|date',
        ]);

        $buyback = Buyback::create($validated);

        return response()->json($buyback->load(['customer', 'metalType']), 201);
    }

    /**
     * Display the specified buyback.
     */
    public function show($id): JsonResponse
    {
        $buyback = Buyback::with(['customer', 'metalType'])->findOrFail($id);

        return response()->json($buyback);
    }

    /**
     * Update the specified buyback.
     */
    public function update(Request $request, $id): JsonResponse
    {
        $buyback = Buyback::findOrFail($id);

        $validated = $request->validate([
            'customer_id' => 'nullable|exists:customers,id',
            'metal_type_id' => 'sometimes|required|exists:metal_types,id',
            'weight' => 'sometimes|required|numeric|min:0',
            'buyback_rate' => 'sometimes|required|numeric|min:0',
            'deduction_rate' => 'nullable|numeric|min:0',
            'labor_deduction' => 'nullable|numeric|min:0',
            'total_refund' => 'sometimes|required|numeric|min:0',
            'buyback_date' => 'sometimes|required|date',
        ]);

        $buyback->update($validated);

        return response()->json($buyback->load(['customer', 'metalType']));
    }

    /**
     * Remove the specified buyback.
     */
    public function destroy($id): JsonResponse
    {
        $buyback = Buyback::findOrFail($id);
        $buyback->delete();

        return response()->json([
            'success' => true,
            'message' => 'Buyback record deleted successfully.',
        ]);
    }
}
