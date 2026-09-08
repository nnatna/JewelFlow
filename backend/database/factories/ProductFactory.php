<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\MetalType;
use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Product>
 */
class ProductFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $netWeight = fake()->randomFloat(2, 2.0, 30.0);
        $grossWeight = $netWeight + fake()->randomFloat(2, 0.5, 3.0);

        return [
            'category_id' => Category::factory(),
            'metal_type_id' => MetalType::factory(),
            'code_sku' => fake()->unique()->bothify('SKU-####-????'),
            'barcode' => fake()->ean13(),
            'name' => fake()->words(3, true),
            'net_weight' => $netWeight,
            'gross_weight' => $grossWeight,
            'labor_cost' => fake()->randomFloat(2, 10, 100),
            'markup_rate' => fake()->randomFloat(2, 5, 25),
            'stock_qty' => fake()->numberBetween(0, 50),
            'status' => fake()->randomElement(['active', 'inactive', 'out_of_stock']),
        ];
    }
}
