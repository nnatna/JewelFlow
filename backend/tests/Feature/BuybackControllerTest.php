<?php

namespace Tests\Feature;

use App\Models\Buyback;
use App\Models\Customer;
use App\Models\Material;
use App\Models\MetalType;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BuybackControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_list_buybacks(): void
    {
        $metal = MetalType::factory()->create();
        Buyback::factory()->count(2)->create(['metal_type_id' => $metal->id]);

        $response = $this->getJson('/api/buybacks');

        $response->assertOk();
        $this->assertCount(2, $response->json());
    }

    public function test_can_create_buyback(): void
    {
        $metal = MetalType::factory()->create();
        $customer = Customer::factory()->create();

        $payload = [
            'customer_id' => $customer->id,
            'metal_type_id' => $metal->id,
            'weight' => 10.0,
            'buyback_rate' => 80.0,
            'deduction_rate' => 2.0,
            'labor_deduction' => 0.0,
            'total_refund' => 784.0,
            'buyback_date' => now()->toDateString(),
        ];

        $response = $this->postJson('/api/buybacks', $payload);

        $response->assertStatus(201)
            ->assertJsonFragment([
                'total_refund' => '784.00',
            ]);

        $this->assertDatabaseHas('buybacks', [
            'metal_type_id' => $metal->id,
        ]);
    }

    public function test_buyback_updates_material_stock_in_grams(): void
    {
        $metal = MetalType::factory()->create();
        $material = Material::factory()->create([
            'metal_type_id' => $metal->id,
            'unit' => 'g',
            'stock_qty' => 50.0,
        ]);
        $customer = Customer::factory()->create();

        $payload = [
            'customer_id' => $customer->id,
            'metal_type_id' => $metal->id,
            'material_id' => $material->id,
            'destination_type' => 'material',
            'weight' => 10.0,
            'buyback_rate' => 80.0,
            'deduction_rate' => 0.0,
            'labor_deduction' => 0.0,
            'total_refund' => 800.0,
            'buyback_date' => now()->toDateString(),
        ];

        $response = $this->postJson('/api/buybacks', $payload);
        $response->assertStatus(201);

        $material->refresh();
        $this->assertEquals(60.0, (float) $material->stock_qty);

        // Deleting buyback reverses stock
        $buybackId = $response->json('id');
        $delResponse = $this->deleteJson("/api/buybacks/{$buybackId}");
        $delResponse->assertOk();

        $material->refresh();
        $this->assertEquals(50.0, (float) $material->stock_qty);
    }

    public function test_buyback_updates_material_stock_in_chi(): void
    {
        $metal = MetalType::factory()->create();
        $material = Material::factory()->create([
            'metal_type_id' => $metal->id,
            'unit' => 'chi',
            'stock_qty' => 20.0,
        ]);
        $customer = Customer::factory()->create();

        // 7.5 grams = 2 chi
        $payload = [
            'customer_id' => $customer->id,
            'metal_type_id' => $metal->id,
            'material_id' => $material->id,
            'destination_type' => 'material',
            'weight' => 7.5,
            'buyback_rate' => 80.0,
            'deduction_rate' => 0.0,
            'labor_deduction' => 0.0,
            'total_refund' => 600.0,
            'buyback_date' => now()->toDateString(),
        ];

        $response = $this->postJson('/api/buybacks', $payload);
        $response->assertStatus(201);

        $material->refresh();
        $this->assertEquals(22.0, (float) $material->stock_qty);
    }
}
