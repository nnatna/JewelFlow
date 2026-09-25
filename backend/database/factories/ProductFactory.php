<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\Material;
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
        $adjectives = ['Royal', 'Imperial', 'Eternal', 'Sovereign', 'Heritage', 'Celestial', 'Majestic', 'Grand', 'Atelier', 'Crown'];
        $jewelryTypes = [
            'Solitaire Diamond Ring',
            '24K Solid Gold Chain',
            'Diamond Tennis Bracelet',
            'Emerald Cut Pendant',
            'Ruby Drop Earrings',
            'Handcrafted Gold Bangle',
            'Sapphire Halo Ring',
            'Bespoke Bridal Choker',
            'Swiss 1 Damlung Minted Bar',
            'Diamond Huggie Earrings'
        ];

        $name = fake()->randomElement($adjectives) . ' ' . fake()->randomElement($jewelryTypes) . ' #' . fake()->unique()->numberBetween(100, 999);
        $chi = fake()->randomElement([0.5, 1.0, 1.25, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0, 6.0, 8.0, 10.0]);
        $netWeight = round($chi * 3.75, 3);
        $grossWeight = round($netWeight + fake()->randomFloat(3, 0.05, 0.25), 3);
        $material = Material::inRandomOrder()->first();

        return [
            'category_id' => Category::inRandomOrder()->value('id') ?? Category::factory(),
            'material_id' => $material?->id ?? Material::factory(),
            'code_sku' => fake()->unique()->bothify('JWL-????-#####'),
            'barcode' => fake()->unique()->numerify('884###########'),
            'name' => $name,
            'net_weight' => $netWeight,
            'gross_weight' => $grossWeight,
            'labor_cost' => fake()->randomFloat(2, 15, 120),
            'markup_rate' => fake()->randomFloat(2, 5, 20),
            'stock_qty' => fake()->numberBetween(1, 40),
            'status' => fake()->randomElement(['active', 'active', 'active', 'inactive']),
        ];
    }
}
