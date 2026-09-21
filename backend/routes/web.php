<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Primary routes for web application & health check.
| All core business endpoints are served via /api.
|
*/

Route::get('/', function () {
    return response()->json([
        'name' => 'JewelFlow Luxury Jewelry ERP Backend API',
        'status' => 'operational',
        'version' => '1.0.0',
        'api_docs' => '/api',
    ]);
});

Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'timestamp' => now()->toIso8601String(),
    ]);
});
