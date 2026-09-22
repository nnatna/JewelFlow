<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

class PermissionsSeeder extends Seeder
{
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // Define all permissions grouped by jewelry store domain
        $permissionDefs = [
            // Catalog & Inventory
            'view_products'     => 'View Jewelry Catalog & Inventory',
            'create_products'   => 'Add New Jewelry Items & Variants',
            'edit_products'     => 'Edit Product Pricing & Specifications',
            'delete_products'   => 'Delete Products from Catalog',

            // POS Sales Terminal
            'view_sales'        => 'View Sales Invoices & Orders',
            'create_sales'      => 'Process POS Checkout & Issue Invoices',
            'void_sales'        => 'Void / Cancel Sales Orders',
            'apply_discounts'   => 'Apply VIP Discounts & Manual Price Overrides',

            // Daily Metal Fix
            'view_gold_rates'   => 'View Daily Metal Rates',
            'update_gold_rates' => 'Update & Publish Daily Gold Pricing',

            // Scrap Gold Buybacks
            'view_buybacks'     => 'View Scrap Gold Buyback History',
            'create_buybacks'   => 'Appraise & Execute Gold Buybacks',
            'delete_buybacks'   => 'Delete Buyback Records',

            // Gemstones Vault
            'view_gemstones'    => 'View Gemstones & Diamonds Vault',
            'manage_gemstones'  => 'Add, Edit & Assign Gemstones',

            // Supplies & Procurement
            'view_purchases'    => 'View Inbound Purchase Orders',
            'create_purchases'  => 'Create Supplier Purchase Orders',
            'confirm_purchases' => 'Confirm Shipment Arrival & Stock In',
            'delete_purchases'  => 'Delete / Cancel Purchase Orders',
            'manage_suppliers'  => 'Manage Suppliers & Refineries Directory',

            // Customers CRM
            'view_customers'    => 'View Customer Directory & Tiers',
            'manage_customers'  => 'Create & Edit Customer Profiles',

            // Reports & Audits
            'view_reports'      => 'View Financial & Revenue Reports',
            'export_reports'    => 'Export & Print Audits / Ledgers',

            // System & Security
            'manage_settings'   => 'Manage Store Profile & Atelier Settings',
            'manage_stores'     => 'Manage Multi-Store Branches & Ateliers',
            'view_users'        => 'View Staff Accounts',
            'manage_users'      => 'Create, Edit & Delete Staff Accounts',
            'manage_roles'      => 'Configure Roles & Permission Matrix',
        ];

        foreach ($permissionDefs as $name => $desc) {
            Permission::firstOrCreate(
                ['name' => $name, 'guard_name' => 'web']
            );
        }
    }
}
