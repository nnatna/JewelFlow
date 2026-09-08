<?php

namespace Database\Factories;

use App\Models\Customer;
use App\Models\Sale;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Sale>
 */
class SaleFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $totalAmount = fake()->randomFloat(2, 200, 5000);
        $discount = fake()->randomFloat(2, 0, 50);
        $tax = round(($totalAmount - $discount) * 0.1, 2);
        $grandTotal = $totalAmount - $discount + $tax;

        return [
            'customer_id' => Customer::factory(),
            'user_id' => User::factory(),
            'invoice_no' => fake()->unique()->bothify('INV-#####'),
            'total_amount' => $totalAmount,
            'discount' => $discount,
            'tax' => $tax,
            'grand_total' => $grandTotal,
            'sale_date' => fake()->date(),
        ];
    }
}
