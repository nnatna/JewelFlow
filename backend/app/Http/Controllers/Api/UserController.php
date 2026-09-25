<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Permission;

class UserController extends Controller
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
     * Helper to safely format user model to array with merged permissions.
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
     * Display a listing of users with roles and permissions.
     */
    public function index(Request $request): JsonResponse
    {
        $authUser = $request->user() ?? auth('sanctum')->user();
        $isSuperAdmin = $authUser && ($authUser->role?->name === 'super_admin' || $authUser->email === 'admin@jewelflow.com');

        $search = $request->query('search');
        $roleFilter = $request->query('role');
        $statusFilter = $request->query('status');
        $sort = $request->query('sort', 'created_at');
        $direction = strtolower($request->query('direction', 'desc')) === 'asc' ? 'asc' : 'desc';

        $query = User::with(['role.permissions', 'permissions'])
            ->when(!$isSuperAdmin, function ($q) {
                $q->whereDoesntHave('role', fn($r) => $r->where('name', 'super_admin'))
                  ->where('email', '!=', 'admin@jewelflow.com');
            })
            ->when($search, function ($q, $search) {
                $q->where(function ($sub) use ($search) {
                    $sub->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%");
                });
            })
            ->when($roleFilter && $roleFilter !== 'all', function ($q) use ($roleFilter) {
                $q->whereHas('role', fn($r) => $r->where('name', $roleFilter))
                  ->orWhere('role_id', $roleFilter);
            })
            ->when($statusFilter && $statusFilter !== 'all', function ($q) use ($statusFilter) {
                $q->where('status', $statusFilter);
            })
            ->orderBy($sort, $direction);

        if ($request->has('page') || $request->query('paginate')) {
            $perPage = (int) $request->query('per_page', 10);
            return response()->json($query->paginate($perPage));
        }

        $users = $query->get()->map(fn($u) => $this->formatUserResponse($u));

        return response()->json($users);
    }

    /**
     * Store a newly created user with role & permissions.
     */
    public function store(Request $request): JsonResponse
    {
        $authUser = $request->user() ?? auth('sanctum')->user();
        $isSuperAdmin = $authUser && ($authUser->role?->name === 'super_admin' || $authUser->email === 'admin@jewelflow.com');

        if ($authUser) {
            $canCreate = in_array($authUser->role?->name, ['super_admin', 'admin', 'manager']) 
                || (method_exists($authUser, 'hasPermissionTo') && $authUser->hasPermissionTo('manage_users'));
            if (!$canCreate) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized: You do not have permission to create staff accounts.',
                ], 403);
            }
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email',
            'phone' => 'nullable|string|max:50',
            'photo' => 'nullable|string',
            'role_id' => 'nullable|exists:roles,id',
            'role_name' => 'nullable|string',
            'password' => 'required|string|min:6',
            'status' => 'nullable|in:active,inactive',
            'permissions' => 'nullable|array',
            'permissions.*' => 'string|exists:permissions,name',
        ]);

        if (empty($validated['role_id']) && !empty($validated['role_name'])) {
            $role = Role::where('name', $validated['role_name'])->first();
            $validated['role_id'] = $role?->id;
        }

        // Prevent non-super-admins from assigning super_admin role
        if (!$isSuperAdmin && !empty($validated['role_id'])) {
            $targetRole = Role::find($validated['role_id']);
            if ($targetRole?->name === 'super_admin') {
                $validated['role_id'] = Role::where('name', 'admin')->value('id') ?? $validated['role_id'];
            }
        }

        if ($request->hasFile('photo') || $request->has('photo')) {
            $validated['photo'] = $this->handlePhotoInput($request);
        }

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'photo' => $validated['photo'] ?? null,
            'role_id' => $validated['role_id'] ?? null,
            'password' => Hash::make($validated['password']),
            'status' => $validated['status'] ?? 'active',
        ]);

        if ($user->role) {
            $user->syncRoles([$user->role->name]);
        } elseif (!empty($validated['role_name'])) {
            $user->syncRoles([$validated['role_name']]);
        }

        if (!empty($validated['permissions'])) {
            $user->syncPermissions($validated['permissions']);
        }

        $user->load(['role.permissions', 'permissions']);

        return response()->json($this->formatUserResponse($user), 201);
    }

    /**
     * Display the specified user.
     */
    public function show(Request $request, $id): JsonResponse
    {
        $authUser = $request->user() ?? auth('sanctum')->user();
        $isSuperAdmin = $authUser && ($authUser->role?->name === 'super_admin' || $authUser->email === 'admin@jewelflow.com');

        $user = User::with(['role.permissions', 'permissions'])->findOrFail($id);

        if (!$isSuperAdmin && ($user->role?->name === 'super_admin' || $user->email === 'admin@jewelflow.com')) {
            return response()->json(['message' => 'User not found.'], 404);
        }

        return response()->json($this->formatUserResponse($user));
    }

    /**
     * Update the specified user.
     */
    public function update(Request $request, $id): JsonResponse
    {
        $authUser = $request->user() ?? auth('sanctum')->user();
        $isSuperAdmin = $authUser && ($authUser->role?->name === 'super_admin' || $authUser->email === 'admin@jewelflow.com');

        if ($authUser) {
            $canUpdate = in_array($authUser->role?->name, ['super_admin', 'admin', 'manager']) 
                || (method_exists($authUser, 'hasPermissionTo') && $authUser->hasPermissionTo('manage_users'));
            if (!$canUpdate) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized: You do not have permission to modify staff accounts.',
                ], 403);
            }
        }

        $user = User::findOrFail($id);

        if (!$isSuperAdmin && ($user->role?->name === 'super_admin' || $user->email === 'admin@jewelflow.com')) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized: You cannot edit a Super Administrator account.',
            ], 403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|string|email|max:255|unique:users,email,' . $user->id,
            'phone' => 'nullable|string|max:50',
            'photo' => 'nullable|string',
            'role_id' => 'nullable|exists:roles,id',
            'role_name' => 'nullable|string',
            'password' => 'nullable|string|min:6',
            'status' => 'nullable|in:active,inactive',
            'permissions' => 'nullable|array',
            'permissions.*' => 'string|exists:permissions,name',
        ]);

        if (isset($validated['role_name']) && empty($validated['role_id'])) {
            $role = Role::where('name', $validated['role_name'])->first();
            $validated['role_id'] = $role?->id;
        }

        // Prevent non-super-admins from promoting to super_admin
        if (!$isSuperAdmin && !empty($validated['role_id'])) {
            $targetRole = Role::find($validated['role_id']);
            if ($targetRole?->name === 'super_admin') {
                $validated['role_id'] = $user->role_id;
            }
        }

        if ($request->hasFile('photo') || $request->has('photo')) {
            $validated['photo'] = $this->handlePhotoInput($request, $user);
        }

        if (!empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $user->update($validated);

        if ($user->role_id) {
            $role = Role::find($user->role_id);
            if ($role) {
                $user->syncRoles([$role->name]);
            }
        }

        if (isset($validated['permissions'])) {
            $user->syncPermissions($validated['permissions']);
        }

        $user->load(['role.permissions', 'permissions']);

        return response()->json($this->formatUserResponse($user));
    }

    /**
     * Toggle active/inactive status of a user.
     */
    public function toggleStatus(Request $request, $id): JsonResponse
    {
        $authUser = $request->user() ?? auth('sanctum')->user();
        $isSuperAdmin = $authUser && ($authUser->role?->name === 'super_admin' || $authUser->email === 'admin@jewelflow.com');

        if ($authUser) {
            $canToggle = in_array($authUser->role?->name, ['super_admin', 'admin', 'manager']) 
                || (method_exists($authUser, 'hasPermissionTo') && $authUser->hasPermissionTo('manage_users'));
            if (!$canToggle) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized: You do not have permission to update staff status.',
                ], 403);
            }
        }

        $user = User::findOrFail($id);

        if (!$isSuperAdmin && ($user->role?->name === 'super_admin' || $user->email === 'admin@jewelflow.com')) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized: You cannot modify Super Administrator status.',
            ], 403);
        }

        $newStatus = $user->status === 'active' ? 'inactive' : 'active';
        $user->update(['status' => $newStatus]);

        return response()->json([
            'success' => true,
            'status' => $newStatus,
            'message' => "User status updated to {$newStatus}.",
        ]);
    }

    /**
     * Sync custom direct permissions for a user.
     */
    public function syncPermissions(Request $request, $id): JsonResponse
    {
        $authUser = $request->user() ?? auth('sanctum')->user();
        if ($authUser) {
            $canSync = in_array($authUser->role?->name, ['super_admin', 'admin']);
            if (!$canSync) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized: Only administrators can assign direct permissions.',
                ], 403);
            }
        }

        $user = User::findOrFail($id);

        $validated = $request->validate([
            'permissions' => 'present|array',
            'permissions.*' => 'string|exists:permissions,name',
        ]);

        $user->syncPermissions($validated['permissions']);
        $user->load(['role.permissions', 'permissions']);

        $formatted = $this->formatUserResponse($user);

        return response()->json([
            'success' => true,
            'message' => 'User permissions synchronized successfully.',
            'all_permissions' => $formatted['all_permissions'],
            'direct_permissions' => $formatted['direct_permissions'],
            'user' => $formatted,
        ]);
    }

    /**
     * Remove the specified user.
     */
    public function destroy(Request $request, $id): JsonResponse
    {
        $authUser = $request->user() ?? auth('sanctum')->user();
        if ($authUser) {
            $canDelete = in_array($authUser->role?->name, ['super_admin', 'admin']) 
                || (method_exists($authUser, 'hasPermissionTo') && $authUser->hasPermissionTo('manage_users'));
            if (!$canDelete) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized: You do not have permission to delete staff accounts.',
                ], 403);
            }
        }

        $user = User::findOrFail($id);

        // Safeguard: do not allow deleting the last admin
        if ($user->role?->name === 'admin' && User::whereHas('role', fn($r) => $r->where('name', 'admin'))->count() <= 1) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete the primary system administrator account.',
            ], 422);
        }

        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'User account deleted successfully.',
        ]);
    }
}
