<?php

namespace Database\Factories;

use App\Models\Gemstone;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Gemstone>
 */
class GemstoneFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->randomElement(['Diamond', 'Ruby', 'Blue Sapphire', 'Emerald', 'Tanzanite', 'Topaz', 'Amethyst']),
            'shape' => fake()->randomElement(['Round Brilliant', 'Princess', 'Oval', 'Cushion', 'Pear', 'Emerald']),
            'clarity' => fake()->randomElement(['FL', 'IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2']),
            'color' => fake()->randomElement(['D', 'E', 'F', 'G', 'H', 'Pigeon Blood Red', 'Royal Blue', 'Vivid Green']),
            'carat_weight' => fake()->randomFloat(2, 0.2, 5.0),
            'cost_price' => fake()->randomFloat(2, 100, 5000),
        ];
    }
}
