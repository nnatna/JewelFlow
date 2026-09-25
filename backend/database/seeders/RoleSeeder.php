<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

class RoleSeeder extends Seeder
{
    protected function syncRole(string $name, string $description, array $permissions): Role
    {
        $role = Role::updateOrCreate(
            ['name' => $name],
            ['guard_name' => 'web', 'description' => $description]
        );

        if (in_array('*', $permissions, true)) {
            $permIds = Permission::pluck('id')->toArray();
        } else {
            $permIds = Permission::whereIn('name', $permissions)->pluck('id')->toArray();
        }

        $role->permissions()->sync($permIds);

        return $role;
    }

    public function run(): void
    {
        // Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // 1. Super Admin (Full Unrestricted Access to all permissions)
        $this->syncRole(
            'super_admin',
            'Super Administrator with Full System & Atelier Authority',
            ['*']
        );

        // 2. Admin (Store Administrator)
        $this->syncRole(
            'admin',
            'Master Jeweler & Store Administrator',
            ['*']
        );

        // 3. Manager
        $this->syncRole(
            'manager',
            'Store Atelier Manager & Operations Supervisor',
            [
                'view_products', 'create_products', 'edit_products', 'delete_products',
                'view_categories', 'manage_categories',
                'view_materials', 'manage_materials',
                'view_made_products', 'create_made_products', 'edit_made_products', 'delete_made_products',
                'view_sales', 'create_sales', 'void_sales', 'apply_discounts',
                'view_gold_rates', 'update_gold_rates',
                'view_buybacks', 'create_buybacks', 'delete_buybacks',
                'view_gemstones', 'manage_gemstones',
                'view_purchases', 'create_purchases', 'confirm_purchases', 'delete_purchases', 'manage_suppliers',
                'view_customers', 'manage_customers',
                'view_promotions', 'manage_promotions',
                'view_reports', 'export_reports',
                'view_users', 'manage_users',
            ]
        );

        // 4. Cashier
        $this->syncRole(
            'cashier',
            'POS Cashier & Front-Desk Sales Associate',
            [
                'view_products',
                'view_categories',
                'view_sales', 'create_sales', 'apply_discounts',
                'view_gold_rates',
                'view_made_products', 'create_made_products',
                'view_customers', 'manage_customers',
                'view_promotions',
                'view_gemstones',
            ]
        );

        // 5. Goldsmith
        $this->syncRole(
            'goldsmith',
            'Master Goldsmith, Craftsman & Gold Appraiser',
            [
                'view_products',
                'view_materials', 'manage_materials',
                'view_made_products', 'create_made_products', 'edit_made_products',
                'view_gold_rates',
                'view_buybacks', 'create_buybacks',
                'view_gemstones', 'manage_gemstones',
            ]
        );

        // 6. Accountant
        $this->syncRole(
            'accountant',
            'Senior Financial Accountant & Inventory Auditor',
            [
                'view_sales',
                'view_purchases',
                'view_buybacks',
                'view_reports', 'export_reports',
                'view_gold_rates',
                'view_products',
                'view_customers',
            ]
        );

        // Clear cache again after seeding
        app()[PermissionRegistrar::class]->forgetCachedPermissions();
    }
}
