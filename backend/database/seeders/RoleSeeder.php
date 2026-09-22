<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // 1. Super Admin (Full Unrestricted Access to all current & future permissions)
        $superAdmin = Role::firstOrCreate(
            ['name' => 'super_admin'],
            ['guard_name' => 'web', 'description' => 'Super Administrator with Full System & Atelier Authority']
        );
        $superAdmin->syncPermissions(Permission::all());

        // 2. Admin (Store Administrator)
        $admin = Role::firstOrCreate(
            ['name' => 'admin'],
            ['guard_name' => 'web', 'description' => 'Master Jeweler & Store Administrator']
        );
        $admin->syncPermissions(Permission::all());

        // 3. Manager
        $manager = Role::firstOrCreate(
            ['name' => 'manager'],
            ['guard_name' => 'web', 'description' => 'Store Atelier Manager & Operations Supervisor']
        );
        $manager->syncPermissions([
            'view_products', 'create_products', 'edit_products',
            'view_sales', 'create_sales', 'void_sales', 'apply_discounts',
            'view_gold_rates', 'update_gold_rates',
            'view_buybacks', 'create_buybacks',
            'view_gemstones', 'manage_gemstones',
            'view_purchases', 'create_purchases', 'confirm_purchases', 'manage_suppliers',
            'view_customers', 'manage_customers',
            'view_reports', 'export_reports',
            'view_users',
        ]);

        // 4. Cashier
        $cashier = Role::firstOrCreate(
            ['name' => 'cashier'],
            ['guard_name' => 'web', 'description' => 'POS Cashier & Front-Desk Sales Associate']
        );
        $cashier->syncPermissions([
            'view_products',
            'view_sales', 'create_sales', 'apply_discounts',
            'view_gold_rates',
            'view_customers', 'manage_customers',
        ]);

        // 5. Goldsmith
        $goldsmith = Role::firstOrCreate(
            ['name' => 'goldsmith'],
            ['guard_name' => 'web', 'description' => 'Master Goldsmith, Craftsman & Gold Appraiser']
        );
        $goldsmith->syncPermissions([
            'view_products',
            'view_gold_rates',
            'view_buybacks', 'create_buybacks',
            'view_gemstones', 'manage_gemstones',
        ]);

        // 6. Accountant
        $accountant = Role::firstOrCreate(
            ['name' => 'accountant'],
            ['guard_name' => 'web', 'description' => 'Senior Financial Accountant & Inventory Auditor']
        );
        $accountant->syncPermissions([
            'view_sales',
            'view_purchases',
            'view_reports', 'export_reports',
            'view_gold_rates',
        ]);
    }
}
