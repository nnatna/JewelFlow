<?php

namespace Database\Seeders;

use App\Models\MetalType;
use Illuminate\Database\Seeder;

class MetalTypeSeeder extends Seeder
{
    public function run(): void
    {
        MetalType::factory()->count(20)->create();
    }
}
