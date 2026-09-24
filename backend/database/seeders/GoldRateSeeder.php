<?php

namespace Database\Seeders;

use App\Models\GoldRate;
use App\Models\MetalType;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;

class GoldRateSeeder extends Seeder
{
    public function run(): void
    {
        $userId = User::value('id') ?? 1;

        $standardRates = [
            1 => ['buy' => 130.00, 'sell' => 137.00], // Gold 24K (99.9%) -> ~$513.75/chi
            2 => ['buy' => 119.00, 'sell' => 125.50], // Gold 22K (91.6%) -> ~$470.63/chi
            3 => ['buy' => 97.50,  'sell' => 102.80], // Gold 18K (75.0%) -> ~$385.50/chi
            4 => ['buy' => 98.00,  'sell' => 103.50], // White Gold 18K (75.0%) -> ~$388.13/chi
            5 => ['buy' => 97.80,  'sell' => 103.00], // Rose Gold 18K (75.0%) -> ~$386.25/chi
            6 => ['buy' => 76.00,  'sell' => 80.20],  // Gold 14K (58.5%) -> ~$300.75/chi
            7 => ['buy' => 33.50,  'sell' => 36.80],  // Platinum 950 (95.0%) -> ~$138.00/chi
            8 => ['buy' => 0.98,   'sell' => 1.15],   // Silver 925 (92.5%) -> ~$4.31/chi
        ];

        Schema::disableForeignKeyConstraints();
        GoldRate::truncate();

        foreach ($standardRates as $metalTypeId => $rate) {
            GoldRate::create([
                'metal_type_id' => $metalTypeId,
                'buy_rate' => $rate['buy'],
                'sell_rate' => $rate['sell'],
                'effective_date' => now()->toDateString(),
                'created_by' => $userId,
            ]);
        }

        Schema::enableForeignKeyConstraints();
    }
}

