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
        $materialId = $request->query('material_id');
        $metalTypeId = $request->query('metal_type_id');
        $status = $request->query('status');
        $sort = $request->query('sort', 'created_at');
        $direction = strtolower($request->query('direction', 'desc')) === 'asc' ? 'asc' : 'desc';

        $query = Product::with(['category', 'unitRelation', 'material.metalType', 'material.unitRelation', 'image']);

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

        // Filter by material
        if (!empty($materialId) && $materialId !== 'all') {
            $query->where('material_id', $materialId);
        }

        // Filter by metal type through material
        if (!empty($metalTypeId) && $metalTypeId !== 'all') {
            $query->whereHas('material', function ($q) use ($metalTypeId) {
                $q->where('metal_type_id', $metalTypeId);
            });
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
            'material_id' => 'nullable|exists:materials,id',
            'metal_type_id' => 'nullable|exists:metal_types,id',
            'unit_id' => 'nullable|exists:units,id',
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

        // Auto-resolve material_id if not explicitly provided
        if (empty($validated['material_id'])) {
            if (!empty($validated['metal_type_id'])) {
                $matchedMat = \App\Models\Material::where('metal_type_id', $validated['metal_type_id'])->first();
                if (!$matchedMat) {
                    $matchedMat = \App\Models\Material::create([
                        'metal_type_id' => $validated['metal_type_id'],
                        'name' => 'Raw Metal Material #' . $validated['metal_type_id'],
                        'stock_qty' => 100,
                        'cost_price' => 80.00,
                    ]);
                }
                $validated['material_id'] = $matchedMat->id;
            } else {
                $firstMat = \App\Models\Material::first();
                if (!$firstMat) {
                    $firstMetal = \App\Models\MetalType::first() ?? \App\Models\MetalType::create(['name' => '24K Gold', 'purity' => 99.9, 'unit' => 'g']);
                    $firstMat = \App\Models\Material::create([
                        'metal_type_id' => $firstMetal->id,
                        'name' => 'Default Raw Material',
                        'stock_qty' => 100,
                        'cost_price' => 80.00,
                    ]);
                }
                $validated['material_id'] = $firstMat->id;
            }
        }
        unset($validated['metal_type_id']);

        // Handle Base64 or URL image
        if ($request->filled('image')) {
            $imgVal = $request->input('image');
            if (is_string($imgVal) && str_starts_with($imgVal, 'data:image')) {
                try {
                    @list($type, $data) = explode(';', $imgVal);
                    @list(, $data)      = explode(',', $data);
                    $data = base64_decode($data);
                    $ext = 'jpg';
                    if (preg_match('/data:image\/(.*?);/', $imgVal, $matches)) {
                        $ext = $matches[1] === 'jpeg' ? 'jpg' : $matches[1];
                    }
                    $filename = 'product_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
                    \Illuminate\Support\Facades\Storage::disk('public')->put('images/' . $filename, $data);
                    $imageRecord = \App\Models\Image::create([
                        'filename' => $filename,
                        'path' => '/storage/images/' . $filename,
                        'mime_type' => 'image/' . $ext,
                        'size' => strlen($data),
                    ]);
                    $validated['image_id'] = $imageRecord->id;
                } catch (\Exception $e) {
                    \Log::warning('Failed to store base64 image: ' . $e->getMessage());
                }
            } elseif (is_string($imgVal) && !empty($imgVal)) {
                $imageRecord = \App\Models\Image::firstOrCreate(
                    ['path' => $imgVal],
                    [
                        'filename' => basename(parse_url($imgVal, PHP_URL_PATH)) ?: ('product_' . time() . '.jpg'),
                        'mime_type' => 'image/jpeg',
                        'size' => 0,
                    ]
                );
                $validated['image_id'] = $imageRecord->id;
            }
        }

        $product = Product::create($validated);
        $product->load(['category', 'material.metalType', 'material.unitRelation', 'image']);

        return response()->json($product, 201);
    }

    /**
     * Display the specified product.
     */
    public function show($id): JsonResponse
    {
        $product = Product::with(['category', 'material.metalType', 'material.unitRelation', 'image'])->findOrFail($id);

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
            'material_id' => 'nullable|exists:materials,id',
            'metal_type_id' => 'nullable|exists:metal_types,id',
            'unit_id' => 'nullable|exists:units,id',
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

        if (isset($validated['metal_type_id'])) {
            if (empty($validated['material_id'])) {
                $matchedMat = \App\Models\Material::where('metal_type_id', $validated['metal_type_id'])->first();
                if ($matchedMat) {
                    $validated['material_id'] = $matchedMat->id;
                }
            }
            unset($validated['metal_type_id']);
        }

        // Handle Base64 or URL image on update
        if ($request->filled('image')) {
            $imgVal = $request->input('image');
            if (is_string($imgVal) && str_starts_with($imgVal, 'data:image')) {
                try {
                    @list($type, $data) = explode(';', $imgVal);
                    @list(, $data)      = explode(',', $data);
                    $data = base64_decode($data);
                    $ext = 'jpg';
                    if (preg_match('/data:image\/(.*?);/', $imgVal, $matches)) {
                        $ext = $matches[1] === 'jpeg' ? 'jpg' : $matches[1];
                    }
                    $filename = 'product_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
                    \Illuminate\Support\Facades\Storage::disk('public')->put('images/' . $filename, $data);
                    $imageRecord = \App\Models\Image::create([
                        'filename' => $filename,
                        'path' => '/storage/images/' . $filename,
                        'mime_type' => 'image/' . $ext,
                        'size' => strlen($data),
                    ]);
                    $validated['image_id'] = $imageRecord->id;
                } catch (\Exception $e) {
                    \Log::warning('Failed to store base64 image on update: ' . $e->getMessage());
                }
            } elseif (is_string($imgVal) && !empty($imgVal)) {
                $imageRecord = \App\Models\Image::firstOrCreate(
                    ['path' => $imgVal],
                    [
                        'filename' => basename(parse_url($imgVal, PHP_URL_PATH)) ?: ('product_' . time() . '.jpg'),
                        'mime_type' => 'image/jpeg',
                        'size' => 0,
                    ]
                );
                $validated['image_id'] = $imageRecord->id;
            }
        }

        $product->update($validated);
        $product->load(['category', 'material.metalType', 'material.unitRelation', 'image']);

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
