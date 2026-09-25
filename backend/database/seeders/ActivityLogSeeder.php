<?php

namespace Database\Seeders;

use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class ActivityLogSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $admin = User::where('email', 'admin@jewelflow.com')->first() ?? User::first();

        $logs = [
            [
                'user_id' => $admin?->id,
                'user_name' => $admin?->name ?? 'Super Administrator',
                'user_role' => 'super_admin',
                'action' => 'login',
                'module' => 'auth',
                'description' => 'Super Administrator authenticated into JewelFlow Atelier Control Hub',
                'ip_address' => '127.0.0.1',
                'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0.0.0 Safari/537.36',
                'status' => 'success',
                'created_at' => Carbon::now()->subHours(8),
            ],
            [
                'user_id' => $admin?->id,
                'user_name' => $admin?->name ?? 'Super Administrator',
                'user_role' => 'super_admin',
                'action' => 'update',
                'module' => 'settings',
                'description' => 'Updated gold rate standards and currency exchange rate (USD 1 = 4,050 KHR)',
                'ip_address' => '127.0.0.1',
                'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0.0.0 Safari/537.36',
                'old_values' => ['usd_khr_rate' => 4000],
                'new_values' => ['usd_khr_rate' => 4050],
                'status' => 'success',
                'created_at' => Carbon::now()->subHours(6),
            ],
            [
                'user_id' => $admin?->id,
                'user_name' => $admin?->name ?? 'Super Administrator',
                'user_role' => 'super_admin',
                'action' => 'create',
                'module' => 'products',
                'description' => 'Created new jewelry item: 24K Royal Khmer Dragon Ring (Code: RNG-24K-001)',
                'ip_address' => '127.0.0.1',
                'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0.0.0 Safari/537.36',
                'new_values' => ['code' => 'RNG-24K-001', 'category' => 'Rings', 'metal' => 'Gold 24K', 'price' => 1450.00],
                'status' => 'success',
                'created_at' => Carbon::now()->subHours(4),
            ],
            [
                'user_id' => $admin?->id,
                'user_name' => $admin?->name ?? 'Super Administrator',
                'user_role' => 'super_admin',
                'action' => 'create',
                'module' => 'sales',
                'description' => 'Processed POS checkout invoice #INV-2026-0089 for customer Oun Sreypov ($2,350.00)',
                'ip_address' => '127.0.0.1',
                'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0.0.0 Safari/537.36',
                'new_values' => ['invoice_no' => 'INV-2026-0089', 'total_amount' => 2350.00, 'payment_method' => 'cash'],
                'status' => 'success',
                'created_at' => Carbon::now()->subHours(2),
            ],
            [
                'user_id' => null,
                'user_name' => 'Anonymous',
                'user_role' => 'guest',
                'action' => 'login_failed',
                'module' => 'auth',
                'description' => 'Failed sign-in attempt detected from unrecognized IP address',
                'ip_address' => '192.168.1.144',
                'user_agent' => 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
                'status' => 'warning',
                'created_at' => Carbon::now()->subMinutes(45),
            ],
            [
                'user_id' => $admin?->id,
                'user_name' => $admin?->name ?? 'Super Administrator',
                'user_role' => 'super_admin',
                'action' => 'update',
                'module' => 'units',
                'description' => 'Configured Khmer traditional jewelry measurement unit (ជី / Chi = 3.75g)',
                'ip_address' => '127.0.0.1',
                'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0.0.0 Safari/537.36',
                'status' => 'success',
                'created_at' => Carbon::now()->subMinutes(15),
            ]
        ];

        foreach ($logs as $log) {
            ActivityLog::create($log);
        }
    }
}
