<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\MetalType;
use App\Models\Product;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $categoryIds = Category::pluck('id')->toArray();
        $metalTypeIds = MetalType::pluck('id')->toArray();

        for ($i = 0; $i < 24; $i++) {
            Product::factory()->create([
                'category_id' => !empty($categoryIds) ? fake()->randomElement($categoryIds) : Category::factory(),
                'metal_type_id' => !empty($metalTypeIds) ? fake()->randomElement($metalTypeIds) : MetalType::factory(),
            ]);
        }
    }
}

