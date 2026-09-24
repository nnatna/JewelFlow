<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\MetalType;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ProductController extends Controller
{
    /**
     * Display a listing of products with eager-loaded relations and optional filtering.
     */
    public function index(Request $request): JsonResponse
    {
        $search = $request->query('search');
        $categoryId = $request->query('category_id');
        $metalTypeId = $request->query('metal_type_id');
        $status = $request->query('status');
        $sort = $request->query('sort', 'created_at');
        $direction = strtolower($request->query('direction', 'desc')) === 'asc' ? 'asc' : 'desc';

        $query = Product::with(['category', 'metalType', 'image', 'unit']);

        // Search by name, code_sku, or barcode
        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('code_sku', 'like', "%{$search}%")
                    ->orWhere('barcode', 'like', "%{$search}%");
            });
        }

        // Filter by category
        if (!empty($categoryId) && $categoryId !== 'all') {
            $query->where('category_id', $categoryId);
        }

        // Filter by metal type
        if (!empty($metalTypeId) && $metalTypeId !== 'all') {
            $query->where('metal_type_id', $metalTypeId);
        }

        // Filter by status
        if (!empty($status) && $status !== 'all') {
            $query->where('status', $status);
        }

        // Whitelist sortable columns
        $allowedSorts = [
            'id',
            'name',
            'code_sku',
            'barcode',
            'net_weight',
            'gross_weight',
            'labor_cost',
            'markup_rate',
            'stock_qty',
            'status',
            'created_at',
            'updated_at',
        ];

        if (in_array($sort, $allowedSorts, true)) {
            $query->orderBy($sort, $direction);
        } else {
            $query->latest();
        }

        // Paginate if requested
        if ($request->has('page') || $request->query('paginate')) {
            $perPage = (int) $request->query('per_page', 10);
            $products = $query->paginate($perPage);
        } else {
            $products = $query->get();
        }

        return response()->json($products);
    }

    /**
     * Store a newly created product.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'category_id' => 'required|exists:categories,id',
            'metal_type_id' => 'required|exists:metal_types,id',
            'code_sku' => 'nullable|string|max:100|unique:products,code_sku',
            'barcode' => 'nullable|string|max:100',
            'name' => 'required|string|max:255',
            'net_weight' => 'required|numeric|min:0',
            'gross_weight' => 'nullable|numeric|min:0',
            'labor_cost' => 'nullable|numeric|min:0',
            'markup_rate' => 'nullable|numeric|min:0',
            'stock_qty' => 'nullable|integer|min:0',
            'status' => 'nullable|string|in:active,inactive,out_of_stock',
            'image_id' => 'nullable|exists:images,id',
        ]);

        $validated['code_sku'] = !empty($validated['code_sku']) ? $validated['code_sku'] : ('SKU' . bin2hex(random_bytes(4)) . time());
        $validated['barcode'] = !empty($validated['barcode']) ? $validated['barcode'] : ('884' . date('mdY') . mt_rand(1000, 9999));
        $validated['gross_weight'] = $validated['gross_weight'] ?? $validated['net_weight'];
        $validated['labor_cost'] = $validated['labor_cost'] ?? 0;
        $validated['markup_rate'] = $validated['markup_rate'] ?? 0;
        $validated['stock_qty'] = $validated['stock_qty'] ?? 0;
        $validated['status'] = $validated['status'] ?? 'active';

        $product = Product::create($validated);
        $product->load(['category', 'metalType', 'image', 'unit']);

        return response()->json($product, 201);
    }

    /**
     * Display the specified product.
     */
    public function show($id): JsonResponse
    {
        $product = Product::with(['category', 'metalType', 'image', 'unit'])->findOrFail($id);

        return response()->json($product);
    }

    /**
     * Update the specified product.
     */
    public function update(Request $request, $id): JsonResponse
    {
        $product = Product::findOrFail($id);

        $validated = $request->validate([
            'category_id' => 'sometimes|required|exists:categories,id',
            'metal_type_id' => 'sometimes|required|exists:metal_types,id',
            'code_sku' => [
                'sometimes',
                'required',
                'string',
                'max:100',
                Rule::unique('products', 'code_sku')->ignore($product->id),
            ],
            'barcode' => 'nullable|string|max:100',
            'name' => 'sometimes|required|string|max:255',
            'net_weight' => 'sometimes|required|numeric|min:0',
            'gross_weight' => 'nullable|numeric|min:0',
            'labor_cost' => 'nullable|numeric|min:0',
            'markup_rate' => 'nullable|numeric|min:0',
            'stock_qty' => 'nullable|integer|min:0',
            'status' => 'nullable|string|in:active,inactive,out_of_stock',
            'image_id' => 'nullable|exists:images,id',
        ]);

        $product->update($validated);
        $product->load(['category', 'metalType', 'image', 'unit']);

        return response()->json($product);
    }

    /**
     * Remove the specified product.
     */
    public function destroy($id): JsonResponse
    {
        $product = Product::findOrFail($id);
        $product->delete();

        return response()->json([
            'success' => true,
            'message' => 'Product deleted successfully.',
        ]);
    }
}
