<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_profile_can_be_retrieved(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->getJson('/api/profile');

        $response->assertOk()
            ->assertJsonFragment([
                'id' => $user->id,
                'email' => $user->email,
            ]);
    }

    public function test_profile_information_can_be_updated(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->putJson('/api/profile', [
            'name' => 'Updated User Name',
            'email' => 'updated@luxury.com',
        ]);

        $response->assertOk()
            ->assertJsonFragment([
                'name' => 'Updated User Name',
                'email' => 'updated@luxury.com',
            ]);

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'name' => 'Updated User Name',
            'email' => 'updated@luxury.com',
        ]);
    }

    public function test_user_can_delete_their_account(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->deleteJson('/api/profile');

        $response->assertOk()
            ->assertJsonFragment(['success' => true]);

        $this->assertDatabaseMissing('users', ['id' => $user->id]);
    }
}
