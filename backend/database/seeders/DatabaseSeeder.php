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
            UnitSeeder::class,
            MetalTypeSeeder::class,
            GoldRateSeeder::class,
            CategorySeeder::class,
            SupplierSeeder::class,
            CustomerSeeder::class,
            MaterialSeeder::class,
            ProductSeeder::class,
            MadeProductSeeder::class,
            PurchaseSeeder::class,
            SaleSeeder::class,
            SaleItemSeeder::class,
            BuybackSeeder::class,
            PaymentSeeder::class,
        ]);
    }
}
