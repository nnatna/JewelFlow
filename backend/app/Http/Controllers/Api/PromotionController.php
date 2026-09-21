<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Promotion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class PromotionController extends Controller
{
    /**
     * Display a listing of promotions with optional active_only filter.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Promotion::with('product');

        if ($request->boolean('active_only')) {
            $query->where('is_active', true);
        }

        return response()->json($query->orderBy('created_at', 'desc')->get());
    }

    /**
     * Find best matching promotion for a given context (tier, product, cart total).
     */
    public function applicable(Request $request): JsonResponse
    {
        $tier = $request->query('tier', 'Standard');
        $productId = $request->query('product_id');
        $cartTotal = (float) $request->query('cart_total', 0);
        $today = now()->toDateString();

        $promotions = Promotion::with('product')
            ->where('is_active', true)
            ->where('min_purchase', '<=', $cartTotal)
            ->where(function ($q) use ($today) {
                $q->whereNull('start_date')->orWhere('start_date', '<=', $today);
            })
            ->where(function ($q) use ($today) {
                $q->whereNull('end_date')->orWhere('end_date', '>=', $today);
            })
            ->where(function ($q) use ($tier) {
                $q->whereNull('tier_requirement')->orWhere('tier_requirement', $tier);
            })
            ->where(function ($q) use ($productId) {
                $q->whereNull('product_id')->orWhere('product_id', $productId);
            })
            ->get();

        $best = $promotions->sortByDesc('discount_value')->first();

        return response()->json([
            'found' => (bool) $best,
            'promotion' => $best,
        ]);
    }

    /**
     * Store a newly created promotion.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->all();

        foreach (['tier_requirement', 'product_id', 'start_date', 'end_date', 'description'] as $key) {
            if (array_key_exists($key, $data) && $data[$key] === '') {
                $data[$key] = null;
            }
        }

        $validator = Validator::make($data, [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'discount_type' => 'required|in:percent,fixed',
            'discount_value' => 'required|numeric|min:0',
            'tier_requirement' => 'nullable|string|max:30',
            'product_id' => 'nullable|exists:products,id',
            'min_purchase' => 'nullable|numeric|min:0',
            'is_active' => 'nullable|boolean',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => $validator->errors()->first(),
                'errors' => $validator->errors(),
            ], 422);
        }

        $promo = Promotion::create($validator->validated());

        return response()->json($promo->load('product'), 201);
    }

    /**
     * Display the specified promotion.
     */
    public function show($id): JsonResponse
    {
        $promo = Promotion::with('product')->findOrFail($id);

        return response()->json($promo);
    }

    /**
     * Update the specified promotion.
     */
    public function update(Request $request, $id): JsonResponse
    {
        $promo = Promotion::findOrFail($id);
        $data = $request->all();

        foreach (['tier_requirement', 'product_id', 'start_date', 'end_date', 'description'] as $key) {
            if (array_key_exists($key, $data) && $data[$key] === '') {
                $data[$key] = null;
            }
        }

        $validator = Validator::make($data, [
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'discount_type' => 'sometimes|required|in:percent,fixed',
            'discount_value' => 'sometimes|required|numeric|min:0',
            'tier_requirement' => 'nullable|string|max:30',
            'product_id' => 'nullable|exists:products,id',
            'min_purchase' => 'nullable|numeric|min:0',
            'is_active' => 'nullable|boolean',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => $validator->errors()->first(),
                'errors' => $validator->errors(),
            ], 422);
        }

        $promo->update($validator->validated());

        return response()->json($promo->load('product'));
    }

    /**
     * Remove the specified promotion.
     */
    public function destroy($id): JsonResponse
    {
        $promo = Promotion::findOrFail($id);
        $promo->delete();

        return response()->json([
            'success' => true,
            'message' => 'Promotion deleted successfully.',
        ]);
    }
}
