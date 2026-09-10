<?php

namespace Database\Seeders;

use App\Models\Gemstone;
use Illuminate\Database\Seeder;

class GemstoneSeeder extends Seeder
{
    public function run(): void
    {
        Gemstone::factory()->count(20)->create();
    }
}
