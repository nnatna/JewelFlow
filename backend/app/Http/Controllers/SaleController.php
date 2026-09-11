<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Product;
use App\Models\Sale;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SaleController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $search = $request->input('search');
        $sort = $request->input('sort', 'sale_date');
        $direction = $request->input('direction', 'desc');

        $sales = Sale::with(['customer', 'user', 'saleItems'])
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->whereHas('customer', function ($sub) use ($search) {
                        $sub->where('name', 'like', "%{$search}%")
                            ->orWhere('phone', 'like', "%{$search}%");
                    })->orWhereHas('user', function ($sub) use ($search) {
                        $sub->where('name', 'like', "%{$search}%");
                    })->orWhere('invoice_no', 'like', "%{$search}%")
                        ->orWhere('total_amount', 'like', "%{$search}%")
                        ->orWhere('grand_total', 'like', "%{$search}%");
                });
            })
            ->orderBy($sort, $direction)
            ->paginate(10);

        return view('sales.index', compact('sales'));
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $customers = Customer::all();
        $users = User::all();
        $products = Product::where('stock_qty', '>', 0)->get();

        return view('sales.create', compact('customers', 'users', 'products'));
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'customer_id' => 'nullable|exists:customers,id',
            'user_id' => 'nullable|exists:users,id',
            'invoice_no' => 'required|string|max:255|unique:sales,invoice_no',
            'total_amount' => 'nullable|numeric|min:0',
            'discount' => 'nullable|numeric|min:0',
            'tax' => 'nullable|numeric|min:0',
            'grand_total' => 'nullable|numeric|min:0',
            'sale_date' => 'required|date',
            // Nested items validation
            'items' => 'nullable|array',
            'items.*.product_id' => 'required_with:items|exists:products,id',
            'items.*.gold_rate_applied' => 'required_with:items|numeric|min:0',
            'items.*.weight_sold' => 'required_with:items|numeric|min:0',
            'items.*.labor_fee' => 'nullable|numeric|min:0',
            'items.*.gemstone_price' => 'nullable|numeric|min:0',
            'items.*.quantity' => 'required_with:items|integer|min:1',
        ]);

        $discount = $validated['discount'] ?? 0;
        $tax = $validated['tax'] ?? 0;
        $totalAmount = $validated['total_amount'] ?? 0;

        $sale = Sale::create([
            'customer_id' => $validated['customer_id'] ?? null,
            'user_id' => Auth::id() ?? ($validated['user_id'] ?? 1),
            'invoice_no' => 'INV-' . date('mdY') . '-' . mt_rand(1000, 9999),
            'total_amount' => $totalAmount,
            'discount' => $discount,
            'tax' => $tax,
            'grand_total' => $totalAmount - $discount + $tax,
            'sale_date' => $validated['sale_date'],
        ]);

        // ២. បញ្ចូល Items និងកាត់ស្តុកតាម Model (បើមាន Items)
        if (!empty($validated['items'])) {
            $calculatedTotal = 0;

            foreach ($validated['items'] as $item) {
                $labor = $item['labor_fee'] ?? 0;
                $gemPrice = $item['gemstone_price'] ?? 0;
                $unitPrice = ($item['gold_rate_applied'] * $item['weight_sold']) + $labor + $gemPrice;
                $subtotal = $unitPrice * $item['quantity'];
                $calculatedTotal += $subtotal;

                // បង្កើត SaleItem តាមរយៈ Relation នៃ Sale Model
                $sale->saleItems()->create([
                    'product_id' => $item['product_id'],
                    'gold_rate_applied' => $item['gold_rate_applied'],
                    'weight_sold' => $item['weight_sold'],
                    'labor_fee' => $labor,
                    'gemstone_price' => $gemPrice,
                    'unit_price' => $unitPrice,
                    'quantity' => $item['quantity'],
                    'subtotal' => $subtotal,
                ]);

                // កាត់ស្តុកតាមរយៈ Product Model
                Product::where('id', $item['product_id'])->decrement('stock_qty', $item['quantity']);
            }

            // Update តម្លៃសរុបឡើងវិញ
            $sale->update([
                'total_amount' => $calculatedTotal,
                'grand_total' => $calculatedTotal - $discount + $tax,
            ]);
        }

        return redirect()->route('sales.index')->with('success', 'Sale created successfully');
    }

    /**
     * Display the specified resource.
     */
    public function show(Sale $sale)
    {
        $sale->load(['customer', 'user', 'saleItems.product', 'payments']);
        return view('sales.show', compact('sale'));
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Sale $sale)
    {
        $sale->load('saleItems.product');
        $customers = Customer::all();
        $users = User::all();
        $products = Product::all();

        return view('sales.edit', compact('sale', 'customers', 'users', 'products'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Sale $sale)
    {
        $validated = $request->validate([
            'customer_id' => 'nullable|exists:customers,id',
            'user_id' => 'nullable|exists:users,id',
            'invoice_no' => 'required|string|max:255|unique:sales,invoice_no,' . $sale->id,
            'total_amount' => 'nullable|numeric|min:0',
            'discount' => 'nullable|numeric|min:0',
            'tax' => 'nullable|numeric|min:0',
            'grand_total' => 'nullable|numeric|min:0',
            'sale_date' => 'required|date',
        ]);

        $discount = $validated['discount'] ?? $sale->discount;
        $tax = $validated['tax'] ?? $sale->tax;
        $totalAmount = $validated['total_amount'] ?? $sale->total_amount;
        $grandTotal = $totalAmount - $discount + $tax;

        $sale->update([
            'customer_id' => $validated['customer_id'] ?? $sale->customer_id,
            'user_id' => $validated['user_id'] ?? $sale->user_id,
            'invoice_no' => $validated['invoice_no'],
            'total_amount' => $totalAmount,
            'discount' => $discount,
            'tax' => $tax,
            'grand_total' => $grandTotal,
            'sale_date' => $validated['sale_date'],
        ]);

        return redirect()->route('sales.index')->with('success', 'Sale updated successfully');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Sale $sale)
    {
        // Restore product stock for each sold item before deleting
        foreach ($sale->saleItems as $item) {
            Product::where('id', $item->product_id)->increment('stock_qty', $item->quantity);
        }

        $sale->delete();

        return redirect()->route('sales.index')->with('success', 'Sale deleted successfully');
    }
}
