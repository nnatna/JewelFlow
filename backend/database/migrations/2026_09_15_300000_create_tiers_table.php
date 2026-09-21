<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tiers', function (Blueprint $table) {
            $table->id();
            $table->string('name', 50)->unique();
            $table->decimal('min_spending', 14, 2)->default(0);
            $table->decimal('discount_rate', 5, 2)->default(0);
            $table->string('badge_color', 30)->default('slate');
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Insert initial default tiers
        DB::table('tiers')->insert([
            [
                'name'          => 'Standard',
                'min_spending'  => 0.00,
                'discount_rate' => 0.00,
                'badge_color'   => 'slate',
                'description'   => 'Standard member tier with base prices',
                'is_active'     => true,
                'created_at'    => now(),
                'updated_at'    => now(),
            ],
            [
                'name'          => 'Gold',
                'min_spending'  => 1000.00,
                'discount_rate' => 2.00,
                'badge_color'   => 'amber',
                'description'   => 'Gold VIP tier with 2% discount on jewelry purchases',
                'is_active'     => true,
                'created_at'    => now(),
                'updated_at'    => now(),
            ],
            [
                'name'          => 'Platinum',
                'min_spending'  => 5000.00,
                'discount_rate' => 3.00,
                'badge_color'   => 'sky',
                'description'   => 'Platinum VIP tier with 3% discount on purchases',
                'is_active'     => true,
                'created_at'    => now(),
                'updated_at'    => now(),
            ],
            [
                'name'          => 'Diamond VIP',
                'min_spending'  => 10000.00,
                'discount_rate' => 5.00,
                'badge_color'   => 'violet',
                'description'   => 'Elite Diamond VIP tier with 5% discount and priority services',
                'is_active'     => true,
                'created_at'    => now(),
                'updated_at'    => now(),
            ],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('tiers');
    }
};
