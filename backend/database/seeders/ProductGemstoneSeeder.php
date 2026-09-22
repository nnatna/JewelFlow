<?php

namespace Database\Seeders;

use App\Models\ProductGemstone;
use Illuminate\Database\Seeder;

class ProductGemstoneSeeder extends Seeder
{
    public function run(): void
    {
        $products = \App\Models\Product::all();
        $gemstones = \App\Models\Gemstone::all();

        if ($products->isEmpty() || $gemstones->isEmpty()) {
            return;
        }

        foreach ($products->take(15) as $product) {
            ProductGemstone::create([
                'product_id' => $product->id,
                'gemstone_id' => $gemstones->random()->id,
                'quantity' => fake()->numberBetween(1, 4),
                'total_carat' => fake()->randomFloat(2, 0.2, 3.5),
                'setting_cost' => fake()->randomFloat(2, 10, 45),
            ]);
        }
    }
}
