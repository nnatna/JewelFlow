<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use Illuminate\Http\Request;

class SaleItemController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $search = $request->input('search');
        $sort = $request->input('sort', 'created_at');
        $direction = $request->input('direction', 'desc');

        $saleItems = SaleItem::with(['sale', 'product'])
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->whereHas('product', function ($sub) use ($search) {
                        $sub->where('name', 'like', "%{$search}%")
                            ->orWhere('code_sku', 'like', "%{$search}%");
                    })->orWhereHas('sale', function ($sub) use ($search) {
                        $sub->where('invoice_no', 'like', "%{$search}%");
                    });
                });
            })
            ->orderBy($sort, $direction)
            ->paginate(10);

        return view('sale_items.index', compact('saleItems'));
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $sales = Sale::latest()->get();
        $products = Product::where('stock_qty', '>', 0)->get();

        return view('sale_items.create', compact('sales', 'products'));
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'sale_id'           => 'required|exists:sales,id',
            'product_id'        => 'required|exists:products,id',
            'gold_rate_applied' => 'required|numeric|min:0',
            'weight_sold'       => 'required|numeric|min:0',
            'labor_fee'         => 'nullable|numeric|min:0',
            'gemstone_price'    => 'nullable|numeric|min:0',
            'quantity'          => 'required|integer|min:1',
        ]);

        $labor = $validated['labor_fee'] ?? 0;
        $gemPrice = $validated['gemstone_price'] ?? 0;
        $unitPrice = ($validated['gold_rate_applied'] * $validated['weight_sold']) + $labor + $gemPrice;
        $subtotal = $unitPrice * $validated['quantity'];

        $validated['labor_fee'] = $labor;
        $validated['gemstone_price'] = $gemPrice;
        $validated['unit_price'] = $unitPrice;
        $validated['subtotal'] = $subtotal;

        // ១. បង្កើត SaleItem តាម Model
        SaleItem::create($validated);

        // ២. កាត់ស្តុកតាម Product Model
        Product::where('id', $validated['product_id'])->decrement('stock_qty', $validated['quantity']);

        // ៣. Update តម្លៃ Sale មេឡើងវិញ
        $sale = Sale::find($validated['sale_id']);
        if ($sale) {
            $totalAmount = $sale->saleItems()->sum('subtotal');
            $sale->update([
                'total_amount' => $totalAmount,
                'grand_total'  => $totalAmount - $sale->discount + $sale->tax,
            ]);
        }

        return redirect()->route('sale_items.index')->with('success', 'Sale item created successfully');
    }

    /**
     * Display the specified resource.
     */
    public function show(SaleItem $saleItem)
    {
        $saleItem->load(['sale', 'product']);
        return view('sale_items.show', compact('saleItem'));
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(SaleItem $saleItem)
    {
        $sales = Sale::all();
        $products = Product::all();

        return view('sale_items.edit', compact('saleItem', 'sales', 'products'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, SaleItem $saleItem)
    {
        $validated = $request->validate([
            'sale_id'           => 'required|exists:sales,id',
            'product_id'        => 'required|exists:products,id',
            'gold_rate_applied' => 'required|numeric|min:0',
            'weight_sold'       => 'required|numeric|min:0',
            'labor_fee'         => 'nullable|numeric|min:0',
            'gemstone_price'    => 'nullable|numeric|min:0',
            'quantity'          => 'required|integer|min:1',
        ]);

        $labor = $validated['labor_fee'] ?? 0;
        $gemPrice = $validated['gemstone_price'] ?? 0;
        $unitPrice = ($validated['gold_rate_applied'] * $validated['weight_sold']) + $labor + $gemPrice;
        $subtotal = $unitPrice * $validated['quantity'];

        $validated['labor_fee'] = $labor;
        $validated['gemstone_price'] = $gemPrice;
        $validated['unit_price'] = $unitPrice;
        $validated['subtotal'] = $subtotal;

        // ១. Adjust ស្តុកបើចំនួន quantity ផ្លាស់ប្ដូរ
        $qtyDiff = $validated['quantity'] - $saleItem->quantity;
        if ($qtyDiff > 0) {
            Product::where('id', $saleItem->product_id)->decrement('stock_qty', $qtyDiff);
        } elseif ($qtyDiff < 0) {
            Product::where('id', $saleItem->product_id)->increment('stock_qty', abs($qtyDiff));
        }

        // ២. Update SaleItem តាម Model
        $saleItem->update($validated);

        // ៣. Update តម្លៃ Sale មេឡើងវិញ
        $sale = Sale::find($validated['sale_id']);
        if ($sale) {
            $totalAmount = $sale->saleItems()->sum('subtotal');
            $sale->update([
                'total_amount' => $totalAmount,
                'grand_total'  => $totalAmount - $sale->discount + $sale->tax,
            ]);
        }

        return redirect()->route('sale_items.index')->with('success', 'Sale item updated successfully');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(SaleItem $saleItem)
    {
        // ១. បូកស្តុកត្រឡប់មកវិញ
        Product::where('id', $saleItem->product_id)->increment('stock_qty', $saleItem->quantity);

        $saleId = $saleItem->sale_id;
        $saleItem->delete();

        // ២. Update តម្លៃ Sale មេឡើងវិញ
        $sale = Sale::find($saleId);
        if ($sale) {
            $totalAmount = $sale->saleItems()->sum('subtotal');
            $sale->update([
                'total_amount' => $totalAmount,
                'grand_total'  => $totalAmount - $sale->discount + $sale->tax,
            ]);
        }

        return redirect()->route('sale_items.index')->with('success', 'Sale item deleted successfully');
    }
}
