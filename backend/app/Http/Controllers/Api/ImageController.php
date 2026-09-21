<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Image;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ImageController extends Controller
{
    /**
     * Display a listing of stored images with optional filtering and pagination.
     */
    public function index(Request $request): JsonResponse
    {
        $search = $request->query('search');
        $mimeType = $request->query('mime_type');
        $sort = $request->query('sort', 'created_at');
        $direction = strtolower($request->query('direction', 'desc')) === 'asc' ? 'asc' : 'desc';

        $query = Image::withCount('products');

        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('filename', 'like', "%{$search}%")
                  ->orWhere('path', 'like', "%{$search}%");
            });
        }

        if (!empty($mimeType) && $mimeType !== 'all') {
            $query->where('mime_type', 'like', "%{$mimeType}%");
        }

        $allowedSorts = ['id', 'filename', 'size', 'mime_type', 'created_at', 'updated_at'];
        if (in_array($sort, $allowedSorts, true)) {
            $query->orderBy($sort, $direction);
        } else {
            $query->latest();
        }

        if ($request->has('page') || $request->query('paginate')) {
            $perPage = (int) $request->query('per_page', 12);
            $images = $query->paginate($perPage);
        } else {
            $images = $query->get();
        }

        return response()->json($images);
    }

    /**
     * Store a newly uploaded or registered image.
     */
    public function store(Request $request): JsonResponse
    {
        // 1. Binary file upload
        if ($request->hasFile('image') || $request->hasFile('file')) {
            $fileKey = $request->hasFile('image') ? 'image' : 'file';

            $request->validate([
                $fileKey => 'required|file|image|mimes:jpeg,png,jpg,webp,gif,svg|max:10240',
                'product_id' => 'nullable|exists:products,id',
            ]);

            $file = $request->file($fileKey);
            $storedPath = $file->store('images', 'public');

            $image = Image::create([
                'filename' => $file->getClientOriginalName(),
                'path' => '/storage/' . $storedPath,
                'mime_type' => $file->getClientMimeType(),
                'size' => $file->getSize(),
            ]);
        } else {
            // 2. URL or path registration
            $validated = $request->validate([
                'path' => 'required_without:url|string',
                'url' => 'required_without:path|string',
                'filename' => 'nullable|string|max:255',
                'mime_type' => 'nullable|string|max:100',
                'size' => 'nullable|integer|min:0',
                'product_id' => 'nullable|exists:products,id',
            ]);

            $path = $validated['path'] ?? $validated['url'];
            $filename = $validated['filename'] ?? (basename(parse_url($path, PHP_URL_PATH)) ?: 'image_' . time() . '.jpg');

            $image = Image::create([
                'filename' => $filename,
                'path' => $path,
                'mime_type' => $validated['mime_type'] ?? 'image/jpeg',
                'size' => $validated['size'] ?? 0,
            ]);
        }

        if ($request->filled('product_id')) {
            Product::where('id', $request->input('product_id'))->update(['image_id' => $image->id]);
        }

        $image->loadCount('products');

        return response()->json($image, 201);
    }

    /**
     * Display the specified image.
     */
    public function show($id): JsonResponse
    {
        $image = Image::with('products')->findOrFail($id);

        return response()->json($image);
    }

    /**
     * Update the specified image.
     */
    public function update(Request $request, $id): JsonResponse
    {
        $image = Image::findOrFail($id);

        if ($request->hasFile('image') || $request->hasFile('file')) {
            $fileKey = $request->hasFile('image') ? 'image' : 'file';

            $request->validate([
                $fileKey => 'required|file|image|mimes:jpeg,png,jpg,webp,gif,svg|max:10240',
            ]);

            $this->deletePhysicalFile($image->path);

            $file = $request->file($fileKey);
            $storedPath = $file->store('images', 'public');

            $image->update([
                'filename' => $file->getClientOriginalName(),
                'path' => '/storage/' . $storedPath,
                'mime_type' => $file->getClientMimeType(),
                'size' => $file->getSize(),
            ]);
        } else {
            $validated = $request->validate([
                'filename' => 'sometimes|required|string|max:255',
                'path' => 'sometimes|required|string',
                'mime_type' => 'nullable|string|max:100',
                'size' => 'nullable|integer|min:0',
            ]);

            $image->update($validated);
        }

        $image->loadCount('products');

        return response()->json($image);
    }

    /**
     * Remove the specified image from storage and DB.
     */
    public function destroy($id): JsonResponse
    {
        $image = Image::findOrFail($id);

        $this->deletePhysicalFile($image->path);
        Product::where('image_id', $image->id)->update(['image_id' => null]);
        $image->delete();

        return response()->json([
            'success' => true,
            'message' => 'Image deleted successfully.',
        ]);
    }

    /**
     * Helper to delete local storage file if path points to local storage.
     */
    protected function deletePhysicalFile(?string $path): void
    {
        if (empty($path)) {
            return;
        }

        $cleaned = ltrim($path, '/');
        if (str_starts_with($cleaned, 'storage/')) {
            $relativeStoragePath = substr($cleaned, strlen('storage/'));
            if (Storage::disk('public')->exists($relativeStoragePath)) {
                Storage::disk('public')->delete($relativeStoragePath);
            }
        }
    }
}
