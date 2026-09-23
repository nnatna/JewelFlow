<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $this->call([
            PermissionsSeeder::class,
            RoleSeeder::class,
            UserSeeder::class,
            MetalTypeSeeder::class,
            GoldRateSeeder::class,
            CategorySeeder::class,
            GemstoneSeeder::class,
            SupplierSeeder::class,
            CustomerSeeder::class,
            ProductSeeder::class,
            ProductGemstoneSeeder::class,
            MadeProductSeeder::class,
            PurchaseSeeder::class,
            SaleSeeder::class,
            SaleItemSeeder::class,
            BuybackSeeder::class,
            PaymentSeeder::class,
        ]);
    }
}
