<?php

namespace Database\Seeders;

use App\Models\Material;
use App\Models\MaterialCategory;
use App\Models\MetalType;
use App\Models\Supplier;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class MaterialSeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            [
                'name' => 'Precious Metals & Bullion',
                'slug' => 'precious-metals-bullion',
                'code' => 'CAT-METALS',
                'description' => 'Pure gold bullion, casting grains, silver, and platinum metals for crafting.',
            ],
            [
                'name' => 'Gemstones & Certified Diamonds',
                'slug' => 'gemstones-certified-diamonds',
                'code' => 'CAT-GEMS',
                'description' => 'Loose natural gemstones, certified diamonds, rubies, and sapphires.',
            ],
            [
                'name' => 'Castings, Mountings & Findings',
                'slug' => 'castings-mountings-findings',
                'code' => 'CAT-FINDINGS',
                'description' => 'Ring blanks, pendant bails, earring backings, lobster clasps, and prong settings.',
            ],
            [
                'name' => 'Solders, Flux & Master Alloys',
                'slug' => 'solders-flux-alloys',
                'code' => 'CAT-ALLOYS',
                'description' => 'Gold solder sheets, platinum paste, wire solder, anti-firescale flux, and master alloy additives.',
            ],
        ];

        $catMap = [];
        foreach ($categories as $cat) {
            $created = MaterialCategory::firstOrCreate(
                ['slug' => $cat['slug']],
                $cat
            );
            $catMap[$cat['slug']] = $created->id;
        }

        $metals = MetalType::all()->keyBy('name');
        $suppliers = Supplier::all();
        $firstSupplierId = $suppliers->first()?->id;

        $materials = [
            [
                'material_category_id' => $catMap['precious-metals-bullion'],
                'metal_type_id' => $metals->get('24K (99.99%)')?->id ?? $metals->first()?->id,
                'supplier_id' => $firstSupplierId,
                'name' => '24K Pure Gold Casting Grain (99.99%)',
                'code' => 'MAT-AU999-01',
                'unit' => 'g',
                'stock_qty' => 1250.000,
                'min_stock_level' => 200.000,
                'cost_price' => 88.50,
                'use_metal_rate' => true,
                'purity' => '99.99%',
                'status' => 'in_stock',
                'notes' => 'Ultra-refined 99.99% gold shot for luxury fine casting and alloy formulation.',
            ],
            [
                'material_category_id' => $catMap['precious-metals-bullion'],
                'metal_type_id' => $metals->get('18K (75.0%)')?->id ?? $metals->skip(1)->first()?->id,
                'supplier_id' => $firstSupplierId,
                'name' => '18K Yellow Gold Master Granules (750)',
                'code' => 'MAT-AU750-02',
                'unit' => 'g',
                'stock_qty' => 840.500,
                'min_stock_level' => 150.000,
                'cost_price' => 66.40,
                'use_metal_rate' => true,
                'purity' => '75.0%',
                'status' => 'in_stock',
                'notes' => 'Pre-alloyed 18K yellow gold granules with anti-oxidation additives.',
            ],
            [
                'material_category_id' => $catMap['precious-metals-bullion'],
                'metal_type_id' => $metals->get('Platinum 950')?->id,
                'supplier_id' => $suppliers->skip(1)->first()?->id ?? $firstSupplierId,
                'name' => 'Platinum 950 Casting Grain (PT950)',
                'code' => 'MAT-PT950-03',
                'unit' => 'g',
                'stock_qty' => 320.000,
                'min_stock_level' => 50.000,
                'cost_price' => 38.00,
                'use_metal_rate' => true,
                'purity' => '95.0%',
                'status' => 'in_stock',
                'notes' => 'High-purity Platinum 950 for bespoke bridal engagement rings and luxury pavé.',
            ],
            [
                'material_category_id' => $catMap['gemstones-certified-diamonds'],
                'metal_type_id' => null,
                'supplier_id' => $suppliers->first()?->id,
                'name' => 'Round Brilliant Cut Diamond 1.0ct (VVS1 / E)',
                'code' => 'MAT-DIA-100',
                'unit' => 'ct',
                'stock_qty' => 15.000,
                'min_stock_level' => 3.000,
                'cost_price' => 3850.00,
                'use_metal_rate' => false,
                'purity' => 'VVS1 / E Color',
                'status' => 'in_stock',
                'notes' => 'GIA Certified 1.00 Carat Triple Excellent round brilliant loose solitaire diamonds.',
            ],
            [
                'material_category_id' => $catMap['gemstones-certified-diamonds'],
                'metal_type_id' => null,
                'supplier_id' => $suppliers->first()?->id,
                'name' => 'Cushion Cut Royal Blue Sapphire (2.5ct Heated)',
                'code' => 'MAT-SAP-250',
                'unit' => 'ct',
                'stock_qty' => 8.000,
                'min_stock_level' => 2.000,
                'cost_price' => 1200.00,
                'use_metal_rate' => false,
                'purity' => 'Royal Blue AAA',
                'status' => 'in_stock',
                'notes' => 'Vibrant natural Ceylon royal blue sapphire for bespoke heritage pieces.',
            ],
            [
                'material_category_id' => $catMap['castings-mountings-findings'],
                'metal_type_id' => $metals->get('18K (75.0%)')?->id,
                'supplier_id' => $firstSupplierId,
                'name' => '18K 6-Prong Solitaire Crown Mount (Size 6-7)',
                'code' => 'MAT-MNT-18K01',
                'unit' => 'pcs',
                'stock_qty' => 45.000,
                'min_stock_level' => 10.000,
                'cost_price' => 145.00,
                'use_metal_rate' => false,
                'purity' => '18K 750',
                'status' => 'in_stock',
                'notes' => 'Pre-formed 18K solid gold head setting for fast custom diamond assembly.',
            ],
            [
                'material_category_id' => $catMap['solders-flux-alloys'],
                'metal_type_id' => null,
                'supplier_id' => $firstSupplierId,
                'name' => '18K Hard Gold Solder Sheet (0.3mm Gauge)',
                'code' => 'MAT-SLD-18KH',
                'unit' => 'g',
                'stock_qty' => 150.000,
                'min_stock_level' => 25.000,
                'cost_price' => 52.00,
                'use_metal_rate' => false,
                'purity' => '18K Match',
                'status' => 'in_stock',
                'notes' => 'Color-matched hard solder for seam-free ring sizing and retipping.',
            ],
        ];

        foreach ($materials as $mat) {
            Material::firstOrCreate(
                ['code' => $mat['code']],
                $mat
            );
        }
    }
}
