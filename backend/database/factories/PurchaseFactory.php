<?php

namespace Database\Factories;

use App\Models\Purchase;
use App\Models\Supplier;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Purchase>
 */
class PurchaseFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'supplier_id' => Supplier::inRandomOrder()->value('id') ?? Supplier::factory(),
            'invoice_no' => fake()->unique()->bothify('PUR-#####'),
            'total_amount' => fake()->randomFloat(2, 500, 20000),
            'purchase_date' => fake()->date(),
            'status' => fake()->randomElement(['pending', 'completed', 'cancelled']),
        ];
    }
}
