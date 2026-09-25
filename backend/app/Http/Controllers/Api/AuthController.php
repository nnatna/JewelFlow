<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Format user response with permissions and roles.
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
     * Handle user login.
     */
    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        $user = User::with(['role.permissions', 'permissions'])
            ->where('email', $validated['email'])
            ->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid email credentials or incorrect password.',
                'errors' => [
                    'email' => ['The provided credentials do not match our records.']
                ]
            ], 422);
        }

        if ($user->status !== 'active') {
            return response()->json([
                'success' => false,
                'message' => 'Your staff account has been deactivated. Please contact your administrator.',
            ], 403);
        }

        // Generate Sanctum plain text token
        $token = $user->createToken('jewelflow_auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Signed in successfully to JewelFlow Atelier ERP.',
            'user' => $this->formatUserResponse($user),
            'token' => $token,
        ]);
    }

    /**
     * Return authenticated user details.
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.'
            ], 401);
        }

        $user->load(['role.permissions', 'permissions']);

        return response()->json([
            'success' => true,
            'user' => $this->formatUserResponse($user),
        ]);
    }

    /**
     * Handle user logout.
     */
    public function logout(Request $request): JsonResponse
    {
        if ($request->user()) {
            $request->user()->currentAccessToken()?->delete();
        }

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully.',
        ]);
    }
}
