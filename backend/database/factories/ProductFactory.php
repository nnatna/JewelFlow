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
        $netWeight = fake()->randomFloat(2, 2.0, 37.5);
        $grossWeight = $netWeight + fake()->randomFloat(2, 0.2, 1.5);

        return [
            'category_id' => Category::inRandomOrder()->value('id') ?? Category::factory(),
            'metal_type_id' => MetalType::inRandomOrder()->value('id') ?? MetalType::factory(),
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
