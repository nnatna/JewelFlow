<?php

namespace Tests\Unit;

use App\Services\GoldConverterService;
use PHPUnit\Framework\TestCase;

class GoldConverterServiceTest extends TestCase
{
    private GoldConverterService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new GoldConverterService();
    }

    public function test_converts_troy_ounce_to_grams_accurately(): void
    {
        $grams = $this->service->convertWeight(1, 'oz_t', 'g');
        $this->assertEqualsWithDelta(31.103477, $grams, 0.0001);
    }

    public function test_converts_tael_to_grams(): void
    {
        $grams = $this->service->convertWeight(1, 'tael', 'g');
        $this->assertEquals(37.5, $grams);
    }

    public function test_calculates_purity_factors(): void
    {
        $this->assertEquals(1.0, $this->service->getPurityFactor('24k'));
        $this->assertEquals(0.75, $this->service->getPurityFactor('18k'));
        $this->assertEqualsWithDelta(0.9167, $this->service->getPurityFactor('22k'), 0.0001);
    }

    public function test_calculates_gold_price_for_pure_and_alloyed_gold(): void
    {
        $spotPerOz = 3110.34768; // Exactly 100 USD per gram for 24K
        
        // 10 grams of 24K
        $price24k = $this->service->calculateGoldPrice($spotPerOz, 10, 'g', '24k');
        $this->assertEquals(1000.0, $price24k);

        // 10 grams of 18K (75%)
        $price18k = $this->service->calculateGoldPrice($spotPerOz, 10, 'g', '18k');
        $this->assertEquals(750.0, $price18k);
    }

    public function test_calculates_jewelry_valuation_with_markup_and_labor(): void
    {
        $spotPerOz = 3110.34768; // $100/g 24K
        // 10g of 18K ($750) + $50 labor + $200 gems = $1000 base cost
        // 20% markup = $1200 final retail price
        $valuation = $this->service->calculateJewelryValuation(
            $spotPerOz,
            10,
            'g',
            '18k',
            50.0,
            20.0,
            [['value' => 200.0]]
        );

        $this->assertEquals(750.0, $valuation['metal_cost']);
        $this->assertEquals(50.0, $valuation['labor_cost']);
        $this->assertEquals(200.0, $valuation['gemstones_cost']);
        $this->assertEquals(1000.0, $valuation['base_cost']);
        $this->assertEquals(200.0, $valuation['markup_amount']);
        $this->assertEquals(1200.0, $valuation['final_retail_price']);
    }

    public function test_cambodian_gold_measurement_formulas(): void
    {
        // Spot price = $3,110.34768 / oz
        $spotPerOz = 3110.34768;

        // Formula 1: Price per Gram = Price per Ounce / 31.1034768 = $100.00
        $pricePerGram = $this->service->pricePerGram($spotPerOz);
        $this->assertEqualsWithDelta(100.0, $pricePerGram, 0.0001);

        // Formula 2: Price per Chi (ជី) = Price per Gram * 3.75 = $375.00
        $pricePerChi = $this->service->pricePerChi($spotPerOz);
        $this->assertEqualsWithDelta(375.0, $pricePerChi, 0.0001);

        // Formula 3: Price per Damlung (តម្លឹង) = Price per Chi * 10 = $3,750.00
        $pricePerDamlung = $this->service->pricePerDamlung($spotPerOz);
        $this->assertEqualsWithDelta(3750.0, $pricePerDamlung, 0.0001);

        // Cambodian gold breakdown
        $breakdown = $this->service->getCambodianGoldBreakdown($spotPerOz, '24k', 4100.0);
        $this->assertEquals(100.0, $breakdown['prices_usd']['price_per_gram']);
        $this->assertEquals(375.0, $breakdown['prices_usd']['price_per_chi']);
        $this->assertEquals(3750.0, $breakdown['prices_usd']['price_per_damlung']);
        $this->assertEquals(410000.0, $breakdown['prices_khr']['price_per_gram']);
        $this->assertEquals(1537500.0, $breakdown['prices_khr']['price_per_chi']);
        $this->assertEquals(15375000.0, $breakdown['prices_khr']['price_per_damlung']);
    }
}

