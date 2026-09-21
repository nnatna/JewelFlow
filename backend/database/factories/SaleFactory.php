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
            'customer_id' => Customer::inRandomOrder()->value('id') ?? Customer::factory(),
            'user_id' => User::inRandomOrder()->value('id') ?? User::factory(),
            'invoice_no' => fake()->unique()->bothify('INV'.date('mdY').'####'),
            'total_amount' => $totalAmount,
            'discount' => $discount,
            'tax' => $tax,
            'grand_total_usd' => $grandTotal,
            'grand_total_khr' => round($grandTotal * fake()->randomElement([4000, 4100, 4200]), 2),
            'sale_date' => fake()->dateTimeBetween('-30 days', 'now')->format('Y-m-d'),
            'status' => fake()->randomElement(['completed', 'completed', 'pending', 'cancelled']),
        ];
    }
}
