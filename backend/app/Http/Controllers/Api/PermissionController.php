<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Permission;

class PermissionController extends Controller
{
    /**
     * Display a listing of system permissions grouped by module.
     */
    public function index(Request $request): JsonResponse
    {
        $permissions = Permission::all();

        // Categorize permissions into logical JewelFlow modules
        $modules = [
            'catalog' => [
                'name' => 'Jewelry Catalog & Inventory',
                'name_km' => 'កាតាឡុក & ស្តុកគ្រឿងអលង្ការ',
                'icon' => 'faGem',
                'permissions' => ['view_products', 'create_products', 'edit_products', 'delete_products'],
            ],
            'pos' => [
                'name' => 'POS Terminal & Invoicing',
                'name_km' => 'ប្រព័ន្ធគិតប្រាក់ (POS) & វិក្កយបត្រ',
                'icon' => 'faBagShopping',
                'permissions' => ['view_sales', 'create_sales', 'void_sales', 'apply_discounts'],
            ],
            'gold_rates' => [
                'name' => 'Daily Metal Rates & Fix',
                'name_km' => 'តម្លៃមាសប្រចាំថ្ងៃ',
                'icon' => 'faArrowTrendUp',
                'permissions' => ['view_gold_rates', 'update_gold_rates'],
            ],
            'buybacks' => [
                'name' => 'Scrap Gold Buybacks',
                'name_km' => 'ទិញមាសចាស់ចូល',
                'icon' => 'faArrowsRotate',
                'permissions' => ['view_buybacks', 'create_buybacks', 'delete_buybacks'],
            ],
            'gemstones' => [
                'name' => 'Gemstones & Diamond Vault',
                'name_km' => 'ឃ្លាំងត្បូងពេជ្រ',
                'icon' => 'faWandMagicSparkles',
                'permissions' => ['view_gemstones', 'manage_gemstones'],
            ],
            'supplies' => [
                'name' => 'Supplies & Purchase Orders',
                'name_km' => 'ការផ្គត់ផ្គង់ & បញ្ជាទិញចូល (PO)',
                'icon' => 'faBoxesStacked',
                'permissions' => ['view_purchases', 'create_purchases', 'confirm_purchases', 'delete_purchases', 'manage_suppliers'],
            ],
            'customers' => [
                'name' => 'Customers CRM & VIP Tiers',
                'name_km' => 'អតិថិជន & កម្រិត VIP',
                'icon' => 'faUsers',
                'permissions' => ['view_customers', 'manage_customers'],
            ],
            'reports' => [
                'name' => 'Reports & Financial Analytics',
                'name_km' => 'របាយការណ៍ & ស្ថិតិហិរញ្ញវត្ថុ',
                'icon' => 'faChartPie',
                'permissions' => ['view_reports', 'export_reports'],
            ],
            'settings' => [
                'name' => 'Settings, Stores & Users Access',
                'name_km' => 'ការកំណត់ ហាង & សិទ្ធិបុគ្គលិក',
                'icon' => 'faGear',
                'permissions' => ['manage_settings', 'manage_stores', 'view_users', 'manage_users', 'manage_roles'],
            ],
        ];

        return response()->json([
            'all' => $permissions,
            'modules' => $modules,
        ]);
    }
}
