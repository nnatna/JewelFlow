<?php

namespace App\Http\Controllers;

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
    public function index(Request $request)
    {
        $search = $request->query('search');
        $categoryId = $request->query('category_id');
        $metalTypeId = $request->query('metal_type_id');
        $status = $request->query('status');
        $sort = $request->query('sort', 'created_at');
        $direction = strtolower($request->query('direction', 'desc')) === 'asc' ? 'asc' : 'desc';

        $query = Product::with(['category', 'metalType', 'image', 'productGemstones']);

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
            'id', 'name', 'code_sku', 'barcode', 'net_weight',
            'gross_weight', 'labor_cost', 'markup_rate', 'stock_qty',
            'status', 'created_at', 'updated_at'
        ];

        if (in_array($sort, $allowedSorts, true)) {
            $query->orderBy($sort, $direction);
        } else {
            $query->latest();
        }

        // Paginate if requested
        if ($request->has('page') || $request->query('paginate')) {
            $perPage = (int)$request->query('per_page', 10);
            $products = $query->paginate($perPage);
        } else {
            $products = $query->get();
        }

        if ($request->wantsJson() || $request->is('api/*') || !view()->exists('products.index')) {
            return response()->json($products);
        }

        return view('products.index', compact('products', 'search', 'sort', 'direction'));
    }

    /**
     * Show the form for creating a new resource or return dropdown metadata.
     */
    public function create(Request $request)
    {
        $categories = Category::all();
        $metalTypes = MetalType::all();

        if ($request->wantsJson() || $request->is('api/*') || !view()->exists('products.create')) {
            return response()->json([
                'categories'  => $categories,
                'metal_types' => $metalTypes,
            ]);
        }

        return view('products.create', compact('categories', 'metalTypes'));
    }

    /**
     * Store a newly created product in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'category_id'   => 'required|exists:categories,id',
            'metal_type_id' => 'required|exists:metal_types,id',
            'code_sku'      => 'required|string|max:100|unique:products,code_sku',
            'barcode'       => 'nullable|string|max:100',
            'name'          => 'required|string|max:255',
            'net_weight'    => 'required|numeric|min:0',
            'gross_weight'  => 'nullable|numeric|min:0',
            'labor_cost'    => 'nullable|numeric|min:0',
            'markup_rate'   => 'nullable|numeric|min:0',
            'stock_qty'     => 'nullable|integer|min:0',
            'status'        => 'nullable|string|in:active,inactive,out_of_stock',
            'image_id'      => 'nullable|exists:images,id',
        ]);

        $validated['gross_weight'] = $validated['gross_weight'] ?? $validated['net_weight'];
        $validated['labor_cost'] = $validated['labor_cost'] ?? 0;
        $validated['markup_rate'] = $validated['markup_rate'] ?? 0;
        $validated['stock_qty'] = $validated['stock_qty'] ?? 0;
        $validated['status'] = $validated['status'] ?? 'active';

        $product = Product::create($validated);
        $product->load(['category', 'metalType', 'image', 'productGemstones']);

        if ($request->wantsJson() || $request->is('api/*') || !view()->exists('products.index')) {
            return response()->json($product, 201);
        }

        return redirect()->route('products.index')->with('success', 'Product created successfully.');
    }

    /**
     * Display the specified product.
     */
    public function show(Request $request, $id)
    {
        $product = $id instanceof Product
            ? $id
            : Product::with(['category', 'metalType', 'image', 'productGemstones'])->findOrFail($id);

        if (!$product->relationLoaded('category')) {
            $product->load(['category', 'metalType', 'image', 'productGemstones']);
        }

        if ($request->wantsJson() || $request->is('api/*') || !view()->exists('products.show')) {
            return response()->json($product);
        }

        return view('products.show', compact('product'));
    }

    /**
     * Show the form for editing the specified product.
     */
    public function edit(Request $request, $id)
    {
        $product = $id instanceof Product
            ? $id
            : Product::with(['category', 'metalType', 'image', 'productGemstones'])->findOrFail($id);

        $categories = Category::all();
        $metalTypes = MetalType::all();

        if ($request->wantsJson() || $request->is('api/*') || !view()->exists('products.edit')) {
            return response()->json([
                'product'     => $product,
                'categories'  => $categories,
                'metal_types' => $metalTypes,
            ]);
        }

        return view('products.edit', compact('product', 'categories', 'metalTypes'));
    }

    /**
     * Update the specified product in storage.
     */
    public function update(Request $request, $id)
    {
        $product = $id instanceof Product ? $id : Product::findOrFail($id);

        $validated = $request->validate([
            'category_id'   => 'sometimes|required|exists:categories,id',
            'metal_type_id' => 'sometimes|required|exists:metal_types,id',
            'code_sku'      => [
                'sometimes',
                'required',
                'string',
                'max:100',
                Rule::unique('products', 'code_sku')->ignore($product->id),
            ],
            'barcode'       => 'nullable|string|max:100',
            'name'          => 'sometimes|required|string|max:255',
            'net_weight'    => 'sometimes|required|numeric|min:0',
            'gross_weight'  => 'nullable|numeric|min:0',
            'labor_cost'    => 'nullable|numeric|min:0',
            'markup_rate'   => 'nullable|numeric|min:0',
            'stock_qty'     => 'nullable|integer|min:0',
            'status'        => 'nullable|string|in:active,inactive,out_of_stock',
            'image_id'      => 'nullable|exists:images,id',
        ]);

        $product->update($validated);
        $product->load(['category', 'metalType', 'image', 'productGemstones']);

        if ($request->wantsJson() || $request->is('api/*') || !view()->exists('products.index')) {
            return response()->json($product);
        }

        return redirect()->route('products.index')->with('success', 'Product updated successfully.');
    }

    /**
     * Remove the specified product from storage.
     */
    public function destroy(Request $request, $id)
    {
        $product = $id instanceof Product ? $id : Product::findOrFail($id);
        $product->delete();

        if ($request->wantsJson() || $request->is('api/*') || !view()->exists('products.index')) {
            return response()->json([
                'success' => true,
                'message' => 'Product deleted successfully.'
            ]);
        }

        return redirect()->route('products.index')->with('success', 'Product deleted successfully.');
    }
}
