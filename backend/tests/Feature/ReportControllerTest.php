<?php

namespace Tests\Feature;

use App\Models\Buyback;
use App\Models\Category;
use App\Models\Customer;
use App\Models\GoldRate;
use App\Models\Material;
use App\Models\MetalType;
use App\Models\Product;
use App\Models\Purchase;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Supplier;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReportControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private MetalType $gold24k;
    private MetalType $gold18k;
    private Material $material24k;
    private Category $rings;
    private Customer $customer;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create([
            'name' => 'Store Manager',
            'email' => 'manager@jewelflow.com',
        ]);

        $this->gold24k = MetalType::create(['name' => '24K Gold', 'purity' => 99.9, 'unit' => 'g']);
        $this->gold18k = MetalType::create(['name' => '18K Gold', 'purity' => 75.0, 'unit' => 'g']);

        $this->material24k = Material::create([
            'metal_type_id' => $this->gold24k->id,
            'name' => '24K Pure Gold Bullion',
            'stock_qty' => 100,
            'cost_price' => 80.00,
        ]);

        $this->rings = Category::create(['name' => 'Rings', 'slug' => 'rings', 'description' => 'Fine jewelry rings']);

        $this->customer = Customer::create([
            'name' => 'Sokha Chan',
            'phone' => '012345678',
            'email' => 'sokha@example.com',
        ]);

        // Gold rates
        GoldRate::create([
            'metal_type_id' => $this->gold24k->id,
            'buy_rate' => 80.00,
            'sell_rate' => 85.00,
            'effective_date' => Carbon::now()->toDateString(),
            'created_by' => $this->user->id,
        ]);

        GoldRate::create([
            'metal_type_id' => $this->gold18k->id,
            'buy_rate' => 60.00,
            'sell_rate' => 65.00,
            'effective_date' => Carbon::now()->toDateString(),
            'created_by' => $this->user->id,
        ]);

        // Products
        $product = Product::create([
            'category_id' => $this->rings->id,
            'material_id' => $this->material24k->id,
            'code_sku' => 'RING-24K-001',
            'name' => 'Imperial Dragon Ring',
            'net_weight' => 10.0,
            'gross_weight' => 10.5,
            'labor_cost' => 100.0,
            'markup_rate' => 15.0,
            'stock_qty' => 5,
            'status' => 'active',
        ]);

        // Sale
        $sale = Sale::create([
            'customer_id' => $this->customer->id,
            'user_id' => $this->user->id,
            'invoice_no' => 'INV-2026-0001',
            'total_amount' => 1000.00,
            'discount' => 50.00,
            'tax' => 0.00,
            'grand_total_usd' => 950.00,
            'grand_total_khr' => 3895000.00,
            'sale_date' => Carbon::now()->toDateString(),
        ]);

        SaleItem::create([
            'sale_id' => $sale->id,
            'product_id' => $product->id,
            'gold_rate_applied' => 85.00,
            'weight_sold' => 10.0,
            'labor_fee' => 100.0,
            'gemstone_price' => 50.0,
            'unit_price' => 1000.0,
            'quantity' => 1,
            'subtotal' => 1000.0,
        ]);

        // Buyback
        Buyback::create([
            'customer_id' => $this->customer->id,
            'metal_type_id' => $this->gold18k->id,
            'weight' => 5.0,
            'buyback_rate' => 60.0,
            'deduction_rate' => 5.0,
            'labor_deduction' => 0.0,
            'total_refund' => 295.0,
            'buyback_date' => Carbon::now()->toDateString(),
        ]);

        // Supplier & Purchase
        $supplier = Supplier::create([
            'company_name' => 'Royal Refinery',
            'contact_name' => 'John Doe',
            'phone' => '098765432',
        ]);

        Purchase::create([
            'supplier_id' => $supplier->id,
            'invoice_no' => 'PUR-2026-0001',
            'total_amount' => 500.00,
            'purchase_date' => Carbon::now()->toDateString(),
            'status' => 'completed',
        ]);
    }

    public function test_can_fetch_summary_report(): void
    {
        $response = $this->getJson('/api/reports/summary');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'date_range' => ['start_date', 'end_date'],
                'sales' => [
                    'count', 'gross_total', 'discount', 'tax', 'grand_total',
                    'average_ticket', 'weight_sold' => ['grams', 'chi', 'damlung'],
                    'labor_fee_collected', 'gemstone_revenue'
                ],
                'buybacks' => [
                    'count', 'total_payout', 'total_deductions_profit', 'scrap_weight', 'average_payout'
                ],
                'purchases' => ['count', 'total_amount'],
                'vault_inventory' => [
                    'total_products', 'total_units_in_stock', 'low_stock_items',
                    'total_gold_weight', 'estimated_retail_valuation', 'estimated_cost_valuation'
                ],
                'financial' => ['cash_in', 'cash_out', 'net_cash_flow'],
            ]);

        $this->assertEquals(950.00, $response->json('sales.grand_total'));
        $this->assertEquals(295.00, $response->json('buybacks.total_payout'));
        $this->assertEquals(500.00, $response->json('purchases.total_amount'));
        $this->assertEquals(155.00, $response->json('financial.net_cash_flow')); // 950 - (295 + 500)
    }

    public function test_can_fetch_sales_report(): void
    {
        $response = $this->getJson('/api/reports/sales');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'summary' => [
                    'date_range', 'total_invoices', 'gross_total', 'grand_total',
                    'weight_sold' => ['grams', 'chi'],
                    'labor_revenue', 'gemstone_revenue',
                ],
                'sales_by_date',
                'sales_by_metal_type',
                'sales_by_category',
                'top_products',
                'sales_by_staff',
                'sales_list' => ['data', 'total', 'current_page'],
            ]);

        $this->assertEquals(1, $response->json('summary.total_invoices'));
        $this->assertEquals(10.0, $response->json('summary.weight_sold.grams'));
        $this->assertEquals(round(10.0 / 3.75, 2), $response->json('summary.weight_sold.chi'));
    }

    public function test_can_fetch_buyback_report(): void
    {
        $response = $this->getJson('/api/reports/buybacks');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'summary' => [
                    'date_range', 'total_tickets', 'total_payout', 'total_deductions_profit',
                    'scrap_weight' => ['grams', 'chi', 'damlung'],
                ],
                'buybacks_by_date',
                'buybacks_by_metal_type',
                'buybacks_list' => ['data', 'total'],
            ]);

        $this->assertEquals(1, $response->json('summary.total_tickets'));
        $this->assertEquals(295.0, $response->json('summary.total_payout'));
        $this->assertEquals(5.0, $response->json('summary.scrap_weight.grams'));
    }

    public function test_can_fetch_inventory_report_and_valuation(): void
    {
        $response = $this->getJson('/api/reports/inventory');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'summary' => [
                    'total_products_registered', 'total_stock_units',
                    'net_gold_weight' => ['grams', 'chi', 'damlung'],
                    'estimated_retail_valuation', 'estimated_cost_valuation',
                ],
                'stock_by_metal_type',
                'stock_by_category',
                'low_stock_alerts',
                'products_list' => ['data', 'total'],
            ]);

        $this->assertEquals(1, $response->json('summary.total_products_registered'));
        $this->assertEquals(5, $response->json('summary.total_stock_units'));
        $this->assertEquals(50.0, $response->json('summary.net_gold_weight.grams')); // 10g * 5 pcs
    }

    public function test_can_fetch_cash_flow_report(): void
    {
        $response = $this->getJson('/api/reports/cashflow');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'summary' => [
                    'date_range', 'total_inflow', 'total_outflow',
                    'total_buybacks_payout', 'total_purchases_payout', 'net_cash_flow'
                ],
                'payment_methods',
                'daily_timeline',
            ]);

        $this->assertEquals(950.0, $response->json('summary.total_inflow'));
        $this->assertEquals(795.0, $response->json('summary.total_outflow')); // 295 + 500
        $this->assertEquals(155.0, $response->json('summary.net_cash_flow'));
    }

    public function test_can_fetch_gold_rate_history_report(): void
    {
        $response = $this->getJson('/api/reports/gold-rates-history');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'date_range',
                'rates' => [
                    '*' => [
                        'id', 'metal_type_id', 'metal_name', 'sell_rate', 'buy_rate',
                        'spread', 'spread_percentage', 'effective_date', 'price_per_chi', 'price_per_damlung'
                    ]
                ]
            ]);

        $this->assertCount(2, $response->json('rates'));
    }
}
