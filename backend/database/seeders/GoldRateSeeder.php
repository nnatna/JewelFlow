<?php

namespace Database\Seeders;

use App\Models\GoldRate;
use Illuminate\Database\Seeder;

class GoldRateSeeder extends Seeder
{
    public function run(): void
    {
        GoldRate::factory()->count(10)->create();
    }
}
