<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Material;
use App\Models\MetalType;
use App\Models\Product;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $categoryIds = Category::pluck('id')->toArray();
        $materials = Material::all();

        for ($i = 0; $i < 15; $i++) {
            $mat = $materials->isNotEmpty() ? $materials->random() : null;
            Product::factory()->create([
                'category_id' => !empty($categoryIds) ? fake()->randomElement($categoryIds) : Category::factory(),
                'material_id' => $mat?->id ?? Material::factory(),
            ]);
        }
    }
}

