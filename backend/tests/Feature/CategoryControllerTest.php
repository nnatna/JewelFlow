<?php

namespace Tests\Feature;

use App\Models\Category;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CategoryControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_list_categories(): void
    {
        Category::factory()->count(3)->create();

        $response = $this->getJson('/api/categories');

        $response->assertOk();
        $this->assertCount(3, $response->json());
    }

    public function test_can_create_category(): void
    {
        $response = $this->postJson('/api/categories', [
            'name' => 'Engagement Rings',
            'description' => 'Diamond and platinum solitaire rings',
        ]);

        $response->assertStatus(201)
            ->assertJsonFragment([
                'name' => 'Engagement Rings',
            ]);

        $this->assertDatabaseHas('categories', [
            'name' => 'Engagement Rings',
        ]);
    }

    public function test_can_update_category(): void
    {
        $category = Category::factory()->create(['name' => 'Old Category']);

        $response = $this->putJson("/api/categories/{$category->id}", [
            'name' => 'New Category Name',
        ]);

        $response->assertOk()
            ->assertJsonFragment(['name' => 'New Category Name']);

        $this->assertDatabaseHas('categories', [
            'id' => $category->id,
            'name' => 'New Category Name',
        ]);
    }

    public function test_can_delete_category(): void
    {
        $category = Category::factory()->create();

        $response = $this->deleteJson("/api/categories/{$category->id}");

        $response->assertOk()
            ->assertJsonFragment(['success' => true]);

        $this->assertDatabaseMissing('categories', ['id' => $category->id]);
    }
}
