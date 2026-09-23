<?php

namespace Database\Seeders;

use App\Models\MadeProduct;
use Illuminate\Database\Seeder;

class MadeProductSeeder extends Seeder
{
    public function run(): void
    {
        MadeProduct::factory()->count(20)->create();
    }
}
