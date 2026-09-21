<?php

namespace Tests\Feature;

use App\Models\Promotion;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PromotionControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_list_promotions(): void
    {
        $response = $this->getJson('/api/promotions');

        $response->assertOk();
        $this->assertIsArray($response->json());
    }

    public function test_can_create_promotion(): void
    {
        $payload = [
            'name' => 'Khmer New Year Gold Discount',
            'discount_type' => 'percent',
            'discount_value' => 10.0,
            'min_purchase' => 500.0,
            'is_active' => true,
        ];

        $response = $this->postJson('/api/promotions', $payload);

        $response->assertStatus(201)
            ->assertJsonFragment([
                'name' => 'Khmer New Year Gold Discount',
            ]);

        $this->assertDatabaseHas('promotions', [
            'name' => 'Khmer New Year Gold Discount',
        ]);
    }

    public function test_can_get_applicable_promotion(): void
    {
        Promotion::create([
            'name' => 'VIP 15% Off',
            'discount_type' => 'percent',
            'discount_value' => 15.0,
            'tier_requirement' => 'Diamond VIP',
            'min_purchase' => 100.0,
            'is_active' => true,
        ]);

        $response = $this->getJson('/api/promotions/applicable?tier=Diamond VIP&cart_total=200');

        $response->assertOk()
            ->assertJsonFragment(['found' => true]);
    }
}
