<?php

namespace Database\Factories;

use App\Models\Gemstone;
use App\Models\Product;
use App\Models\ProductGemstone;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ProductGemstone>
 */
class ProductGemstoneFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'product_id' => Product::inRandomOrder()->value('id') ?? Product::factory(),
            'gemstone_id' => Gemstone::inRandomOrder()->value('id') ?? Gemstone::factory(),
            'quantity' => fake()->numberBetween(1, 6),
            'total_carat' => fake()->randomFloat(2, 0.2, 4.0),
            'setting_cost' => fake()->randomFloat(2, 5, 50),
        ];
    }
}
