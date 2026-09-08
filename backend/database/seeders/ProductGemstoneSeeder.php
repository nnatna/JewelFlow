<?php

namespace Database\Seeders;

use App\Models\ProductGemstone;
use Illuminate\Database\Seeder;

class ProductGemstoneSeeder extends Seeder
{
    public function run(): void
    {
        ProductGemstone::factory()->count(20)->create();
    }
}
