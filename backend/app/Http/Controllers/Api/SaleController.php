<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Tier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class SaleController extends Controller
{
    /**
     * Resolve customer tier based on lifetime USD spend.
     */
    protected function resolveCustomerTier(float $totalSpent): array
    {
        $tier = Tier::query()
            ->where('is_active', true)
            ->where('min_spending', '<=', $totalSpent)
            ->orderByDesc('min_spending')
            ->first();

        if ($tier) {
            return ['tier' => $tier->name, 'discount_rate' => (float) $tier->discount_rate];
        }

        return ['tier' => 'Standard', 'discount_rate' => 0.00];
    }

    /**
     * Display a listing of sales.
     */
    public function index(Request $request): JsonResponse
    {
        $search = $request->query('search');
        $status = $request->query('status');
        $customerId = $request->query('customer_id');
        $sort = $request->query('sort', 'sale_date');
        $direction = strtolower($request->query('direction', 'desc')) === 'asc' ? 'asc' : 'desc';

        $query = Sale::with(['customer', 'saleItems.product.metalType', 'user', 'payments'])
            ->when($search, function ($q, $search) {
                $q->where(function ($sub) use ($search) {
                    $sub->where('invoice_no', 'like', "%{$search}%")
                        ->orWhereHas('customer', function ($c) use ($search) {
                            $c->where('name', 'like', "%{$search}%")
                              ->orWhere('phone', 'like', "%{$search}%");
                        });
                });
            })
            ->when($status, function ($q, $status) {
                $q->where('status', $status);
            })
            ->when($customerId, function ($q, $customerId) {
                $q->where('customer_id', $customerId);
            })
            ->orderBy($sort, $direction)
            ->orderBy('id', 'desc');

        if ($request->has('page') || $request->query('paginate')) {
            $perPage = (int) $request->query('per_page', 10);
            return response()->json($query->paginate($perPage));
        }

        return response()->json($query->get());
    }

    /**
     * Store a newly created sale with nested items and payment.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'invoice_no' => 'required|string|max:255|unique:sales,invoice_no',
            'customer_id' => 'nullable|exists:customers,id',
            'user_id' => 'nullable|exists:users,id',
            'total_amount' => 'required|numeric|min:0',
            'discount' => 'nullable|numeric|min:0',
            'tax' => 'nullable|numeric|min:0',
            'grand_total' => 'nullable|numeric|min:0',
            'grand_total_usd' => 'nullable|numeric|min:0',
            'grand_total_khr' => 'nullable|numeric|min:0',
            'sale_date' => 'required|date',
            'status' => 'nullable|string|in:completed,pending,cancelled',
            'items' => 'nullable|array',
            'items.*.product_id' => 'nullable|exists:products,id',
            'items.*.quantity' => 'nullable|integer|min:1',
            'items.*.qty' => 'nullable|integer|min:1',
            'items.*.weight_sold' => 'nullable|numeric|min:0',
            'items.*.weight_g' => 'nullable|numeric|min:0',
            'items.*.gold_rate_applied' => 'nullable|numeric|min:0',
            'items.*.metal_rate' => 'nullable|numeric|min:0',
            'items.*.labor_fee' => 'nullable|numeric|min:0',
            'items.*.gemstone_price' => 'nullable|numeric|min:0',
            'items.*.unit_price' => 'nullable|numeric|min:0',
            'items.*.subtotal' => 'nullable|numeric|min:0',
            'items.*.total' => 'nullable|numeric|min:0',
            'items.*.status' => 'nullable|string|in:completed,pending,cancelled',
            'payment_method' => 'nullable|string',
            'payment_status' => 'nullable|string',
            'payment_amount' => 'nullable|numeric|min:0',
            'currency' => 'nullable|string|in:USD,KHR',
            'payment_ref' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        $sale = DB::transaction(function () use ($request, $validated) {
            $validated['user_id'] = $request->user_id ?? (Auth::id() ?? 1);

            $usd = $request->grand_total_usd ?? $request->grand_total ?? ($request->total_amount - ($request->discount ?? 0) + ($request->tax ?? 0));
            $khr = $request->grand_total_khr ?? round($usd * 4100, 2);

            $validated['grand_total_usd'] = $usd;
            $validated['grand_total_khr'] = $khr;

            if ($request->filled('status')) {
                $validated['status'] = $request->status;
            }

            $sale = Sale::create($validated);

            // Create items & deduct stock
            if ($request->has('items') && is_array($request->items)) {
                foreach ($request->items as $item) {
                    $productId = $item['product_id'] ?? null;
                    $qty = (int) ($item['quantity'] ?? $item['qty'] ?? 1);
                    $weightSold = (float) ($item['weight_sold'] ?? $item['weight_g'] ?? 0);
                    $goldRate = (float) ($item['gold_rate_applied'] ?? $item['metal_rate'] ?? 0);
                    $labor = (float) ($item['labor_fee'] ?? 0);
                    $gemPrice = (float) ($item['gemstone_price'] ?? 0);
                    $unitPrice = (float) ($item['unit_price'] ?? 0);
                    $subtotal = (float) ($item['subtotal'] ?? $item['total'] ?? ($unitPrice * $qty));
                    $itemStatus = $item['status'] ?? ($sale->status ?? 'completed');

                    $sale->saleItems()->create([
                        'product_id' => $productId ?? 1,
                        'quantity' => $qty,
                        'weight_sold' => $weightSold,
                        'gold_rate_applied' => $goldRate,
                        'labor_fee' => $labor,
                        'gemstone_price' => $gemPrice,
                        'unit_price' => $unitPrice,
                        'subtotal' => $subtotal,
                        'status' => $itemStatus,
                    ]);

                    if ($productId) {
                        $prod = Product::find($productId);
                        if ($prod) {
                            if ($itemStatus === 'completed' && ($sale->status ?? 'completed') === 'completed') {
                                $newStock = max(0, $prod->stock_qty - $qty);
                                $prod->update([
                                    'stock_qty' => $newStock,
                                    'status' => $newStock <= 0 ? 'out_of_stock' : $prod->status,
                                ]);
                            } elseif ($prod->stock_qty <= 0) {
                                $prod->update(['status' => 'out_of_stock']);
                            }
                        }
                    }
                }
            }

            // Record Payment
            $paymentMethod = $request->payment_method ?? 'cash';
            $currency = strtoupper($request->currency ?? 'USD');
            if (!in_array($currency, ['USD', 'KHR'])) {
                $currency = 'USD';
            }

            $paymentStatus = strtolower($request->payment_status ?? 'paid');
            if (!in_array($paymentStatus, ['paid', 'pending', 'partial', 'refunded'])) {
                $paymentStatus = 'paid';
            }

            if ($request->has('payment_amount') && $request->payment_amount !== null) {
                $paymentAmount = (float) $request->payment_amount;
            } else {
                $paymentAmount = ($paymentStatus === 'pending')
                    ? 0
                    : ($currency === 'KHR' ? $sale->grand_total_khr : $sale->grand_total_usd);
            }

            // Set overall status
            if ($request->filled('status')) {
                $sale->update(['status' => $request->status]);
            } elseif ($paymentStatus === 'partial' || $paymentStatus === 'pending') {
                $sale->update(['status' => 'pending']);
            } else {
                $hasPendingItem = $sale->saleItems()->where('status', 'pending')->exists();
                if ($hasPendingItem) {
                    $sale->update(['status' => 'pending']);
                } elseif ($paymentStatus === 'paid') {
                    $sale->update(['status' => 'completed']);
                }
            }

            $sale->payments()->create([
                'amount' => $paymentAmount,
                'payment_method' => $paymentMethod,
                'currency' => $currency,
                'payment_date' => $sale->sale_date,
                'reference_no' => $request->payment_ref ?? ('PAY-' . rand(10000, 99999)),
                'status' => $paymentStatus,
            ]);

            // Auto-recalculate Customer VIP Tier & total spent
            if ($sale->customer_id) {
                $customer = Customer::find($sale->customer_id);
                if ($customer) {
                    $totalSpent = (float) Sale::where('customer_id', $sale->customer_id)
                        ->where('status', 'completed')
                        ->sum('grand_total_usd');

                    $tierData = $this->resolveCustomerTier($totalSpent);

                    $customer->update([
                        'total_spent' => $totalSpent,
                        'tier' => $tierData['tier'],
                        'discount_rate' => $tierData['discount_rate'],
                    ]);
                }
            }

            return $sale;
        });

        return response()->json(
            $sale->load(['customer', 'saleItems.product.metalType', 'user', 'payments']),
            201
        );
    }

    /**
     * Display the specified sale.
     */
    public function show($id): JsonResponse
    {
        $sale = Sale::with(['customer', 'saleItems.product.metalType', 'user', 'payments'])->findOrFail($id);

        return response()->json($sale);
    }

    /**
     * Update the specified sale.
     */
    public function update(Request $request, $id): JsonResponse
    {
        $sale = Sale::with('saleItems')->findOrFail($id);

        $status = $request->input('status') ?? $request->json('status');
        if ($status && in_array($status, ['pending', 'completed', 'cancelled'])) {
            $oldStatus = $sale->status;
            $newStatus = $status;

            $sale->update(['status' => $newStatus]);
            $sale->saleItems()->update(['status' => $newStatus]);

            // Manage product stock on status change
            if ($newStatus === 'completed' && $oldStatus !== 'completed') {
                foreach ($sale->saleItems as $item) {
                    if ($item->product_id) {
                        $prod = Product::find($item->product_id);
                        if ($prod) {
                            $newStock = max(0, $prod->stock_qty - ($item->quantity ?? 1));
                            $prod->update([
                                'stock_qty' => $newStock,
                                'status' => $newStock <= 0 ? 'out_of_stock' : $prod->status,
                            ]);
                        }
                    }
                }
            } elseif ($oldStatus === 'completed' && $newStatus !== 'completed') {
                foreach ($sale->saleItems as $item) {
                    if ($item->product_id) {
                        Product::where('id', $item->product_id)->increment('stock_qty', $item->quantity ?? 1);
                    }
                }
            }

            // Re-sync customer spent/tier if status changed
            if ($sale->customer_id) {
                $customer = Customer::find($sale->customer_id);
                if ($customer) {
                    $totalSpent = (float) Sale::where('customer_id', $sale->customer_id)
                        ->where('status', 'completed')
                        ->sum('grand_total_usd');

                    $tierData = $this->resolveCustomerTier($totalSpent);

                    $customer->update([
                        'total_spent' => $totalSpent,
                        'tier' => $tierData['tier'],
                        'discount_rate' => $tierData['discount_rate'],
                    ]);
                }
            }
        }

        return response()->json($sale->load(['customer', 'saleItems.product.metalType', 'user', 'payments']));
    }

    /**
     * Update only the sale status (and cascade to its items).
     */
    public function updateStatus(Request $request, $id): JsonResponse
    {
        $status = $request->input('status') ?? $request->json('status');
        if (!in_array($status, ['pending', 'completed', 'cancelled'])) {
            return response()->json(['message' => 'Invalid status. Must be pending, completed, or cancelled.'], 422);
        }

        $sale = Sale::with('saleItems')->findOrFail($id);
        $oldStatus = $sale->status;
        $newStatus = $status;

        $sale->update(['status' => $newStatus]);
        $sale->saleItems()->update(['status' => $newStatus]);

        // Manage product stock on status change
        if ($newStatus === 'completed' && $oldStatus !== 'completed') {
            foreach ($sale->saleItems as $item) {
                if ($item->product_id) {
                    $prod = Product::find($item->product_id);
                    if ($prod) {
                        $newStock = max(0, $prod->stock_qty - ($item->quantity ?? 1));
                        $prod->update([
                            'stock_qty' => $newStock,
                            'status' => $newStock <= 0 ? 'out_of_stock' : $prod->status,
                        ]);
                    }
                }
            }
        } elseif ($oldStatus === 'completed' && $newStatus !== 'completed') {
            foreach ($sale->saleItems as $item) {
                if ($item->product_id) {
                    Product::where('id', $item->product_id)->increment('stock_qty', $item->quantity ?? 1);
                }
            }
        }

        if ($sale->customer_id) {
            $customer = Customer::find($sale->customer_id);
            if ($customer) {
                $totalSpent = (float) Sale::where('customer_id', $sale->customer_id)
                    ->where('status', 'completed')
                    ->sum('grand_total_usd');

                $tierData = $this->resolveCustomerTier($totalSpent);

                $customer->update([
                    'total_spent' => $totalSpent,
                    'tier' => $tierData['tier'],
                    'discount_rate' => $tierData['discount_rate'],
                ]);
            }
        }

        return response()->json($sale->load(['customer', 'saleItems.product.metalType', 'user', 'payments']));
    }

    /**
     * Remove the specified sale (and restore product stock).
     */
    public function destroy($id): JsonResponse
    {
        $sale = Sale::with('saleItems')->findOrFail($id);

        DB::transaction(function () use ($sale) {
            foreach ($sale->saleItems as $item) {
                Product::where('id', $item->product_id)->increment('stock_qty', $item->quantity);
            }
            $customerId = $sale->customer_id;
            $sale->delete();

            if ($customerId) {
                $customer = Customer::find($customerId);
                if ($customer) {
                    $totalSpent = (float) Sale::where('customer_id', $customerId)
                        ->where('status', 'completed')
                        ->sum('grand_total_usd');

                    $tierData = $this->resolveCustomerTier($totalSpent);

                    $customer->update([
                        'total_spent' => $totalSpent,
                        'tier' => $tierData['tier'],
                        'discount_rate' => $tierData['discount_rate'],
                    ]);
                }
            }
        });

        return response()->json([
            'success' => true,
            'message' => 'Sale deleted successfully and inventory restored.',
        ]);
    }
}
