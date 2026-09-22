<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Store;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class StoreController extends Controller
{
    /**
     * Display a listing of all stores.
     */
    public function index(): JsonResponse
    {
        $stores = Store::query()
            ->orderBy('is_primary', 'desc')
            ->orderBy('id', 'asc')
            ->get();

        return response()->json($stores);
    }

    /**
     * Get the primary / default store profile for app branding & invoices.
     */
    public function primary(): JsonResponse
    {
        $store = Store::query()->where('is_primary', true)->first()
            ?? Store::query()->first();

        if (!$store) {
            $store = Store::create([
                'name' => 'JewelFlow Luxury Atelier & ERP',
                'phone' => '+855 (0) 23 999 888',
                'email' => 'contact@jewelflow.com',
                'address' => '#88 Preah Norodom Blvd, Sangkat Chey Chumneas, Phnom Penh, Cambodia',
                'vat_tin' => 'K002-901823901',
                'invoice_disclaimer' => 'Purchased jewelry may be exchanged within 7 days with official sales invoice.',
                'is_primary' => true,
                'is_active' => true,
            ]);
        }

        return response()->json($store);
    }

    /**
     * Store a newly created store atelier / branch.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|max:50',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:100',
            'address' => 'nullable|string',
            'vat_tin' => 'nullable|string|max:50',
            'logo' => 'nullable|string',
            'icon_image' => 'nullable|string',
            'invoice_disclaimer' => 'nullable|string',
            'is_primary' => 'nullable|boolean',
            'is_active' => 'nullable|boolean',
            'logo_file' => 'nullable|image|max:5120', // 5MB max
        ]);

        // Handle uploaded logo file if provided
        if ($request->hasFile('logo_file')) {
            $file = $request->file('logo_file');
            $path = $file->store('stores', 'public');
            $validated['logo'] = $path;
        }

        // If setting as primary, reset other stores
        if (!empty($validated['is_primary'])) {
            Store::where('is_primary', true)->update(['is_primary' => false]);
        }

        $store = Store::create($validated);

        return response()->json($store, 201);
    }

    /**
     * Display the specified store details.
     */
    public function show($id): JsonResponse
    {
        $store = Store::findOrFail($id);

        return response()->json($store);
    }

    /**
     * Update the specified store profile.
     */
    public function update(Request $request, $id): JsonResponse
    {
        $store = Store::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'code' => 'nullable|string|max:50',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:100',
            'address' => 'nullable|string',
            'vat_tin' => 'nullable|string|max:50',
            'logo' => 'nullable|string',
            'icon_image' => 'nullable|string',
            'invoice_disclaimer' => 'nullable|string',
            'is_primary' => 'nullable|boolean',
            'is_active' => 'nullable|boolean',
            'logo_file' => 'nullable|image|max:5120',
        ]);

        // Handle uploaded logo file if provided
        if ($request->hasFile('logo_file')) {
            $file = $request->file('logo_file');
            $path = $file->store('stores', 'public');
            $validated['logo'] = $path;
        }

        // If setting as primary, reset other stores
        if (!empty($validated['is_primary']) && !$store->is_primary) {
            Store::where('id', '!=', $store->id)->where('is_primary', true)->update(['is_primary' => false]);
        }

        $store->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Store profile updated successfully.',
            'store' => $store,
        ]);
    }

    /**
     * Dedicated endpoint to upload and set store logo/icon.
     */
    public function uploadLogo(Request $request, $id): JsonResponse
    {
        $store = Store::findOrFail($id);

        $request->validate([
            'logo' => 'nullable|string',
            'logo_file' => 'nullable|image|max:5120',
        ]);

        if ($request->hasFile('logo_file')) {
            $path = $request->file('logo_file')->store('stores', 'public');
            $store->update(['logo' => $path]);
        } elseif ($request->filled('logo')) {
            $store->update(['logo' => $request->input('logo')]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Store logo updated successfully.',
            'logo_url' => $store->logo_url,
            'store' => $store,
        ]);
    }

    /**
     * Remove the specified store.
     */
    public function destroy($id): JsonResponse
    {
        $store = Store::findOrFail($id);

        if ($store->is_primary && Store::count() > 1) {
            // Assign another store as primary
            Store::where('id', '!=', $store->id)->first()?->update(['is_primary' => true]);
        }

        $store->delete();

        return response()->json([
            'success' => true,
            'message' => 'Store removed successfully.',
        ]);
    }
}
