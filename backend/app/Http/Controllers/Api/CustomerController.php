<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Tier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    /**
     * Display a listing of customers.
     */
    public function index(Request $request): JsonResponse
    {
        $search = $request->query('search');
        $sort = $request->query('sort', 'created_at');
        $direction = strtolower($request->query('direction', 'desc')) === 'asc' ? 'asc' : 'desc';

        $query = Customer::withCount('sales')
            ->when($search, function ($q, $search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            })
            ->orderBy($sort, $direction);

        if ($request->has('page') || $request->query('paginate')) {
            $perPage = (int) $request->query('per_page', 10);
            return response()->json($query->paginate($perPage));
        }

        return response()->json($query->get());
    }

    /**
     * Store a newly created customer.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:50',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string',
            'loyalty_points' => 'nullable|integer|min:0',
            'tier' => 'nullable|string|max:50',
            'discount_rate' => 'nullable|numeric|min:0|max:100',
        ]);

        $validated['total_spent'] = 0;
        $validated['tier'] = $validated['tier'] ?? 'Standard';
        $validated['discount_rate'] = $validated['discount_rate'] ?? 0.00;

        $customer = Customer::create($validated);

        return response()->json($customer, 201);
    }

    /**
     * Display the specified customer with sales history.
     */
    public function show($id): JsonResponse
    {
        $customer = Customer::with(['sales.saleItems.product', 'sales.payments'])->findOrFail($id);

        return response()->json($customer);
    }

    /**
     * Update the specified customer.
     */
    public function update(Request $request, $id): JsonResponse
    {
        $customer = Customer::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'phone' => 'sometimes|required|string|max:50',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string',
            'loyalty_points' => 'nullable|integer|min:0',
            'tier' => 'nullable|string|max:50',
            'discount_rate' => 'nullable|numeric|min:0|max:100',
        ]);

        $customer->update($validated);

        return response()->json($customer);
    }

    /**
     * Remove the specified customer.
     */
    public function destroy($id): JsonResponse
    {
        $customer = Customer::findOrFail($id);
        $customer->delete();

        return response()->json([
            'success' => true,
            'message' => 'Customer deleted successfully.',
        ]);
    }
}
