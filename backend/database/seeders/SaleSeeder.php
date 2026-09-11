<?php

namespace Database\Seeders;

use App\Models\Customer;
use App\Models\Payment;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class SaleSeeder extends Seeder
{
    public function run(): void
    {
        $customers = Customer::all();
        $users = User::all();
        $products = Product::all();

        if ($users->isEmpty()) {
            $users = User::factory()->count(3)->create();
        }
        if ($products->isEmpty()) {
            $products = Product::factory()->count(10)->create();
        }

        $paymentMethods = ['cash', 'credit_card', 'bank_transfer', 'qr_code'];

        // Create 25 realistic sales spread over the past 30 days
        for ($i = 1; $i <= 25; $i++) {
            // Distribute dates: some today, some this week, some this month
            if ($i <= 3) {
                $saleDate = Carbon::today()->format('Y-m-d');
            } elseif ($i <= 10) {
                $saleDate = Carbon::today()->subDays(rand(1, 6))->format('Y-m-d');
            } else {
                $saleDate = Carbon::today()->subDays(rand(7, 28))->format('Y-m-d');
            }

            // 85% registered customer, 15% walk-in guest (null customer_id)
            $customer = ($i % 7 === 0 || $customers->isEmpty()) ? null : $customers->random();
            $user = $users->random();

            $invoiceNo = sprintf('INV%s%04d', date('mdY'), $i);

            $saleStatus = ($i % 5 === 0) ? 'pending' : (($i % 9 === 0) ? 'cancelled' : 'completed');

            // Create base sale
            $sale = Sale::create([
                'customer_id' => $customer?->id,
                'user_id' => $user->id,
                'invoice_no' => $invoiceNo,
                'total_amount' => 0,
                'discount' => 0,
                'tax' => 0,
                'grand_total' => 0,
                'sale_date' => $saleDate,
                'status' => $saleStatus,
            ]);

            // Add 1 to 3 items per sale
            $itemsCount = rand(1, 3);
            $selectedProducts = $products->random(min($itemsCount, $products->count()));
            $subtotalSum = 0;

            foreach ($selectedProducts as $product) {
                $qty = rand(1, 2);
                $netWeight = (float) ($product->net_weight ?? 5.5);
                $goldRate = 85.50; // standard market rate
                $laborFee = (float) ($product->labor_cost ?? 60.0);
                $gemstoneCost = rand(0, 1) ? rand(50, 400) : 0;

                $basePrice = ($netWeight * $goldRate) + $laborFee + $gemstoneCost;
                $markup = 1 + (($product->markup_rate ?? 15) / 100);
                $unitPrice = round($basePrice * $markup, 2);
                $itemSubtotal = round($unitPrice * $qty, 2);
                $subtotalSum += $itemSubtotal;

                SaleItem::create([
                    'sale_id' => $sale->id,
                    'product_id' => $product->id,
                    'gold_rate_applied' => $goldRate,
                    'weight_sold' => $netWeight,
                    'labor_fee' => $laborFee,
                    'gemstone_price' => $gemstoneCost,
                    'unit_price' => $unitPrice,
                    'quantity' => $qty,
                    'subtotal' => $itemSubtotal,
                    'status' => $saleStatus,
                ]);
            }

            // Calculations
            $discount = ($customer && rand(0, 1)) ? round($subtotalSum * 0.05, 2) : 0;
            $taxable = $subtotalSum - $discount;
            $tax = round($taxable * 0.08, 2);
            $grandTotal = round($taxable + $tax, 2);

            $sale->update([
                'total_amount' => $subtotalSum,
                'discount' => $discount,
                'tax' => $tax,
                'grand_total' => $grandTotal,
            ]);

            // Record payment
            $method = $paymentMethods[array_rand($paymentMethods)];
            Payment::create([
                'payable_type' => Sale::class,
                'payable_id' => $sale->id,
                'amount' => $grandTotal,
                'payment_method' => $method,
                'payment_date' => $saleDate,
                'reference_no' => 'PAY-' . rand(10000, 99999),
            ]);
        }
    }
}
