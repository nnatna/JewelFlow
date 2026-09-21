<?php

namespace Tests\Feature;

use App\Models\Customer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CustomerControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_list_customers(): void
    {
        Customer::factory()->count(3)->create();

        $response = $this->getJson('/api/customers');

        $response->assertOk();
        $this->assertCount(3, $response->json());
    }

    public function test_can_create_customer(): void
    {
        $response = $this->postJson('/api/customers', [
            'name' => 'Sophia Loren',
            'phone' => '+15552345678',
            'email' => 'sophia@luxury.com',
            'address' => 'Beverly Hills, CA',
            'loyalty_points' => 100,
        ]);

        $response->assertStatus(201)
            ->assertJsonFragment([
                'name' => 'Sophia Loren',
                'phone' => '+15552345678',
            ]);

        $this->assertDatabaseHas('customers', [
            'name' => 'Sophia Loren',
            'phone' => '+15552345678',
        ]);
    }

    public function test_can_update_customer(): void
    {
        $customer = Customer::factory()->create(['name' => 'Old Name']);

        $response = $this->putJson("/api/customers/{$customer->id}", [
            'name' => 'Updated Name',
        ]);

        $response->assertOk()
            ->assertJsonFragment(['name' => 'Updated Name']);

        $this->assertDatabaseHas('customers', [
            'id' => $customer->id,
            'name' => 'Updated Name',
        ]);
    }

    public function test_can_delete_customer(): void
    {
        $customer = Customer::factory()->create();

        $response = $this->deleteJson("/api/customers/{$customer->id}");

        $response->assertOk()
            ->assertJsonFragment(['success' => true]);

        $this->assertDatabaseMissing('customers', ['id' => $customer->id]);
    }
}
