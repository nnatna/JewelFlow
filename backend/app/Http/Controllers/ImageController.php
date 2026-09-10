<?php

namespace App\Http\Controllers;

use App\Models\Image;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class ImageController extends Controller
{
    /**
     * Display a listing of stored images with optional filtering and pagination.
     */
    public function index(Request $request)
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
            $perPage = (int)$request->query('per_page', 12);
            $images = $query->paginate($perPage);
        } else {
            $images = $query->get();
        }

        if ($request->wantsJson() || $request->is('api/*') || !view()->exists('images.index')) {
            return response()->json($images);
        }

        return view('images.index', compact('images', 'search', 'sort', 'direction'));
    }

    /**
     * Show the form for creating a new image or upload screen.
     */
    public function create(Request $request)
    {
        if ($request->wantsJson() || $request->is('api/*') || !view()->exists('images.create')) {
            return response()->json(['message' => 'Upload endpoint accepts POST /api/images with file or url']);
        }

        return view('images.create');
    }

    /**
     * Store a newly uploaded or registered image in storage.
     * Supports both multipart file upload (image/file) and external URL registration (url/path).
     */
    public function store(Request $request)
    {
        // 1. Check if a binary file was uploaded
        if ($request->hasFile('image') || $request->hasFile('file')) {
            $fileKey = $request->hasFile('image') ? 'image' : 'file';

            $request->validate([
                $fileKey      => 'required|file|image|mimes:jpeg,png,jpg,webp,gif,svg|max:10240',
                'product_id'  => 'nullable|exists:products,id',
            ]);

            $file = $request->file($fileKey);
            $storedPath = $file->store('images', 'public');

            $image = Image::create([
                'filename'  => $file->getClientOriginalName(),
                'path'      => '/storage/' . $storedPath,
                'mime_type' => $file->getClientMimeType(),
                'size'      => $file->getSize(),
            ]);
        } else {
            // 2. Direct URL or path registration
            $validated = $request->validate([
                'path'        => 'required_without:url|string',
                'url'         => 'required_without:path|string',
                'filename'    => 'nullable|string|max:255',
                'mime_type'   => 'nullable|string|max:100',
                'size'        => 'nullable|integer|min:0',
                'product_id'  => 'nullable|exists:products,id',
            ]);

            $path = $validated['path'] ?? $validated['url'];
            $filename = $validated['filename'] ?? (basename(parse_url($path, PHP_URL_PATH)) ?: 'image_' . time() . '.jpg');

            $image = Image::create([
                'filename'  => $filename,
                'path'      => $path,
                'mime_type' => $validated['mime_type'] ?? 'image/jpeg',
                'size'      => $validated['size'] ?? 0,
            ]);
        }

        // Optional: Attach directly to product if product_id was supplied
        if ($request->filled('product_id')) {
            Product::where('id', $request->input('product_id'))->update(['image_id' => $image->id]);
        }

        $image->loadCount('products');

        if ($request->wantsJson() || $request->is('api/*') || !view()->exists('images.index')) {
            return response()->json($image, 201);
        }

        return redirect()->route('images.index')->with('success', 'Image uploaded successfully.');
    }

    /**
     * Display the specified image.
     */
    public function show(Request $request, $id)
    {
        $image = $id instanceof Image
            ? $id
            : Image::with('products')->findOrFail($id);

        if (!$image->relationLoaded('products')) {
            $image->load('products');
        }

        if ($request->wantsJson() || $request->is('api/*') || !view()->exists('images.show')) {
            return response()->json($image);
        }

        return view('images.show', compact('image'));
    }

    /**
     * Show the form for editing the specified image.
     */
    public function edit(Request $request, $id)
    {
        $image = $id instanceof Image ? $id : Image::findOrFail($id);

        if ($request->wantsJson() || $request->is('api/*') || !view()->exists('images.edit')) {
            return response()->json($image);
        }

        return view('images.edit', compact('image'));
    }

    /**
     * Update the specified image metadata or replace its file.
     */
    public function update(Request $request, $id)
    {
        $image = $id instanceof Image ? $id : Image::findOrFail($id);

        if ($request->hasFile('image') || $request->hasFile('file')) {
            $fileKey = $request->hasFile('image') ? 'image' : 'file';

            $request->validate([
                $fileKey => 'required|file|image|mimes:jpeg,png,jpg,webp,gif,svg|max:10240',
            ]);

            // Clean up old local file if applicable
            $this->deletePhysicalFile($image->path);

            $file = $request->file($fileKey);
            $storedPath = $file->store('images', 'public');

            $image->update([
                'filename'  => $file->getClientOriginalName(),
                'path'      => '/storage/' . $storedPath,
                'mime_type' => $file->getClientMimeType(),
                'size'      => $file->getSize(),
            ]);
        } else {
            $validated = $request->validate([
                'filename'  => 'sometimes|required|string|max:255',
                'path'      => 'sometimes|required|string',
                'mime_type' => 'nullable|string|max:100',
                'size'      => 'nullable|integer|min:0',
            ]);

            $image->update($validated);
        }

        $image->loadCount('products');

        if ($request->wantsJson() || $request->is('api/*') || !view()->exists('images.index')) {
            return response()->json($image);
        }

        return redirect()->route('images.index')->with('success', 'Image updated successfully.');
    }

    /**
     * Remove the specified image from storage and delete physical file if local.
     */
    public function destroy(Request $request, $id)
    {
        $image = $id instanceof Image ? $id : Image::findOrFail($id);

        // Delete physical file from public disk if locally stored
        $this->deletePhysicalFile($image->path);

        // Dissociate from any products using this image
        Product::where('image_id', $image->id)->update(['image_id' => null]);

        $image->delete();

        if ($request->wantsJson() || $request->is('api/*') || !view()->exists('images.index')) {
            return response()->json([
                'success' => true,
                'message' => 'Image deleted successfully.',
            ]);
        }

        return redirect()->route('images.index')->with('success', 'Image deleted successfully.');
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
