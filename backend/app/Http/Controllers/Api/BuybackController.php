<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Buyback;
use App\Models\Material;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BuybackController extends Controller
{
    private const WITH = ['customer', 'metalType', 'material'];

    /**
     * Display a listing of buybacks.
     */
    public function index(Request $request): JsonResponse
    {
        $search = $request->query('search');
        $sort = $request->query('sort', 'buyback_date');
        $direction = strtolower($request->query('direction', 'desc')) === 'asc' ? 'asc' : 'desc';

        $query = Buyback::with(self::WITH)
            ->when($search, function ($q, $search) {
                $q->whereHas('customer', fn($c) => $c->where('name', 'like', "%{$search}%"))
                  ->orWhereHas('metalType', fn($m) => $m->where('name', 'like', "%{$search}%"))
                  ->orWhereHas('material', fn($mat) => $mat->where('name', 'like', "%{$search}%"))
                  ->orWhere('buyback_rate', 'like', "%{$search}%")
                  ->orWhere('total_refund', 'like', "%{$search}%")
                  ->orWhere('notes', 'like', "%{$search}%");
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
     * Store a newly created buyback and replenish material stock.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'customer_id' => 'nullable|exists:customers,id',
            'metal_type_id' => 'required|exists:metal_types,id',
            'material_id' => 'nullable|exists:materials,id',
            'destination_type' => 'nullable|string',
            'unit_id' => 'nullable|exists:units,id',
            'weight' => 'required|numeric|min:0',
            'buyback_rate' => 'required|numeric|min:0',
            'deduction_rate' => 'nullable|numeric|min:0',
            'labor_deduction' => 'nullable|numeric|min:0',
            'total_refund' => 'required|numeric|min:0',
            'buyback_date' => 'required|date',
            'notes' => 'nullable|string',
        ]);

        $destinationType = $validated['destination_type'] ?? 'material';
        $validated['destination_type'] = $destinationType;

        // Auto-resolve material_id if not provided
        if (empty($validated['material_id'])) {
            $matchedMat = Material::where('metal_type_id', $validated['metal_type_id'])->first();
            if ($matchedMat) {
                $validated['material_id'] = $matchedMat->id;
            }
        }

        $buyback = Buyback::create($validated);

        // Update Material Stock when destination is material
        if ($destinationType === 'material' && !empty($buyback->material_id)) {
            $this->addMaterialStock($buyback->material_id, (float) $buyback->weight, (float) ($buyback->deduction_rate ?? 0));
        }

        return response()->json($buyback->load(self::WITH), 201);
    }

    /**
     * Display the specified buyback.
     */
    public function show($id): JsonResponse
    {
        $buyback = Buyback::with(self::WITH)->findOrFail($id);

        return response()->json($buyback);
    }

    /**
     * Update the specified buyback.
     */
    public function update(Request $request, $id): JsonResponse
    {
        $buyback = Buyback::findOrFail($id);
        $oldWeight = (float) $buyback->weight;
        $oldDeduction = (float) ($buyback->deduction_rate ?? 0);
        $oldMaterialId = $buyback->material_id;
        $oldDestination = $buyback->destination_type ?? 'material';

        $validated = $request->validate([
            'customer_id' => 'nullable|exists:customers,id',
            'metal_type_id' => 'sometimes|required|exists:metal_types,id',
            'material_id' => 'nullable|exists:materials,id',
            'destination_type' => 'nullable|string',
            'unit_id' => 'nullable|exists:units,id',
            'weight' => 'sometimes|required|numeric|min:0',
            'buyback_rate' => 'sometimes|required|numeric|min:0',
            'deduction_rate' => 'nullable|numeric|min:0',
            'labor_deduction' => 'nullable|numeric|min:0',
            'total_refund' => 'sometimes|required|numeric|min:0',
            'buyback_date' => 'sometimes|required|date',
            'notes' => 'nullable|string',
        ]);

        $buyback->update($validated);

        // Adjust stock if weights or material changed
        $newWeight = (float) $buyback->weight;
        $newDeduction = (float) ($buyback->deduction_rate ?? 0);
        $newMaterialId = $buyback->material_id;
        $newDestination = $buyback->destination_type ?? 'material';

        if ($oldDestination === 'material' && $oldMaterialId) {
            // Reverse old stock
            $this->deductMaterialStock($oldMaterialId, $oldWeight, $oldDeduction);
        }

        if ($newDestination === 'material' && $newMaterialId) {
            // Apply new stock
            $this->addMaterialStock($newMaterialId, $newWeight, $newDeduction);
        }

        return response()->json($buyback->load(self::WITH));
    }

    /**
     * Remove the specified buyback and reverse added material stock.
     */
    public function destroy($id): JsonResponse
    {
        $buyback = Buyback::findOrFail($id);

        if (($buyback->destination_type ?? 'material') === 'material' && !empty($buyback->material_id)) {
            $this->deductMaterialStock(
                $buyback->material_id,
                (float) $buyback->weight,
                (float) ($buyback->deduction_rate ?? 0)
            );
        }

        if (method_exists($buyback, 'payments')) {
            $buyback->payments()->delete();
        }

        $buyback->delete();

        return response()->json([
            'success' => true,
            'message' => 'Buyback record deleted successfully and material stock adjusted.',
        ]);
    }

    /**
     * Calculate net weight and increment material stock taking material unit into account.
     */
    protected function addMaterialStock(int $materialId, float $grossWeight, float $deductionRate): void
    {
        $material = Material::find($materialId);
        if (!$material) return;

        $qtyToAdd = $this->calculateStockDeltaInMaterialUnit($material, $grossWeight, $deductionRate);
        $material->increment('stock_qty', $qtyToAdd);
        $this->syncMaterialStatus($material);
    }

    /**
     * Calculate net weight and decrement material stock taking material unit into account.
     */
    protected function deductMaterialStock(int $materialId, float $grossWeight, float $deductionRate): void
    {
        $material = Material::find($materialId);
        if (!$material) return;

        $qtyToDeduct = $this->calculateStockDeltaInMaterialUnit($material, $grossWeight, $deductionRate);
        $material->decrement('stock_qty', $qtyToDeduct);
        $this->syncMaterialStatus($material);
    }

    /**
     * Convert gross weight and deduction into delta matching the material's unit.
     */
    protected function calculateStockDeltaInMaterialUnit(Material $material, float $grossWeightGrams, float $deductionRate): float
    {
        $netGrams = $grossWeightGrams;
        if ($deductionRate > 0) {
            $netGrams = max(0, $grossWeightGrams * (1 - ($deductionRate / 100)));
        }

        $unit = strtolower(trim($material->unit ?? 'g'));
        if ($unit === 'chi' || $unit === 'ជី' || str_contains($unit, 'chi') || str_contains($unit, 'ជី')) {
            return $netGrams / 3.75;
        }

        if ($unit === 'kg') {
            return $netGrams / 1000;
        }

        return $netGrams;
    }

    /**
     * Synchronize material status based on stock level.
     */
    protected function syncMaterialStatus(Material $material): void
    {
        $material->refresh();
        $stock = (float) $material->stock_qty;
        $min = (float) ($material->min_stock_level ?? 10);

        $status = $stock <= 0 ? 'out_of_stock' : ($stock <= $min ? 'low_stock' : 'in_stock');
        $material->update(['status' => $status]);
    }
}
