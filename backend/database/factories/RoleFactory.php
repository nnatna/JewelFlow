<?php

namespace Database\Factories;

use App\Models\Role;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Role>
 */
class RoleFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->unique()->jobTitle().' '.fake()->unique()->numberBetween(1, 9999),
            'permissions' => ['view', 'create', 'update'],
            'description' => fake()->sentence(),
        ];
    }
}
