<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GoldPriceControllerTest extends TestCase
{
    public function test_can_fetch_spot_price_breakdown(): void
    {
        $response = $this->getJson('/api/gold-price/spot');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'source',
                'symbol',
                'currency',
                'spot_price_per_oz',
                'spot_price_per_gram',
                'conversions' => [
                    'currency',
                    'spot_price_per_oz',
                    'spot_price_per_gram',
                    'by_karat' => [
                        '24K', '22K', '21K', '18K', '14K', '10K', '9K'
                    ]
                ]
            ]);
    }

    public function test_can_convert_gold_weight_and_purity(): void
    {
        $payload = [
            'weight'            => 10,
            'unit'              => 'gram',
            'purity'            => '18k',
            'custom_spot_price' => 3110.34768, // $100/g pure
        ];

        $response = $this->postJson('/api/gold-price/convert', $payload);

        $response->assertStatus(200)
            ->assertJson([
                'success'          => true,
                'calculated_price' => 750.0,
            ]);
    }

    public function test_can_calculate_jewelry_valuation(): void
    {
        $payload = [
            'weight'            => 10,
            'unit'              => 'gram',
            'purity'            => '18k',
            'labor_cost'        => 50,
            'markup_rate'       => 20,
            'custom_spot_price' => 3110.34768,
        ];

        $response = $this->postJson('/api/gold-price/valuation', $payload);

        $response->assertStatus(200);
        $this->assertEquals(960.0, $response->json('valuation.final_retail_price'));
    }

    public function test_can_fetch_units_and_purities_metadata(): void
    {
        $response = $this->getJson('/api/gold-price/metadata');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'units',
                'purities',
                'exchange_rates'
            ]);
    }

    public function test_can_fetch_cambodian_gold_market_prices(): void
    {
        $response = $this->getJson('/api/gold-price/cambodia?purity=24k&custom_spot_price=3110.34768');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data'    => [
                    'standards' => [
                        'troy_ounce_in_grams' => 31.1034768,
                        'chi_in_grams'        => 3.75,
                        'damlung_in_grams'    => 37.5,
                        'chi_per_damlung'     => 10,
                    ],
                    'prices_usd' => [
                        'price_per_gram'    => 100.0,
                        'price_per_chi'     => 375.0,
                        'price_per_damlung' => 3750.0,
                    ],
                ]
            ]);
    }

    public function test_can_fetch_live_usd_to_khr_exchange_rate(): void
    {
        $response = $this->getJson('/api/exchange-rate/usd-khr');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'base',
                'target',
                'rate',
                'formatted',
                'symbol',
                'display_khmer',
                'display_english',
                'source',
                'timestamp',
                'last_updated',
            ])
            ->assertJson([
                'success' => true,
                'base'    => 'USD',
                'target'  => 'KHR',
                'symbol'  => '៛',
            ]);

        $this->assertGreaterThan(3500, $response->json('rate'));
        $this->assertLessThan(5000, $response->json('rate'));
    }
}
