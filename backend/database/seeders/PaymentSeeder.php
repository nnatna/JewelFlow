<?php

namespace Database\Seeders;

use App\Models\Buyback;
use App\Models\Payment;
use App\Models\Sale;
use Illuminate\Database\Seeder;

class PaymentSeeder extends Seeder
{
    public function run(): void
    {
        // Seed payments for any Buybacks that do not have payment records
        $buybacks = Buyback::doesntHave('payments')->get();
        foreach ($buybacks as $buyback) {
            Payment::create([
                'payable_type' => Buyback::class,
                'payable_id' => $buyback->id,
                'amount' => $buyback->total_refund,
                'payment_method' => rand(0, 1) ? 'cash' : 'bank_transfer',
                'currency' => 'USD',
                'payment_date' => $buyback->buyback_date,
                'reference_no' => 'PAY-BB-'.rand(10000, 99999),
                'status' => 'paid',
            ]);
        }

        // Ensure any sales without payments also get recorded
        $orphanSales = Sale::doesntHave('payments')->get();
        foreach ($orphanSales as $sale) {
            Payment::create([
                'payable_type' => Sale::class,
                'payable_id' => $sale->id,
                'amount' => $sale->grand_total_usd ?? $sale->grand_total,
                'payment_method' => 'credit_card',
                'currency' => 'USD',
                'payment_date' => $sale->sale_date,
                'reference_no' => 'PAY-'.rand(10000, 99999),
                'status' => 'paid',
            ]);
        }
    }
}
