<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class ProfileController extends Controller
{
    /**
     * Process and store profile photo (base64 or uploaded file) into backend storage.
     */
    protected function handlePhotoInput(Request $request, ?User $user = null): ?string
    {
        // 1. Binary file upload
        if ($request->hasFile('photo') || $request->hasFile('image') || $request->hasFile('file')) {
            $file = $request->file('photo') ?? $request->file('image') ?? $request->file('file');
            $storedPath = $file->store('avatars', 'public');

            // Cleanup old avatar if exists
            $this->cleanupOldPhoto($user?->photo);

            return url('/storage/' . $storedPath);
        }

        $photoString = $request->input('photo');

        // If null or empty string provided explicitly
        if ($photoString === null || $photoString === '') {
            if ($request->has('photo') && empty($photoString)) {
                $this->cleanupOldPhoto($user?->photo);
                return null;
            }
            return $user?->photo;
        }

        // 2. Base64 Data URL
        if (str_starts_with($photoString, 'data:image')) {
            @list($type, $data) = explode(';', $photoString);
            @list(, $data) = explode(',', $data);

            preg_match('/data:image\/(.*?);/', $photoString, $matches);
            $ext = $matches[1] ?? 'png';
            if ($ext === 'jpeg') $ext = 'jpg';

            $filename = 'avatars/avatar_' . ($user?->id ?? uniqid()) . '_' . time() . '.' . $ext;
            Storage::disk('public')->put($filename, base64_decode($data));

            // Cleanup old avatar
            $this->cleanupOldPhoto($user?->photo);

            return url('/storage/' . $filename);
        }

        // 3. Keep existing string/URL
        return $photoString;
    }

    /**
     * Helper to cleanup physical avatar file from storage disk.
     */
    protected function cleanupOldPhoto(?string $photoUrl): void
    {
        if (empty($photoUrl)) return;

        if (str_contains($photoUrl, '/storage/avatars/')) {
            $parts = explode('/storage/', $photoUrl);
            $rel = end($parts);
            if (!empty($rel) && Storage::disk('public')->exists($rel)) {
                Storage::disk('public')->delete($rel);
            }
        }
    }

    /**
     * Helper to safely format user model.
     */
    protected function formatUserResponse(User $user): array
    {
        $rolePerms = [];
        if ($user->role) {
            $rolePerms = $user->role->permissions()->pluck('name')->toArray();
        }

        $directPerms = [];
        if (method_exists($user, 'permissions')) {
            $directPerms = $user->permissions()->pluck('name')->toArray();
        }

        $allPerms = array_values(array_unique(array_merge($rolePerms, $directPerms)));

        $userData = $user->toArray();
        $userData['all_permissions'] = $allPerms;
        $userData['direct_permissions'] = $directPerms;
        $userData['role_name'] = $user->role?->name ?? 'staff';
        $userData['role_display'] = match($user->role?->name) {
            'super_admin' => 'Super Administrator',
            'admin' => 'Master Jeweler / Admin',
            'manager' => 'Store Manager',
            'cashier' => 'POS Cashier',
            'goldsmith' => 'Master Goldsmith',
            'accountant' => 'Senior Accountant',
            default => ucfirst($user->role?->name ?? 'Staff Member')
        };

        return $userData;
    }

    /**
     * Get the authenticated user profile.
     */
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $user->load(['role.permissions', 'permissions']);

        return response()->json([
            'success' => true,
            'user' => $this->formatUserResponse($user),
        ]);
    }

    /**
     * Update the authenticated user profile.
     */
    public function update(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|string|email|max:255|unique:users,email,' . $user->id,
            'phone' => 'nullable|string|max:50',
            'photo' => 'nullable|string',
            'password' => 'nullable|string|min:6',
        ]);

        if ($request->hasFile('photo') || $request->has('photo')) {
            $validated['photo'] = $this->handlePhotoInput($request, $user);
        }

        if (!empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $user->update($validated);
        $user->load(['role.permissions', 'permissions']);

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully.',
            'user' => $this->formatUserResponse($user),
        ]);
    }

    /**
     * Delete the authenticated user account.
     */
    public function destroy(Request $request): JsonResponse
    {
        $user = $request->user();
        if ($user) {
            if ($user->role?->name === 'super_admin' || $user->email === 'superadmin@jewelflow.com') {
                return response()->json(['success' => false, 'message' => 'Cannot delete SuperAdmin profile.'], 422);
            }
            $user->delete();
        }

        return response()->json(['success' => true, 'message' => 'Account deleted successfully.']);
    }
}
