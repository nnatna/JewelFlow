<?php

namespace Database\Factories;

use App\Models\MadeProduct;
use App\Models\MetalType;
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

        $metalWeightUsed = fake()->randomFloat(3, 2, 40);
        $wasteWeight = round($metalWeightUsed * fake()->randomFloat(2, 0.01, 0.08), 3);

        return [
            'product_id' => Product::inRandomOrder()->value('id') ?? Product::factory(),
            'metal_type_id' => MetalType::inRandomOrder()->value('id') ?? MetalType::factory(),
            'supplier_id' => Supplier::inRandomOrder()->value('id'),
            'user_id' => User::inRandomOrder()->value('id'),
            'order_no' => fake()->unique()->bothify('MP-#####'),
            'quantity' => fake()->numberBetween(1, 10),
            'metal_weight_used' => $metalWeightUsed,
            'waste_weight' => $wasteWeight,
            'crafting_cost' => fake()->randomFloat(2, 20, 500),
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
