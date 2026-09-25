<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\MetalType;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
    }

    public function test_can_list_products(): void
    {
        $category = Category::factory()->create();
        $material = \App\Models\Material::factory()->create();
        Product::factory()->count(3)->create([
            'category_id' => $category->id,
            'material_id' => $material->id,
        ]);

        $response = $this->getJson('/api/products');

        $response->assertStatus(200);
        $data = $response->json();
        $this->assertCount(3, $data);
        $this->assertArrayHasKey('category', $data[0]);
    }

    public function test_can_search_products_by_name_or_sku(): void
    {
        $category = Category::factory()->create();
        $material = \App\Models\Material::factory()->create();

        Product::factory()->create([
            'name'        => 'Royal Diamond Ring',
            'code_sku'    => 'SKU-RDR-001',
            'category_id' => $category->id,
            'material_id' => $material->id,
        ]);

        Product::factory()->create([
            'name'        => 'Emerald Necklace',
            'code_sku'    => 'SKU-EMN-002',
            'category_id' => $category->id,
            'material_id' => $material->id,
        ]);

        $response = $this->getJson('/api/products?search=Diamond');
        $response->assertStatus(200);
        $this->assertCount(1, $response->json());
        $this->assertEquals('Royal Diamond Ring', $response->json()[0]['name']);

        $responseSku = $this->getJson('/api/products?search=SKU-EMN');
        $responseSku->assertStatus(200);
        $this->assertCount(1, $responseSku->json());
        $this->assertEquals('Emerald Necklace', $responseSku->json()[0]['name']);
    }

    public function test_can_create_product_with_valid_attributes(): void
    {
        $category = Category::factory()->create();
        $material = \App\Models\Material::factory()->create();

        $payload = [
            'name'        => '24K Solid Gold Dragon Bangle',
            'code_sku'    => 'JWL-DRG-999',
            'barcode'     => '8939991234567',
            'category_id' => $category->id,
            'material_id' => $material->id,
            'net_weight'  => 37.50,
            'gross_weight'=> 38.00,
            'labor_cost'  => 250.00,
            'markup_rate' => 12.50,
            'stock_qty'   => 3,
            'status'      => 'active',
        ];

        $response = $this->postJson('/api/products', $payload);

        $response->assertStatus(201)
            ->assertJsonFragment([
                'name'     => '24K Solid Gold Dragon Bangle',
                'code_sku' => 'JWL-DRG-999',
            ]);

        $this->assertDatabaseHas('products', [
            'code_sku' => 'JWL-DRG-999',
            'name'     => '24K Solid Gold Dragon Bangle',
        ]);
    }

    public function test_can_show_product(): void
    {
        $category = Category::factory()->create();
        $material = \App\Models\Material::factory()->create();
        $product = Product::factory()->create([
            'category_id' => $category->id,
            'material_id' => $material->id,
        ]);

        $response = $this->getJson("/api/products/{$product->id}");

        $response->assertStatus(200)
            ->assertJson([
                'id'       => $product->id,
                'code_sku' => $product->code_sku,
            ]);
    }

    public function test_can_update_product(): void
    {
        $category = Category::factory()->create();
        $material = \App\Models\Material::factory()->create();
        $product = Product::factory()->create([
            'category_id' => $category->id,
            'material_id' => $material->id,
            'name'        => 'Initial Name',
            'stock_qty'   => 5,
        ]);

        $response = $this->putJson("/api/products/{$product->id}", [
            'name'      => 'Updated Premium Name',
            'stock_qty' => 10,
        ]);

        $response->assertStatus(200)
            ->assertJsonFragment([
                'name'      => 'Updated Premium Name',
                'stock_qty' => 10,
            ]);

        $this->assertDatabaseHas('products', [
            'id'        => $product->id,
            'name'      => 'Updated Premium Name',
            'stock_qty' => 10,
        ]);
    }

    public function test_can_delete_product(): void
    {
        $category = Category::factory()->create();
        $material = \App\Models\Material::factory()->create();
        $product = Product::factory()->create([
            'category_id' => $category->id,
            'material_id' => $material->id,
        ]);

        $response = $this->deleteJson("/api/products/{$product->id}");

        $response->assertStatus(200)
            ->assertJsonFragment(['success' => true]);

        $this->assertDatabaseMissing('products', ['id' => $product->id]);
    }
}
