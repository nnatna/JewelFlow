<?php

namespace Database\Factories;

use App\Models\MadeProduct;
use App\Models\Material;
use App\Models\Product;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<MadeProduct>
 */
class MadeProductFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $status = fake()->randomElement(['pending', 'in_progress', 'completed', 'cancelled']);
        $startedAt = fake()->dateTimeBetween('-3 months', 'now');
        $completedAt = in_array($status, ['completed', 'cancelled'], true)
            ? fake()->dateTimeBetween($startedAt, 'now')
            : null;

        $chi = fake()->randomElement([0.5, 1.0, 1.25, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0]);
        $metalWeightUsed = round($chi * 3.75, 3);
        $wasteWeight = round($metalWeightUsed * fake()->randomFloat(2, 0.01, 0.04), 3);

        return [
            'product_id' => Product::inRandomOrder()->value('id') ?? Product::factory(),
            'material_id' => Material::inRandomOrder()->value('id') ?? Material::factory(),
            'supplier_id' => Supplier::inRandomOrder()->value('id'),
            'user_id' => User::inRandomOrder()->value('id'),
            'order_no' => fake()->unique()->bothify('MP-#####'),
            'quantity' => fake()->numberBetween(1, 5),
            'metal_weight_used' => $metalWeightUsed,
            'waste_weight' => $wasteWeight,
            'crafting_cost' => fake()->randomFloat(2, 20, 250),
            'status' => $status,
            'started_at' => $startedAt,
            'completed_at' => $completedAt,
            'notes' => fake()->boolean(40) ? fake()->sentence() : null,
        ];
    }

    /**
     * Indicate that the crafting order is still pending.
     */
    public function pending(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'pending',
            'started_at' => null,
            'completed_at' => null,
        ]);
    }

    /**
     * Indicate that the crafting order has been completed.
     */
    public function completed(): static
    {
        return $this->state(function (array $attributes) {
            $startedAt = $attributes['started_at'] ?? fake()->dateTimeBetween('-3 months', '-1 week');

            return [
                'status' => 'completed',
                'started_at' => $startedAt,
                'completed_at' => fake()->dateTimeBetween($startedAt, 'now'),
            ];
        });
    }
}
