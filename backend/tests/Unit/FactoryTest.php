<?php

use App\Models\Buyback;
use App\Models\Category;
use App\Models\Customer;
use App\Models\Gemstone;
use App\Models\GoldRate;
use App\Models\MetalType;
use App\Models\Payment;
use App\Models\Product;
use App\Models\ProductGemstone;
use App\Models\Purchase;
use App\Models\Role;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Supplier;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

test('all model factories instantiate valid model instances', function () {
    $models = [
        Role::class,
        User::class,
        MetalType::class,
        GoldRate::class,
        Category::class,
        Gemstone::class,
        Supplier::class,
        Customer::class,
        Product::class,
        ProductGemstone::class,
        Purchase::class,
        Sale::class,
        SaleItem::class,
        Buyback::class,
        Payment::class,
    ];

    foreach ($models as $modelClass) {
        $instance = $modelClass::factory()->create();
        expect($instance)->toBeInstanceOf($modelClass)
            ->and($instance->exists)->toBeTrue();
    }
});

test('database seeder successfully runs all factories with count 20', function () {
    $this->seed(DatabaseSeeder::class);

    expect(Role::count())->toBeGreaterThanOrEqual(20)
        ->and(User::count())->toBeGreaterThanOrEqual(20)
        ->and(MetalType::count())->toBeGreaterThanOrEqual(20)
        ->and(GoldRate::count())->toBeGreaterThanOrEqual(20)
        ->and(Category::count())->toBeGreaterThanOrEqual(20)
        ->and(Gemstone::count())->toBeGreaterThanOrEqual(20)
        ->and(Supplier::count())->toBeGreaterThanOrEqual(20)
        ->and(Customer::count())->toBeGreaterThanOrEqual(20)
        ->and(Product::count())->toBeGreaterThanOrEqual(20)
        ->and(ProductGemstone::count())->toBeGreaterThanOrEqual(20)
        ->and(Purchase::count())->toBeGreaterThanOrEqual(20)
        ->and(Sale::count())->toBeGreaterThanOrEqual(20)
        ->and(SaleItem::count())->toBeGreaterThanOrEqual(20)
        ->and(Buyback::count())->toBeGreaterThanOrEqual(20)
        ->and(Payment::count())->toBeGreaterThanOrEqual(20);
});
