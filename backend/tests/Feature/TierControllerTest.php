<?php

namespace Tests\Feature;

use App\Models\Tier;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TierControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_list_tiers(): void
    {
        $response = $this->getJson('/api/tiers');

        $response->assertOk();
        $this->assertIsArray($response->json());
    }

    public function test_can_create_tier(): void
    {
        $response = $this->postJson('/api/tiers', [
            'name' => 'Diamond Elite VIP',
            'min_spending' => 25000,
            'discount_rate' => 7.5,
            'badge_color' => 'purple',
            'description' => 'Top tier VIP perks',
        ]);

        $response->assertStatus(201)
            ->assertJsonFragment([
                'name' => 'Diamond Elite VIP',
            ]);

        $this->assertDatabaseHas('tiers', [
            'name' => 'Diamond Elite VIP',
        ]);
    }
}
