<?php

namespace Database\Seeders;

use App\Models\Sale;
use App\Models\SaleItem;
use Illuminate\Database\Seeder;

class SaleItemSeeder extends Seeder
{
    public function run(): void
    {
        // Items are cleanly attached to sales in SaleSeeder.
        // If there are any sales without items, attach at least one item.
        $orphanSales = Sale::doesntHave('saleItems')->get();
        foreach ($orphanSales as $sale) {
            SaleItem::factory()->create(['sale_id' => $sale->id]);
        }
    }
}
