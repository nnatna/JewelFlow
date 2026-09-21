<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Customer;
use App\Models\MetalType;
use App\Models\Product;
use App\Models\Sale;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SaleControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_list_sales(): void
    {
        $user = User::factory()->create();
        Sale::factory()->count(2)->create(['user_id' => $user->id]);

        $response = $this->getJson('/api/sales');

        $response->assertOk();
        $this->assertCount(2, $response->json());
    }

    public function test_can_create_sale_with_items_and_payment(): void
    {
        $user = User::factory()->create();
        $category = Category::factory()->create();
        $metal = MetalType::factory()->create();
        $product = Product::factory()->create([
            'category_id' => $category->id,
            'metal_type_id' => $metal->id,
            'stock_qty' => 10,
        ]);
        $customer = Customer::factory()->create(['total_spent' => 0]);

        $payload = [
            'invoice_no' => 'INV-TEST-2026-001',
            'customer_id' => $customer->id,
            'user_id' => $user->id,
            'total_amount' => 1000.00,
            'discount' => 50.00,
            'tax' => 20.00,
            'grand_total' => 970.00,
            'grand_total_usd' => 970.00,
            'grand_total_khr' => 3977000,
            'sale_date' => now()->toDateString(),
            'status' => 'completed',
            'payment_method' => 'cash',
            'payment_status' => 'paid',
            'items' => [
                [
                    'product_id' => $product->id,
                    'quantity' => 2,
                    'weight_sold' => 5.0,
                    'gold_rate_applied' => 85.0,
                    'labor_fee' => 50.0,
                    'unit_price' => 475.0,
                    'subtotal' => 950.0,
                    'status' => 'completed',
                ],
            ],
        ];

        $response = $this->postJson('/api/sales', $payload);

        $response->assertStatus(201)
            ->assertJsonFragment([
                'invoice_no' => 'INV-TEST-2026-001',
                'status' => 'completed',
            ]);

        $this->assertDatabaseHas('sales', [
            'invoice_no' => 'INV-TEST-2026-001',
        ]);

        // Verify product stock decremented from 10 to 8
        $this->assertEquals(8, $product->fresh()->stock_qty);

        // Verify customer total spent updated
        $this->assertEquals(970.00, $customer->fresh()->total_spent);
    }

    public function test_can_update_sale_status(): void
    {
        $user = User::factory()->create();
        $sale = Sale::factory()->create([
            'user_id' => $user->id,
            'status' => 'pending',
        ]);

        $response = $this->putJson("/api/sales/{$sale->id}/status", [
            'status' => 'completed',
        ]);

        $response->assertOk()
            ->assertJsonFragment(['status' => 'completed']);

        $this->assertDatabaseHas('sales', [
            'id' => $sale->id,
            'status' => 'completed',
        ]);
    }

    public function test_can_delete_sale_and_restore_stock(): void
    {
        $user = User::factory()->create();
        $category = Category::factory()->create();
        $metal = MetalType::factory()->create();
        $product = Product::factory()->create([
            'category_id' => $category->id,
            'metal_type_id' => $metal->id,
            'stock_qty' => 5,
        ]);

        $sale = Sale::factory()->create(['user_id' => $user->id]);
        $sale->saleItems()->create([
            'product_id' => $product->id,
            'quantity' => 3,
            'weight_sold' => 5.0,
            'gold_rate_applied' => 85.0,
            'unit_price' => 425.0,
            'subtotal' => 1275.0,
            'status' => 'completed',
        ]);

        $response = $this->deleteJson("/api/sales/{$sale->id}");

        $response->assertOk()
            ->assertJsonFragment(['success' => true]);

        $this->assertDatabaseMissing('sales', ['id' => $sale->id]);
        // Stock should be restored: 5 + 3 = 8
        $this->assertEquals(8, $product->fresh()->stock_qty);
    }
}
