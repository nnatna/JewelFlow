<?php

namespace Database\Factories;

use App\Models\MetalType;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<MetalType>
 */
class MetalTypeFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $metals = [
            ['Gold 24K', '99.9%', 'gram'],
            ['Gold 22K', '91.6%', 'gram'],
            ['Gold 18K', '75.0%', 'gram'],
            ['Gold 14K', '58.5%', 'gram'],
            ['White Gold 18K', '75.0%', 'gram'],
            ['Rose Gold 18K', '75.0%', 'gram'],
            ['Silver 925', '92.5%', 'gram'],
            ['Platinum 950', '95.0%', 'gram'],
        ];

        $metal = fake()->randomElement($metals);

        return [
            'name' => $metal[0].' '.fake()->unique()->numberBetween(1, 9999),
            'purity' => $metal[1],
            'unit' => $metal[2],
        ];
    }
}
