<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SaleItem>
 */
class SaleItemFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $quantity = fake()->numberBetween(1, 3);
        $unitPrice = fake()->randomFloat(2, 100, 2000);
        $subtotal = $unitPrice * $quantity;

        return [
            'sale_id' => Sale::inRandomOrder()->value('id') ?? Sale::factory(),
            'product_id' => Product::inRandomOrder()->value('id') ?? Product::factory(),
            'gold_rate_applied' => fake()->randomFloat(2, 60, 95),
            'weight_sold' => fake()->randomFloat(2, 1, 15),
            'labor_fee' => fake()->randomFloat(2, 10, 60),
            'gemstone_price' => fake()->randomFloat(2, 0, 300),
            'unit_price' => $unitPrice,
            'quantity' => $quantity,
            'subtotal' => $subtotal,
            'status' => fake()->randomElement(['pending', 'completed', 'cancelled']),
        ];
    }
}
