<?php

namespace Database\Factories;

use App\Models\Payment;
use App\Models\Sale;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Payment>
 */
class PaymentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'payable_type' => Sale::class,
            'payable_id' => Sale::factory(),
            'amount' => fake()->randomFloat(2, 50, 3000),
            'payment_method' => fake()->randomElement(['cash', 'credit_card', 'bank_transfer', 'qr_code']),
            'payment_date' => fake()->date(),
            'reference_no' => fake()->bothify('PAY-#####'),
        ];
    }
}
