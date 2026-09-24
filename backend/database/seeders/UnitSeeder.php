<?php

namespace Database\Seeders;

use App\Models\Material;
use App\Models\Product;
use App\Models\Unit;
use Illuminate\Database\Seeder;

class UnitSeeder extends Seeder
{
    public function run(): void
    {
        $units = [
            [
                'name' => 'Gram',
                'name_kh' => 'ក្រាម',
                'code' => 'g',
                'symbol' => 'g',
                'conversion_factor' => 1.000000,
                'base_unit' => 'g',
                'type' => 'weight',
                'sort_order' => 1,
                'is_active' => true,
                'description' => 'Metric base gram unit (1.0g)',
            ],
            [
                'name' => 'Hun',
                'name_kh' => 'ហ៊ុន',
                'code' => 'hun',
                'symbol' => 'ហ៊ុន',
                'conversion_factor' => 0.375000,
                'base_unit' => 'g',
                'type' => 'weight',
                'sort_order' => 2,
                'is_active' => true,
                'description' => 'Cambodian Hun unit (1/10 Chi = 0.375g)',
            ],
            [
                'name' => 'Chi',
                'name_kh' => 'ជី',
                'code' => 'chi',
                'symbol' => 'ជី',
                'conversion_factor' => 3.750000,
                'base_unit' => 'g',
                'type' => 'weight',
                'sort_order' => 3,
                'is_active' => true,
                'description' => 'Cambodian Chi gold unit (3.75g)',
            ],
            [
                'name' => 'Damlung',
                'name_kh' => 'តម្លឹង',
                'code' => 'damlung',
                'symbol' => 'តម្លឹង',
                'conversion_factor' => 37.500000,
                'base_unit' => 'g',
                'type' => 'weight',
                'sort_order' => 4,
                'is_active' => true,
                'description' => 'Cambodian Damlung / Tael unit (10 Chi = 37.5g)',
            ],
            [
                'name' => 'Troy Ounce',
                'name_kh' => 'អោនស៍',
                'code' => 'oz',
                'symbol' => 'oz',
                'conversion_factor' => 31.103477,
                'base_unit' => 'g',
                'type' => 'weight',
                'sort_order' => 5,
                'is_active' => true,
                'description' => 'LBMA International Troy Ounce (31.1034768g)',
            ],
            [
                'name' => 'Carat',
                'name_kh' => 'ការ៉ាត់',
                'code' => 'ct',
                'symbol' => 'ct',
                'conversion_factor' => 0.200000,
                'base_unit' => 'g',
                'type' => 'gemstone',
                'sort_order' => 6,
                'is_active' => true,
                'description' => 'Metric gemstone carat (0.2g)',
            ],
            [
                'name' => 'Piece',
                'name_kh' => 'ដុំ/គ្រាប់',
                'code' => 'pcs',
                'symbol' => 'pcs',
                'conversion_factor' => 1.000000,
                'base_unit' => 'pcs',
                'type' => 'count',
                'sort_order' => 7,
                'is_active' => true,
                'description' => 'Count unit for mountings, stones and accessories',
            ],
        ];

        foreach ($units as $u) {
            Unit::updateOrCreate(['code' => $u['code']], $u);
        }

        // Backfill existing materials with unit_id
        $unitMap = Unit::pluck('id', 'code')->toArray();
        foreach (Material::all() as $mat) {
            $unitCode = strtolower($mat->unit ?: 'g');
            if (isset($unitMap[$unitCode])) {
                $mat->update(['unit_id' => $unitMap[$unitCode]]);
            } elseif (isset($unitMap['g'])) {
                $mat->update(['unit_id' => $unitMap['g']]);
            }
        }

        // Backfill existing products with unit_id (default to Chi / Gram)
        $gramUnitId = $unitMap['g'] ?? null;
        if ($gramUnitId) {
            Product::whereNull('unit_id')->update(['unit_id' => $gramUnitId]);
        }
    }
}
