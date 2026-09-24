<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SaleItemController extends Controller
{
    /**
     * Display a listing of sale items.
     */
    public function index(Request $request): JsonResponse
    {
        $saleId = $request->query('sale_id');
        $productId = $request->query('product_id');

        $query = SaleItem::with(['sale', 'product.metalType'])
            ->when($saleId, fn($q) => $q->where('sale_id', $saleId))
            ->when($productId, fn($q) => $q->where('product_id', $productId))
            ->latest();

        if ($request->has('page') || $request->query('paginate')) {
            $perPage = (int) $request->query('per_page', 10);
            return response()->json($query->paginate($perPage));
        }

        return response()->json($query->get());
    }

    /**
     * Store a newly created sale item.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'sale_id' => 'required|exists:sales,id',
            'product_id' => 'required|exists:products,id',
            'gold_rate_applied' => 'required|numeric|min:0',
            'weight_sold' => 'required|numeric|min:0',
            'labor_fee' => 'nullable|numeric|min:0',
            'gemstone_price' => 'nullable|numeric|min:0',
            'quantity' => 'required|integer|min:1',
            'status' => 'nullable|string|in:completed,pending,cancelled',
        ]);

        $item = DB::transaction(function () use ($validated) {
            $labor = $validated['labor_fee'] ?? 0;
            $gemPrice = $validated['gemstone_price'] ?? 0;
            $unitPrice = ($validated['gold_rate_applied'] * $validated['weight_sold']) + $labor + $gemPrice;
            $subtotal = $unitPrice * $validated['quantity'];

            $validated['labor_fee'] = $labor;
            $validated['gemstone_price'] = $gemPrice;
            $validated['unit_price'] = $unitPrice;
            $validated['subtotal'] = $subtotal;

            $saleItem = SaleItem::create($validated);
            Product::where('id', $validated['product_id'])->decrement('stock_qty', $validated['quantity']);

            // Sync parent sale
            $sale = Sale::find($validated['sale_id']);
            if ($sale) {
                $totalAmount = $sale->saleItems()->sum('subtotal');
                $grandTotalUsd = $totalAmount - ($sale->discount ?? 0) + ($sale->tax ?? 0);
                $sale->update([
                    'total_amount' => $totalAmount,
                    'grand_total_usd' => $grandTotalUsd,
                    'grand_total_khr' => round($grandTotalUsd * 4100, 2),
                ]);
            }

            return $saleItem;
        });

        return response()->json($item->load(['sale', 'product.metalType']), 201);
    }

    /**
     * Display the specified sale item.
     */
    public function show($id): JsonResponse
    {
        $saleItem = SaleItem::with(['sale', 'product.metalType'])->findOrFail($id);

        return response()->json($saleItem);
    }

    /**
     * Update the specified sale item.
     */
    public function update(Request $request, $id): JsonResponse
    {
        $saleItem = SaleItem::findOrFail($id);

        $validated = $request->validate([
            'sale_id' => 'sometimes|required|exists:sales,id',
            'product_id' => 'sometimes|required|exists:products,id',
            'gold_rate_applied' => 'sometimes|required|numeric|min:0',
            'weight_sold' => 'sometimes|required|numeric|min:0',
            'labor_fee' => 'nullable|numeric|min:0',
            'gemstone_price' => 'nullable|numeric|min:0',
            'quantity' => 'sometimes|required|integer|min:1',
            'status' => 'nullable|string|in:completed,pending,cancelled',
        ]);

        DB::transaction(function () use ($saleItem, $validated) {
            $goldRate = $validated['gold_rate_applied'] ?? $saleItem->gold_rate_applied;
            $weight = $validated['weight_sold'] ?? $saleItem->weight_sold;
            $labor = $validated['labor_fee'] ?? $saleItem->labor_fee;
            $gemPrice = $validated['gemstone_price'] ?? $saleItem->gemstone_price;
            $qty = $validated['quantity'] ?? $saleItem->quantity;

            $unitPrice = ($goldRate * $weight) + $labor + $gemPrice;
            $subtotal = $unitPrice * $qty;

            $validated['labor_fee'] = $labor;
            $validated['gemstone_price'] = $gemPrice;
            $validated['unit_price'] = $unitPrice;
            $validated['subtotal'] = $subtotal;

            if (isset($validated['quantity'])) {
                $qtyDiff = $validated['quantity'] - $saleItem->quantity;
                if ($qtyDiff > 0) {
                    Product::where('id', $saleItem->product_id)->decrement('stock_qty', $qtyDiff);
                } elseif ($qtyDiff < 0) {
                    Product::where('id', $saleItem->product_id)->increment('stock_qty', abs($qtyDiff));
                }
            }

            $saleItem->update($validated);

            // Sync parent sale
            $sale = Sale::find($saleItem->sale_id);
            if ($sale) {
                $totalAmount = $sale->saleItems()->sum('subtotal');
                $grandTotalUsd = $totalAmount - ($sale->discount ?? 0) + ($sale->tax ?? 0);
                $sale->update([
                    'total_amount' => $totalAmount,
                    'grand_total_usd' => $grandTotalUsd,
                    'grand_total_khr' => round($grandTotalUsd * 4100, 2),
                ]);
            }
        });

        return response()->json($saleItem->load(['sale', 'product.metalType']));
    }

    /**
     * Update sale item status and sync parent sale status.
     */
    public function updateStatus(Request $request, $id): JsonResponse
    {
        $status = $request->input('status') ?? $request->json('status');
        if (!in_array($status, ['pending', 'completed', 'cancelled'])) {
            return response()->json(['message' => 'Invalid status. Must be pending, completed, or cancelled.'], 422);
        }

        $item = SaleItem::findOrFail($id);
        $oldStatus = $item->status;
        $newStatus = $status;

        $item->update(['status' => $newStatus]);

        if ($newStatus === 'completed' && $oldStatus !== 'completed') {
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
        } elseif ($oldStatus === 'completed' && $newStatus !== 'completed') {
            if ($item->product_id) {
                Product::where('id', $item->product_id)->increment('stock_qty', $item->quantity ?? 1);
            }
        }

        $sale = $item->sale;
        if ($sale) {
            $distinctStatuses = $sale->saleItems()->pluck('status')->unique();
            if ($distinctStatuses->count() === 1) {
                $sale->update(['status' => $distinctStatuses->first()]);
            } elseif ($distinctStatuses->contains('pending')) {
                $sale->update(['status' => 'pending']);
            }
        }

        return response()->json($sale ? $sale->load(['customer', 'saleItems.product.metalType', 'user', 'payments']) : $item);
    }

    /**
     * Remove the specified sale item and restore stock.
     */
    public function destroy($id): JsonResponse
    {
        $saleItem = SaleItem::findOrFail($id);

        DB::transaction(function () use ($saleItem) {
            Product::where('id', $saleItem->product_id)->increment('stock_qty', $saleItem->quantity);

            $saleId = $saleItem->sale_id;
            $saleItem->delete();

            $sale = Sale::find($saleId);
            if ($sale) {
                $totalAmount = $sale->saleItems()->sum('subtotal');
                $grandTotalUsd = $totalAmount - ($sale->discount ?? 0) + ($sale->tax ?? 0);
                $sale->update([
                    'total_amount' => $totalAmount,
                    'grand_total_usd' => $grandTotalUsd,
                    'grand_total_khr' => round($grandTotalUsd * 4100, 2),
                ]);
            }
        });

        return response()->json([
            'success' => true,
            'message' => 'Sale item deleted successfully and stock restored.',
        ]);
    }
}
