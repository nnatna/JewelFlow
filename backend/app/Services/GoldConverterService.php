<?php

namespace App\Services;

class GoldConverterService
{
    /**
     * Standard Troy Ounce to Grams ratio (LBMA / international standard).
     */
    public const TROY_OUNCE_IN_GRAMS = 31.1034768;

    /**
     * Cambodian Gold Measurement Standards:
     * 1 Troy Ounce = 31.1034768 grams
     * 1 Chi (ជី)   = 3.75 grams
     * 1 Damlung (តម្លឹង) = 37.5 grams (10 Chi)
     * 1 Hun (ហ៊ុន)   = 0.375 grams (1/10 Chi)
     */
    public const CHI_IN_GRAMS = 3.75;
    public const DAMLUNG_IN_GRAMS = 37.5;
    public const HUN_IN_GRAMS = 0.375;
    public const CHI_PER_DAMLUNG = 10;

    /**
     * Weight units mapped to their equivalent weight in Grams.
     */
    public const UNIT_FACTORS_IN_GRAMS = [
        'g'           => 1.0,
        'gram'        => 1.0,
        'grams'       => 1.0,
        'ក្រាម'       => 1.0,
        'oz_t'        => 31.1034768,
        'oz'          => 31.1034768,
        'troy_ounce'  => 31.1034768,
        'kg'          => 1000.0,
        'kilogram'    => 1000.0,
        // Cambodian Units
        'chi'         => 3.75,        // 1 Chi = 3.75 grams
        'ជី'          => 3.75,        // Khmer: ជី
        'damlung'     => 37.5,        // 1 Damlung = 37.5 grams = 10 Chi
        'តម្លឹង'      => 37.5,        // Khmer: តម្លឹង
        'hun'         => 0.375,       // 1 Hun = 0.375 grams = 1/10 Chi
        'ហ៊ុន'        => 0.375,       // Khmer: ហ៊ុន
        'tael'        => 37.5,        // Equivalent to 1 Damlung
        // Other Asian Regional Units
        'baht'        => 15.244,      // Standard Thai gold baht
        'tola'        => 11.6638038,  // South Asian Tola
        'dwt'         => 1.55517384,  // Pennyweight
        'pennyweight' => 1.55517384,
        'ct'          => 0.2,         // Carat (gems)
        'carat'       => 0.2,
    ];

    /**
     * Standard Karat and Purity factors.
     */
    public const PURITY_FACTORS = [
        '24k' => 1.0,          // 99.9% - 100% pure bullion
        '999' => 0.999,
        '995' => 0.995,
        '22k' => 22 / 24,      // 91.67%
        '916' => 0.9167,
        '21k' => 21 / 24,      // 87.5%
        '875' => 0.875,
        '18k' => 18 / 24,      // 75.0%
        '750' => 0.75,
        '14k' => 14 / 24,      // 58.33%
        '585' => 0.585,
        '10k' => 10 / 24,      // 41.67%
        '417' => 0.417,
        '9k'  => 9 / 24,       // 37.5%
        '375' => 0.375,
    ];

    /**
     * Standard fiat currency exchange rates (pegged against 1 USD).
     */
    public const STANDARD_EXCHANGE_RATES = [
        'USD' => 1.0,
        'EUR' => 0.92,
        'GBP' => 0.79,
        'KHR' => 4100.0,  // Cambodian Riel
        'THB' => 36.50,   // Thai Baht
        'SGD' => 1.35,    // Singapore Dollar
        'JPY' => 155.0,   // Japanese Yen
        'AUD' => 1.52,    // Australian Dollar
        'CAD' => 1.36,    // Canadian Dollar
        'CHF' => 0.90,    // Swiss Franc
        'CNY' => 7.25,    // Chinese Yuan
        'HKD' => 7.82,    // Hong Kong Dollar
        'INR' => 83.50,   // Indian Rupee
        'AED' => 3.67,    // UAE Dirham
    ];

    /**
     * Convert weight from one unit to another.
     */
    public function convertWeight(float $weight, string $fromUnit, string $toUnit): float
    {
        $from = strtolower(trim($fromUnit));
        $to = strtolower(trim($toUnit));

        $fromFactor = self::UNIT_FACTORS_IN_GRAMS[$from] ?? 1.0;
        $toFactor = self::UNIT_FACTORS_IN_GRAMS[$to] ?? 1.0;

        // Convert to base grams, then to target unit
        $grams = $weight * $fromFactor;
        return round($grams / $toFactor, 6);
    }

    /**
     * Resolve the purity multiplier for a given karat string, number, or hallmark.
     */
    public function getPurityFactor(string|int|float $purity): float
    {
        $normalized = strtolower(trim((string)$purity));

        if (isset(self::PURITY_FACTORS[$normalized])) {
            return self::PURITY_FACTORS[$normalized];
        }

        // Check if given as percentage (e.g. 75 or 0.75 or 75%)
        $num = (float)str_replace(['%', 'k', 'K'], '', $normalized);
        if ($num > 1.0 && $num <= 24.0) {
            // Karat value like 18 or 22
            return $num / 24.0;
        } elseif ($num > 24.0 && $num <= 100.0) {
            // Percentage like 75 or 91.6
            return $num / 100.0;
        } elseif ($num > 100.0 && $num <= 999.9) {
            // Millesimal fineness like 750, 916, 999
            return $num / 1000.0;
        } elseif ($num > 0 && $num <= 1.0) {
            return $num;
        }

        return 1.0; // Default to 24K pure
    }

    /**
     * Convert currency from one symbol to another using standard or custom exchange rates.
     */
    public function convertCurrency(float $amount, string $fromCurrency = 'USD', string $toCurrency = 'USD', array $customRates = []): float
    {
        $from = strtoupper(trim($fromCurrency));
        $to = strtoupper(trim($toCurrency));

        if ($from === $to) {
            return round($amount, 2);
        }

        $rates = array_merge(self::STANDARD_EXCHANGE_RATES, $customRates);
        $fromRate = $rates[$from] ?? 1.0;
        $toRate = $rates[$to] ?? 1.0;

        // Normalize amount to USD base, then multiply by target rate
        $inUSD = $amount / $fromRate;
        return round($inUSD * $toRate, 2);
    }

    /**
     * Standard Cambodian Formula 1: Price per Gram
     * Price per Gram = Price per Ounce / 31.1034768
     */
    public function pricePerGram(float $pricePerOunce): float
    {
        return $pricePerOunce / self::TROY_OUNCE_IN_GRAMS;
    }

    /**
     * Standard Cambodian Formula 2: Price per Chi (ជី)
     * Price per Chi = Price per Gram * 3.75
     */
    public function pricePerChi(float $pricePerOunce): float
    {
        return $this->pricePerGram($pricePerOunce) * self::CHI_IN_GRAMS;
    }

    /**
     * Standard Cambodian Formula 3: Price per Damlung (តម្លឹង)
     * Price per Damlung = Price per Chi * 10
     */
    public function pricePerDamlung(float $pricePerOunce): float
    {
        return $this->pricePerChi($pricePerOunce) * self::CHI_PER_DAMLUNG;
    }

    /**
     * Comprehensive Cambodian Gold Market Breakdown in USD and Cambodian Riel (KHR).
     *
     * Standards:
     * - 1 Troy Ounce = 31.1034768 grams
     * - 1 Chi (ជី) = 3.75 grams
     * - 1 Damlung (តម្លឹង) = 37.5 grams (10 Chi)
     */
    public function getCambodianGoldBreakdown(float $spotPricePerOz, string|int|float $purity = '24k', float $khrExchangeRate = 4100.0): array
    {
        $purityFactor = $this->getPurityFactor($purity);
        $gramUSD = $this->pricePerGram($spotPricePerOz) * $purityFactor;
        $chiUSD = $gramUSD * self::CHI_IN_GRAMS;
        $damlungUSD = $chiUSD * self::CHI_PER_DAMLUNG;
        $hunUSD = $chiUSD / 10;

        return [
            'purity'                => (string)$purity,
            'purity_factor'         => round($purityFactor, 4),
            'standards'             => [
                'troy_ounce_in_grams' => self::TROY_OUNCE_IN_GRAMS,
                'chi_in_grams'        => self::CHI_IN_GRAMS,
                'damlung_in_grams'    => self::DAMLUNG_IN_GRAMS,
                'chi_per_damlung'     => self::CHI_PER_DAMLUNG,
            ],
            'formulas'              => [
                'price_per_gram'    => 'Price per Ounce / 31.1034768',
                'price_per_chi'     => 'Price per Gram * 3.75',
                'price_per_damlung' => 'Price per Chi * 10',
            ],
            'prices_usd'            => [
                'spot_per_ounce'    => round($spotPricePerOz, 2),
                'price_per_gram'    => round($gramUSD, 2),
                'price_per_chi'     => round($chiUSD, 2),
                'price_per_damlung' => round($damlungUSD, 2),
                'price_per_hun'     => round($hunUSD, 2),
            ],
            'prices_khr'            => [
                'exchange_rate'     => $khrExchangeRate,
                'currency'          => 'KHR',
                'symbol'            => '៛',
                'price_per_gram'    => round($gramUSD * $khrExchangeRate),
                'price_per_chi'     => round($chiUSD * $khrExchangeRate),
                'price_per_damlung' => round($damlungUSD * $khrExchangeRate),
                'price_per_hun'     => round($hunUSD * $khrExchangeRate),
            ],
            'khmer_labels'          => [
                'gram'              => 'ក្រាម (Gram)',
                'chi'               => 'ជី (Chi)',
                'damlung'           => 'តម្លឹង (Damlung)',
                'hun'               => 'ហ៊ុន (Hun)',
            ],
        ];
    }

    /**
     * Calculate price of gold given a spot price per Troy Ounce (LBMA benchmark).
     */
    public function calculateGoldPrice(
        float $spotPricePerOz,
        float $weight = 1.0,
        string $unit = 'gram',
        string|int|float $purity = '24k',
        string $currency = 'USD'
    ): float {
        $pricePerGram24k = $spotPricePerOz / self::TROY_OUNCE_IN_GRAMS;
        $purityFactor = $this->getPurityFactor($purity);
        $unitInGrams = self::UNIT_FACTORS_IN_GRAMS[strtolower(trim($unit))] ?? 1.0;

        $totalGrams = $weight * $unitInGrams;
        $totalPriceUSD = $totalGrams * ($pricePerGram24k * $purityFactor);

        if ($currency !== 'USD') {
            return $this->convertCurrency($totalPriceUSD, 'USD', $currency);
        }

        return round($totalPriceUSD, 2);
    }

    /**
     * Generate a multi-karat, multi-unit price breakdown based on spot price.
     */
    public function getRatesBreakdown(float $spotPricePerOz, string $currency = 'USD'): array
    {
        $spotInCurrency = ($currency === 'USD')
            ? $spotPricePerOz
            : $this->convertCurrency($spotPricePerOz, 'USD', $currency);

        $pricePerGram24k = $spotInCurrency / self::TROY_OUNCE_IN_GRAMS;

        $karats = [
            '24K' => 1.0,
            '22K' => 22 / 24,
            '21K' => 21 / 24,
            '18K' => 18 / 24,
            '14K' => 14 / 24,
            '10K' => 10 / 24,
            '9K'  => 9 / 24,
        ];

        $karatBreakdown = [];
        foreach ($karats as $karat => $factor) {
            $gramPrice = $pricePerGram24k * $factor;
            $karatBreakdown[$karat] = [
                'purity_percent'  => round($factor * 100, 2),
                'price_per_gram'  => round($gramPrice, 2),
                'price_per_tael'  => round($gramPrice * 37.5, 2),
                'price_per_chi'   => round($gramPrice * 3.75, 2),
                'price_per_baht'  => round($gramPrice * 15.244, 2),
                'price_per_tola'  => round($gramPrice * 11.6638, 2),
                'price_per_oz'    => round($gramPrice * self::TROY_OUNCE_IN_GRAMS, 2),
            ];
        }

        return [
            'currency'            => strtoupper($currency),
            'spot_price_per_oz'   => round($spotInCurrency, 2),
            'spot_price_per_gram' => round($pricePerGram24k, 2),
            'spot_price_per_kg'   => round($pricePerGram24k * 1000, 2),
            'spot_price_per_tael' => round($pricePerGram24k * 37.5, 2),
            'by_karat'            => $karatBreakdown,
        ];
    }

    /**
     * Calculate retail valuation for a finished jewelry piece including labor, markup, and gemstones.
     */
    public function calculateJewelryValuation(
        float $spotPricePerOz,
        float $weight,
        string $unit = 'gram',
        string|int|float $purity = '18k',
        float $laborCost = 0.0,
        float $markupRate = 0.0,
        array $gemstones = [],
        string $currency = 'USD'
    ): array {
        $pureGramPriceUSD = $spotPricePerOz / self::TROY_OUNCE_IN_GRAMS;
        $purityFactor = $this->getPurityFactor($purity);
        $unitInGrams = self::UNIT_FACTORS_IN_GRAMS[strtolower(trim($unit))] ?? 1.0;

        $weightInGrams = $weight * $unitInGrams;
        $metalBasePriceUSD = $weightInGrams * ($pureGramPriceUSD * $purityFactor);

        $gemstonesTotalUSD = 0.0;
        foreach ($gemstones as $gem) {
            $gemstonesTotalUSD += (float)($gem['value'] ?? $gem['price'] ?? 0);
        }

        $baseCostUSD = $metalBasePriceUSD + $laborCost + $gemstonesTotalUSD;
        $markupMultiplier = 1 + ($markupRate / 100.0);
        $finalPriceUSD = $baseCostUSD * $markupMultiplier;

        $fx = fn ($amount) => ($currency === 'USD') ? round($amount, 2) : $this->convertCurrency($amount, 'USD', $currency);

        return [
            'currency'          => strtoupper($currency),
            'weight_input'      => $weight,
            'unit'              => $unit,
            'weight_in_grams'   => round($weightInGrams, 3),
            'purity'            => (string)$purity,
            'purity_factor'     => round($purityFactor, 4),
            'metal_cost'        => $fx($metalBasePriceUSD),
            'labor_cost'        => $fx($laborCost),
            'gemstones_cost'    => $fx($gemstonesTotalUSD),
            'base_cost'         => $fx($baseCostUSD),
            'markup_rate'       => $markupRate,
            'markup_amount'     => $fx($finalPriceUSD - $baseCostUSD),
            'final_retail_price'=> $fx($finalPriceUSD),
        ];
    }

    /**
     * Get all supported weight units metadata.
     */
    public function getSupportedUnits(): array
    {
        return [
            ['code' => 'g', 'name' => 'Gram (ក្រាម)', 'khmer' => 'ក្រាម', 'grams' => 1.0],
            ['code' => 'chi', 'name' => 'Chi (ជី)', 'khmer' => 'ជី', 'grams' => 3.75],
            ['code' => 'damlung', 'name' => 'Damlung (តម្លឹង)', 'khmer' => 'តម្លឹង', 'grams' => 37.5],
            ['code' => 'hun', 'name' => 'Hun (ហ៊ុន)', 'khmer' => 'ហ៊ុន', 'grams' => 0.375],
            ['code' => 'oz_t', 'name' => 'Troy Ounce (អោនស៍)', 'khmer' => 'អោនស៍', 'grams' => 31.1034768],
            ['code' => 'kg', 'name' => 'Kilogram (គីឡូក្រាម)', 'khmer' => 'គីឡូក្រាម', 'grams' => 1000.0],
            ['code' => 'tael', 'name' => 'Tael (Damlung)', 'khmer' => 'តម្លឹង', 'grams' => 37.5],
            ['code' => 'baht', 'name' => 'Baht (បាត)', 'khmer' => 'បាត', 'grams' => 15.244],
            ['code' => 'tola', 'name' => 'Tola', 'grams' => 11.6638],
            ['code' => 'dwt', 'name' => 'Pennyweight', 'grams' => 1.55517384],
            ['code' => 'ct', 'name' => 'Carat (ការ៉ាត់)', 'khmer' => 'ការ៉ាត់', 'grams' => 0.2],
        ];
    }

    /**
     * Get all supported purities.
     */
    public function getSupportedPurities(): array
    {
        return [
            ['code' => '24k', 'name' => '24K Pure Gold', 'fineness' => 999, 'factor' => 1.0],
            ['code' => '22k', 'name' => '22K Crown Gold', 'fineness' => 916, 'factor' => 0.9167],
            ['code' => '21k', 'name' => '21K Arabic Gold', 'fineness' => 875, 'factor' => 0.875],
            ['code' => '18k', 'name' => '18K Fine Jewelry', 'fineness' => 750, 'factor' => 0.75],
            ['code' => '14k', 'name' => '14K Commercial Gold', 'fineness' => 585, 'factor' => 0.5833],
            ['code' => '10k', 'name' => '10K Minimum Gold', 'fineness' => 417, 'factor' => 0.4167],
            ['code' => '9k',  'name' => '9K British Standard', 'fineness' => 375, 'factor' => 0.375],
        ];
    }

    /**
     * Get standard exchange rates list.
     */
    public function getStandardExchangeRates(): array
    {
        return self::STANDARD_EXCHANGE_RATES;
    }
}
