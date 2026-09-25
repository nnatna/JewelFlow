<?php

namespace Database\Factories;

use App\Models\Material;
use App\Models\MaterialCategory;
use App\Models\MetalType;
use App\Models\Unit;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Material>
 */
class MaterialFactory extends Factory
{
    protected $model = Material::class;

    public function definition(): array
    {
        $metalType = MetalType::inRandomOrder()->first() ?? MetalType::factory()->create();

        return [
            'material_category_id' => MaterialCategory::inRandomOrder()->value('id') ?? null,
            'metal_type_id' => $metalType->id,
            'unit_id' => Unit::inRandomOrder()->value('id') ?? null,
            'code' => fake()->unique()->bothify('MAT-####'),
            'name' => fake()->randomElement(['24K Gold Grain', '18K Yellow Gold Alloy', 'Platinum Ingot', '99.99 Pure Bullion Bar']),
            'notes' => fake()->sentence(),
            'stock_qty' => fake()->randomFloat(2, 50, 500),
            'cost_price' => fake()->randomFloat(2, 60, 95),
            'status' => 'in_stock',
        ];
    }
}
