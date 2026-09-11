<?php

namespace Database\Seeders;

use App\Models\Buyback;
use Illuminate\Database\Seeder;

class BuybackSeeder extends Seeder
{
    public function run(): void
    {
        Buyback::factory()->count(10)->create();
    }
}
