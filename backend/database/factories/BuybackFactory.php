<?php

namespace Database\Factories;

use App\Models\Buyback;
use App\Models\Customer;
use App\Models\MetalType;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Buyback>
 */
class BuybackFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $weight = fake()->randomFloat(2, 2, 20);
        $rate = fake()->randomFloat(2, 50, 85);
        $deductionRate = fake()->randomFloat(2, 1, 5);
        $laborDeduction = fake()->randomFloat(2, 5, 20);
        $totalRefund = round(($weight * ($rate - $deductionRate)) - $laborDeduction, 2);

        return [
            'customer_id' => Customer::factory(),
            'metal_type_id' => MetalType::factory(),
            'weight' => $weight,
            'buyback_rate' => $rate,
            'deduction_rate' => $deductionRate,
            'labor_deduction' => $laborDeduction,
            'total_refund' => max(0, $totalRefund),
            'buyback_date' => fake()->date(),
        ];
    }
}
