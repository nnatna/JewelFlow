<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    /**
     * Display a listing of payments.
     */
    public function index(Request $request): JsonResponse
    {
        $search = $request->query('search');
        $sort = $request->query('sort', 'payment_date');
        $direction = strtolower($request->query('direction', 'desc')) === 'asc' ? 'asc' : 'desc';

        $query = Payment::with('payable')
            ->when($search, function ($q, $search) {
                $q->where('reference_no', 'like', "%{$search}%")
                  ->orWhere('payment_method', 'like', "%{$search}%");
            })
            ->orderBy($sort, $direction);

        if ($request->has('page') || $request->query('paginate')) {
            $perPage = (int) $request->query('per_page', 10);
            return response()->json($query->paginate($perPage));
        }

        return response()->json($query->get());
    }

    /**
     * Store a newly created payment.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'payable_type' => 'required|string|max:255',
            'payable_id' => 'required|integer',
            'amount' => 'required|numeric|min:0',
            'payment_method' => 'required|string|max:255',
            'currency' => 'nullable|string|in:USD,KHR',
            'payment_date' => 'required|date',
            'reference_no' => 'nullable|string|max:255',
            'status' => 'nullable|string|max:50',
        ]);

        $validated['currency'] = $validated['currency'] ?? 'USD';
        $validated['status'] = $validated['status'] ?? 'paid';
        $payment = Payment::create($validated);

        return response()->json($payment, 201);
    }

    /**
     * Display the specified payment.
     */
    public function show($id): JsonResponse
    {
        $payment = Payment::with('payable')->findOrFail($id);

        return response()->json($payment);
    }

    /**
     * Update the specified payment.
     */
    public function update(Request $request, $id): JsonResponse
    {
        $payment = Payment::findOrFail($id);

        $validated = $request->validate([
            'payable_type' => 'sometimes|required|string|max:255',
            'payable_id' => 'sometimes|required|integer',
            'amount' => 'sometimes|required|numeric|min:0',
            'payment_method' => 'sometimes|required|string|max:255',
            'currency' => 'nullable|string|in:USD,KHR',
            'payment_date' => 'sometimes|required|date',
            'reference_no' => 'nullable|string|max:255',
            'status' => 'nullable|string|max:50',
        ]);

        $payment->update($validated);

        return response()->json($payment);
    }

    /**
     * Remove the specified payment.
     */
    public function destroy($id): JsonResponse
    {
        $payment = Payment::findOrFail($id);
        $payment->delete();

        return response()->json([
            'success' => true,
            'message' => 'Payment deleted successfully.',
        ]);
    }
}
