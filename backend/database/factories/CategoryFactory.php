<?php

namespace Database\Factories;

use App\Models\Category;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Category>
 */
class CategoryFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $jewelCategories = [
            'Rings & Solitaires',
            'Necklaces & Chains',
            'Bracelets & Bangles',
            'Earrings & Studs',
            'Pendants & Medallions',
            'Gold Bullion & Minted Bars',
            'Bespoke Bridal Sets',
            'Diamonds & Colored Gems',
            'Luxury Timepieces',
            'Anklets & Brooches',
        ];

        $baseName = fake()->randomElement($jewelCategories);
        $name = $baseName.' '.fake()->unique()->numberBetween(10, 9999);

        return [
            'name' => $name,
            'slug' => Str::slug($name),
            'description' => 'Certified fine jewelry collection crafted with hallmarked precious metals and gemstones.',
        ];
    }
}
