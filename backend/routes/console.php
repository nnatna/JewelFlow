<?php

use App\Http\Controllers\Api\GoldPriceController;
use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('gold:fetch', function () {
    $this->info('Requesting Live Gold API (every 5 minutes)...');
    $controller = app(GoldPriceController::class);
    $req = new Request(['symbol' => 'XAU', 'currency' => 'USD', 'force_fresh' => true]);
    $res = $controller->getSpotPrice($req);
    $data = $res->getData(true);
    $spot = $data['spot_price_per_oz'] ?? 'N/A';
    $this->info("Gold Spot Price / Oz: \${$spot} (Source: " . ($data['source'] ?? 'Live') . ")");
    $this->info('Successfully cached for 5 minutes.');
})->purpose('Request and cache live Gold API spot rates every 5 minutes');

Schedule::command('gold:fetch')->everyFiveMinutes();

