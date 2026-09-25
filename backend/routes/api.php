<?php

use App\Http\Controllers\Api\ActivityLogController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BuybackController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\GoldPriceController;
use App\Http\Controllers\Api\GoldRateController;
use App\Http\Controllers\Api\ImageController;
use App\Http\Controllers\Api\MadeProductController;
use App\Http\Controllers\Api\MaterialCategoryController;
use App\Http\Controllers\Api\MaterialController;
use App\Http\Controllers\Api\MetalTypeController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\PermissionController;
use App\Http\Controllers\Api\PostController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\PromotionController;
use App\Http\Controllers\Api\PurchaseController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\SaleController;
use App\Http\Controllers\Api\SaleItemController;
use App\Http\Controllers\Api\SettingController;
use App\Http\Controllers\Api\StoreController;
use App\Http\Controllers\Api\SupplierController;
use App\Http\Controllers\Api\TierController;
use App\Http\Controllers\Api\UnitController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application.
| All routes are configured with dedicated API Controllers under App\Http\Controllers\Api.
|
*/

// Authentication API
Route::post('/login', [AuthController::class, 'login']);
Route::post('/logout', [AuthController::class, 'logout']);
Route::get('/me', [AuthController::class, 'me'])->middleware('auth:sanctum');

// Authenticated User
Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// User Profile
Route::get('/profile', [ProfileController::class, 'show'])->middleware('auth:sanctum');
Route::put('/profile', [ProfileController::class, 'update'])->middleware('auth:sanctum');
Route::delete('/profile', [ProfileController::class, 'destroy'])->middleware('auth:sanctum');

// Posts API
Route::apiResource('posts', PostController::class);

// Images API
Route::apiResource('images', ImageController::class);

// Products API
Route::apiResource('products', ProductController::class);

// Made Products / Crafting Orders API
Route::put('/made-products/{id}/status', [MadeProductController::class, 'updateStatus']);
Route::apiResource('made-products', MadeProductController::class);

// Categories API
Route::apiResource('categories', CategoryController::class);

// Material Categories & Materials Inventory API
Route::apiResource('material-categories', MaterialCategoryController::class);
Route::apiResource('materials', MaterialController::class);

// Units API
Route::apiResource('units', UnitController::class);

// Metal Types API
Route::apiResource('metal-types', MetalTypeController::class);

// Gold Rates API
Route::apiResource('gold-rates', GoldRateController::class);

// Customers API
Route::apiResource('customers', CustomerController::class);

// Sales & POS API
Route::put('/sales/{id}/status', [SaleController::class, 'updateStatus']);
Route::apiResource('sales', SaleController::class);

// Sale Items API
Route::put('/sale-items/{id}/status', [SaleItemController::class, 'updateStatus']);
Route::apiResource('sale-items', SaleItemController::class);

// Buybacks API
Route::apiResource('buybacks', BuybackController::class);

// Suppliers API
Route::apiResource('suppliers', SupplierController::class);

// Purchases API
Route::put('/purchases/{id}/confirm-arrival', [PurchaseController::class, 'confirmArrival']);
Route::put('/purchases/{id}/cancel', [PurchaseController::class, 'cancelOrder']);
Route::apiResource('purchases', PurchaseController::class);

// Payments API
Route::apiResource('payments', PaymentController::class);

// VIP Membership Tiers API
Route::apiResource('tiers', TierController::class);

// Store Settings API
Route::get('/settings', [SettingController::class, 'index']);
Route::put('/settings', [SettingController::class, 'update']);

// Store Atelier & Branches Management API
Route::get('/stores/primary', [StoreController::class, 'primary']);
Route::post('/stores/{id}/logo', [StoreController::class, 'uploadLogo']);
Route::apiResource('stores', StoreController::class);

// Promotions & Discounts API
Route::get('/promotions/applicable', [PromotionController::class, 'applicable']);
Route::apiResource('promotions', PromotionController::class);

// Permissions API
Route::get('/permissions', [PermissionController::class, 'index']);

// Users Management API
Route::put('/users/{id}/status', [UserController::class, 'toggleStatus']);
Route::put('/users/{id}/permissions', [UserController::class, 'syncPermissions']);
Route::apiResource('users', UserController::class);

// Roles API
Route::apiResource('roles', RoleController::class);

// Activity & Audit Logs API
Route::get('/activity-logs/stats', [ActivityLogController::class, 'stats']);
Route::delete('/activity-logs/clear', [ActivityLogController::class, 'clear']);
Route::apiResource('activity-logs', ActivityLogController::class);

// Live Gold Spot Price & Conversion APIs (GoldPriceController)
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

// Reports & Analytics APIs (ReportController)
Route::prefix('reports')->group(function () {
    Route::get('/summary', [ReportController::class, 'getSummary']);
    Route::get('/sales', [ReportController::class, 'getSalesReport']);
    Route::get('/buybacks', [ReportController::class, 'getBuybackReport']);
    Route::get('/inventory', [ReportController::class, 'getInventoryReport']);
    Route::get('/cashflow', [ReportController::class, 'getCashFlowReport']);
    Route::get('/gold-rates-history', [ReportController::class, 'getGoldRateHistoryReport']);
});
