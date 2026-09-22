<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Role;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RoleController extends Controller
{
    /**
     * Display a listing of roles with permissions and user counts.
     */
    public function index(Request $request): JsonResponse
    {
        $search = $request->query('search');
        $query = Role::with(['permissions', 'userAccounts'])
            ->withCount('userAccounts')
            ->when($search, function ($q, $search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            })
            ->latest();

        if ($request->has('page') || $request->query('paginate')) {
            $perPage = (int) $request->query('per_page', 10);
            return response()->json($query->paginate($perPage));
        }

        return response()->json($query->get());
    }

    /**
     * Store a newly created role.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:roles,name',
            'description' => 'nullable|string|max:255',
            'guard_name' => 'nullable|string',
            'permissions' => 'nullable|array',
            'permissions.*' => 'string|exists:permissions,name',
        ]);

        $role = Role::create([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'guard_name' => $validated['guard_name'] ?? 'web',
        ]);

        if (!empty($validated['permissions'])) {
            $role->syncPermissions($validated['permissions']);
        }

        return response()->json($role->load('permissions'), 201);
    }

    /**
     * Display the specified role.
     */
    public function show($id): JsonResponse
    {
        $role = Role::with(['permissions', 'userAccounts'])->findOrFail($id);

        return response()->json($role);
    }

    /**
     * Update the specified role.
     */
    public function update(Request $request, $id): JsonResponse
    {
        $role = Role::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255|unique:roles,name,' . $role->id,
            'description' => 'nullable|string|max:255',
            'permissions' => 'nullable|array',
            'permissions.*' => 'string|exists:permissions,name',
        ]);

        $role->update([
            'name' => $validated['name'] ?? $role->name,
            'description' => $validated['description'] ?? $role->description,
        ]);

        if (isset($validated['permissions'])) {
            $role->syncPermissions($validated['permissions']);
        }

        return response()->json($role->load('permissions'));
    }

    /**
     * Remove the specified role.
     */
    public function destroy($id): JsonResponse
    {
        $role = Role::findOrFail($id);

        // Safeguard default system roles
        if (in_array($role->name, ['admin', 'manager', 'cashier', 'goldsmith', 'accountant'])) {
            return response()->json([
                'success' => false,
                'message' => "Cannot delete standard system role '{$role->name}'.",
            ], 422);
        }

        $role->delete();

        return response()->json([
            'success' => true,
            'message' => 'Role deleted successfully.',
        ]);
    }
}
