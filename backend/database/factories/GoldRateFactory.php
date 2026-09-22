<?php

namespace Database\Factories;

use App\Models\GoldRate;
use App\Models\MetalType;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<GoldRate>
 */
class GoldRateFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $buyRate = fake()->randomFloat(2, 60, 90);

        return [
            'metal_type_id' => MetalType::inRandomOrder()->value('id') ?? 1,
            'buy_rate' => $buyRate,
            'sell_rate' => $buyRate + fake()->randomFloat(2, 2, 10),
            'effective_date' => fake()->date(),
            'created_by' => User::inRandomOrder()->value('id') ?? 1,
        ];
    }
}
