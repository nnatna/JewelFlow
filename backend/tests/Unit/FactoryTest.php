<?php

use App\Models\Buyback;
use App\Models\Category;
use App\Models\Customer;
use App\Models\GoldRate;
use App\Models\MadeProduct;
use App\Models\Material;
use App\Models\MetalType;
use App\Models\Payment;
use App\Models\Product;
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
        Material::class,
        Supplier::class,
        Customer::class,
        Product::class,
        MadeProduct::class,
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

test('database seeder successfully populates initial records', function () {
    $this->seed(DatabaseSeeder::class);

    expect(Role::count())->toBeGreaterThanOrEqual(1)
        ->and(User::count())->toBeGreaterThanOrEqual(1)
        ->and(MetalType::count())->toBeGreaterThanOrEqual(1)
        ->and(Category::count())->toBeGreaterThanOrEqual(1)
        ->and(Customer::count())->toBeGreaterThanOrEqual(1)
        ->and(Product::count())->toBeGreaterThanOrEqual(1);
});
