<?php

namespace Database\Seeders;

use App\Models\MetalType;
use App\Models\Product;
use App\Models\Material;
use App\Models\MadeProduct;
use App\Models\GoldRate;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class MetalTypeSeeder extends Seeder
{
    public function run(): void
    {
        $metals = [
            1 => ['name' => 'Gold 24K (99.9%)', 'purity' => '99.9%', 'unit' => 'gram'],
            2 => ['name' => 'Gold 22K (91.6%)', 'purity' => '91.6%', 'unit' => 'gram'],
            3 => ['name' => 'Gold 18K (75.0%)', 'purity' => '75.0%', 'unit' => 'gram'],
            4 => ['name' => 'White Gold 18K (75.0%)', 'purity' => '75.0%', 'unit' => 'gram'],
            5 => ['name' => 'Rose Gold 18K (75.0%)', 'purity' => '75.0%', 'unit' => 'gram'],
            6 => ['name' => 'Gold 14K (58.5%)', 'purity' => '58.5%', 'unit' => 'gram'],
            7 => ['name' => 'Platinum 950 (95.0%)', 'purity' => '95.0%', 'unit' => 'gram'],
            8 => ['name' => 'Silver 925 (92.5%)', 'purity' => '92.5%', 'unit' => 'gram'],
        ];

        Schema::disableForeignKeyConstraints();

        // Update or insert the 8 standard metals
        foreach ($metals as $id => $data) {
            MetalType::updateOrCreate(['id' => $id], $data);
        }

        // Remap any products/materials/madeProducts referencing ids > 8 to valid 1..8
        if (Schema::hasColumn('products', 'metal_type_id')) {
            Product::where('metal_type_id', '>', 8)->update(['metal_type_id' => 3]);
        }
        if (Schema::hasColumn('made_products', 'metal_type_id')) {
            MadeProduct::where('metal_type_id', '>', 8)->update(['metal_type_id' => 3]);
        }

        // Delete all metal types with id > 8
        MetalType::where('id', '>', 8)->delete();

        Schema::enableForeignKeyConstraints();
    }
}

