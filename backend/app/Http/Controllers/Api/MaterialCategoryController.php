<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MaterialCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class MaterialCategoryController extends Controller
{
    public function index(): JsonResponse
    {
        $categories = MaterialCategory::withCount('materials')->latest()->get();
        return response()->json($categories);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:material_categories,slug',
            'code' => 'nullable|string|max:50',
            'description' => 'nullable|string',
        ]);

        if (empty($validated['slug'])) {
            $validated['slug'] = Str::slug($validated['name']) . '-' . Str::random(4);
        }

        $category = MaterialCategory::create($validated);
        $category->loadCount('materials');

        return response()->json($category, 201);
    }

    public function show($id): JsonResponse
    {
        $category = MaterialCategory::with('materials')->findOrFail($id);
        return response()->json($category);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $category = MaterialCategory::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:material_categories,slug,' . $category->id,
            'code' => 'nullable|string|max:50',
            'description' => 'nullable|string',
        ]);

        $category->update($validated);
        $category->loadCount('materials');

        return response()->json($category);
    }

    public function destroy($id): JsonResponse
    {
        $category = MaterialCategory::findOrFail($id);
        $category->delete();

        return response()->json([
            'success' => true,
            'message' => 'Material category deleted successfully.',
        ]);
    }
}
