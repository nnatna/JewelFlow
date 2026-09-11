<?php

use App\Http\Controllers\Api\GoldPriceController;
use App\Http\Controllers\Api\PostController;
use App\Http\Controllers\ImageController;
use App\Http\Controllers\ProductController;
use App\Models\Buyback;
use App\Models\Category;
use App\Models\Customer;
use App\Models\Gemstone;
use App\Models\GoldRate;
use App\Models\MetalType;
use App\Models\Product;
use App\Models\Sale;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Posts
Route::get('/posts', [PostController::class, 'index']);
Route::post('/posts', [PostController::class, 'store']);
Route::get('/posts/{id}', [PostController::class, 'show']);
Route::put('/posts/{id}', [PostController::class, 'update']);
Route::delete('/posts/{id}', [PostController::class, 'destroy']);

// Images API
Route::get('/images', [ImageController::class, 'index']);
Route::post('/images', [ImageController::class, 'store']);
Route::get('/images/{id}', [ImageController::class, 'show']);
Route::put('/images/{id}', [ImageController::class, 'update']);
Route::delete('/images/{id}', [ImageController::class, 'destroy']);

// Products API
Route::get('/products', [ProductController::class, 'index']);
Route::post('/products', [ProductController::class, 'store']);
Route::get('/products/{id}', [ProductController::class, 'show']);
Route::put('/products/{id}', [ProductController::class, 'update']);
Route::delete('/products/{id}', [ProductController::class, 'destroy']);

// Gold Rates API
Route::get('/gold-rates', function (Request $request) {
    $query = GoldRate::with('metalType')->latest();
    if ($request->has('page') || $request->query('paginate')) {
        return response()->json($query->paginate(10));
    }
    return response()->json($query->get());
});

Route::put('/gold-rates/{id}', function (Request $request, $id) {
    $rate = GoldRate::findOrFail($id);
    $rate->update($request->only(['buy_rate', 'sell_rate', 'effective_date']));
    return response()->json($rate->load('metalType'));
});

// Categories API
Route::get('/categories', function () {
    return response()->json(Category::all());
});

// Metal Types API
Route::get('/metal-types', function (Request $request) {
    $search = $request->query('search');
    $query = MetalType::query()->when($search, function ($q, $search) {
        $q->where('name', 'like', "%{$search}%");
    })->latest();

    if ($request->has('page') || $request->query('paginate')) {
        return response()->json($query->paginate(10));
    }
    return response()->json($query->get());
});

// Gemstones API
Route::get('/gemstones', function () {
    return response()->json(Gemstone::all());
});

// Customers API
Route::get('/customers', function () {
    return response()->json(Customer::withCount('sales')->get());
});

Route::post('/customers', function (Request $request) {
    $validated = $request->validate([
        'name' => 'required|string|max:255',
        'phone' => 'required|string|max:50',
        'email' => 'nullable|email',
        'address' => 'nullable|string',
        'loyalty_points' => 'nullable|integer',
    ]);

    $customer = Customer::create($validated);
    return response()->json($customer, 201);
});

// Sales & Invoices API
Route::get('/sales', function () {
    return response()->json(
        Sale::with(['customer', 'saleItems.product.metalType', 'user', 'payments'])
            ->orderBy('sale_date', 'desc')
            ->orderBy('id', 'desc')
            ->get()
    );
});

Route::get('/sales/{id}', function ($id) {
    return response()->json(
        Sale::with(['customer', 'saleItems.product.metalType', 'user', 'payments'])->findOrFail($id)
    );
});

Route::post('/sales', function (Request $request) {
    $validated = $request->validate([
        'invoice_no' => 'required|string|unique:sales,invoice_no',
        'customer_id' => 'nullable|exists:customers,id',
        'total_amount' => 'required|numeric',
        'discount' => 'nullable|numeric',
        'tax' => 'nullable|numeric',
        'grand_total' => 'required|numeric',
        'sale_date' => 'required|date',
    ]);

    $validated['user_id'] = $request->user_id ?? 1;

    $sale = Sale::create($validated);

    if ($request->has('items') && is_array($request->items)) {
        foreach ($request->items as $item) {
            $sale->saleItems()->create([
                'product_id'        => $item['product_id'] ?? 1,
                'quantity'          => $item['quantity'] ?? $item['qty'] ?? 1,
                'weight_sold'       => $item['weight_sold'] ?? $item['weight_g'] ?? 0,
                'gold_rate_applied' => $item['gold_rate_applied'] ?? $item['metal_rate'] ?? 0,
                'labor_fee'         => $item['labor_fee'] ?? 0,
                'gemstone_price'    => $item['gemstone_price'] ?? 0,
                'unit_price'        => $item['unit_price'] ?? 0,
                'subtotal'          => $item['subtotal'] ?? $item['total'] ?? 0,
                'status'            => $item['status'] ?? 'completed',
            ]);
        }
    }

    // Record Payment
    $paymentMethod = $request->payment_method ?? 'cash';
    $sale->payments()->create([
        'amount' => $sale->grand_total,
        'payment_method' => $paymentMethod,
        'payment_date' => $sale->sale_date,
        'reference_no' => 'PAY-' . rand(10000, 99999),
    ]);

    return response()->json($sale->load(['customer', 'saleItems.product.metalType', 'user', 'payments']), 201);
});

Route::put('/sales/{id}/status', function (Request $request, $id) {
    $status = $request->input('status') ?? $request->json('status');
    if (!in_array($status, ['pending', 'completed', 'cancelled'])) {
        return response()->json(['message' => 'Invalid status. Must be pending, completed, or cancelled.'], 422);
    }

    $sale = Sale::findOrFail($id);
    $sale->update(['status' => $status]);
    $sale->saleItems()->update(['status' => $status]);

    return response()->json($sale->load(['customer', 'saleItems.product.metalType', 'user', 'payments']));
});

Route::put('/sales/{id}', function (Request $request, $id) {
    $sale = Sale::findOrFail($id);
    $status = $request->input('status') ?? $request->json('status');
    if ($status && in_array($status, ['pending', 'completed', 'cancelled'])) {
        $sale->update(['status' => $status]);
        $sale->saleItems()->update(['status' => $status]);
    }
    return response()->json($sale->load(['customer', 'saleItems.product.metalType', 'user', 'payments']));
});

Route::put('/sale-items/{id}/status', function (Request $request, $id) {
    $status = $request->input('status') ?? $request->json('status');
    if (!in_array($status, ['pending', 'completed', 'cancelled'])) {
        return response()->json(['message' => 'Invalid status. Must be pending, completed, or cancelled.'], 422);
    }

    $item = \App\Models\SaleItem::findOrFail($id);
    $item->update(['status' => $status]);

    $sale = $item->sale;
    $distinctStatuses = $sale->saleItems()->pluck('status')->unique();
    if ($distinctStatuses->count() === 1) {
        $sale->update(['status' => $distinctStatuses->first()]);
    } elseif ($distinctStatuses->contains('pending')) {
        $sale->update(['status' => 'pending']);
    }

    return response()->json($sale->load(['customer', 'saleItems.product.metalType', 'user', 'payments']));
});

// Buybacks API
Route::get('/buybacks', function () {
    return response()->json(
        Buyback::with(['customer', 'metalType'])->latest()->get()
    );
});

Route::post('/buybacks', function (Request $request) {
    $validated = $request->validate([
        'customer_id' => 'nullable|exists:customers,id',
        'metal_type_id' => 'required|exists:metal_types,id',
        'weight' => 'required|numeric',
        'buyback_rate' => 'required|numeric',
        'deduction_rate' => 'nullable|numeric',
        'labor_deduction' => 'nullable|numeric',
        'total_refund' => 'required|numeric',
        'buyback_date' => 'required|date',
    ]);

    $buyback = Buyback::create($validated);
    return response()->json($buyback->load(['customer', 'metalType']), 201);
});

// Suppliers API
Route::get('/suppliers', function () {
    return response()->json(Supplier::all());
});

// Live Gold Price & Conversion APIs (GoldPriceController)
Route::prefix('gold-price')->group(function () {
    Route::get('/spot', [GoldPriceController::class, 'getSpotPrice']);
    Route::get('/cambodia', [GoldPriceController::class, 'getCambodianGoldPrice']);
    Route::post('/convert', [GoldPriceController::class, 'convert']);
    Route::post('/valuation', [GoldPriceController::class, 'calculateValuation']);
    Route::get('/metadata', [GoldPriceController::class, 'getMetadata']);
    Route::get('/exchange-rate', [GoldPriceController::class, 'getExchangeRate']);
});

// Live FX & Currency Exchange Rate APIs (USD to KHR)
Route::get('/exchange-rate', [GoldPriceController::class, 'getExchangeRate']);
Route::get('/exchange-rate/usd-khr', [GoldPriceController::class, 'getUsdKhrRate']);

