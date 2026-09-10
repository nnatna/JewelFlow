<?php

namespace Tests\Feature;

use App\Models\Image;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ImageControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');
    }

    public function test_can_list_images(): void
    {
        Image::factory()->count(3)->create();

        $response = $this->getJson('/api/images');

        $response->assertStatus(200);
        $data = $response->json();
        $this->assertCount(3, $data);
        $this->assertArrayHasKey('url', $data[0]);
    }

    public function test_can_upload_image_file(): void
    {
        $file = UploadedFile::fake()->create('diamond_ring.jpg', 100, 'image/jpeg');

        $response = $this->postJson('/api/images', [
            'image' => $file,
        ]);

        $response->assertStatus(201)
            ->assertJsonFragment([
                'filename' => 'diamond_ring.jpg',
            ]);

        $created = Image::latest()->first();
        $this->assertNotNull($created);

        $relative = substr(ltrim($created->path, '/'), strlen('storage/'));
        Storage::disk('public')->assertExists($relative);
    }

    public function test_can_register_image_by_url(): void
    {
        $payload = [
            'url'       => 'https://images.unsplash.com/photo-1605100804763-247f67b3557e',
            'filename'  => 'unsplash_ring.jpg',
            'mime_type' => 'image/jpeg',
        ];

        $response = $this->postJson('/api/images', $payload);

        $response->assertStatus(201)
            ->assertJsonFragment([
                'filename' => 'unsplash_ring.jpg',
                'path'     => 'https://images.unsplash.com/photo-1605100804763-247f67b3557e',
            ]);
    }

    public function test_can_show_image_with_products(): void
    {
        $image = Image::factory()->create();

        $response = $this->getJson("/api/images/{$image->id}");

        $response->assertStatus(200)
            ->assertJson([
                'id'       => $image->id,
                'filename' => $image->filename,
            ]);
    }

    public function test_can_update_image(): void
    {
        $image = Image::factory()->create([
            'filename' => 'old_name.jpg',
        ]);

        $response = $this->putJson("/api/images/{$image->id}", [
            'filename' => 'new_name.jpg',
            'path'     => $image->path,
        ]);

        $response->assertStatus(200)
            ->assertJsonFragment([
                'filename' => 'new_name.jpg',
            ]);

        $this->assertDatabaseHas('images', [
            'id'       => $image->id,
            'filename' => 'new_name.jpg',
        ]);
    }

    public function test_can_delete_image_and_clean_up_file(): void
    {
        $file = UploadedFile::fake()->create('to_delete.png', 100, 'image/png');
        $stored = $file->store('images', 'public');

        $image = Image::create([
            'filename'  => 'to_delete.png',
            'path'      => '/storage/' . $stored,
            'mime_type' => 'image/png',
            'size'      => 1024,
        ]);

        Storage::disk('public')->assertExists($stored);

        $response = $this->deleteJson("/api/images/{$image->id}");

        $response->assertStatus(200)
            ->assertJsonFragment(['success' => true]);

        $this->assertDatabaseMissing('images', ['id' => $image->id]);
        Storage::disk('public')->assertMissing($stored);
    }
}
