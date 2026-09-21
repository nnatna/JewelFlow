<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('promotions', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->enum('discount_type', ['percent', 'fixed'])->default('percent');
            $table->decimal('discount_value', 10, 2)->default(0);
            // VIP tier gate: 'Standard' | 'Gold' | 'Platinum' | 'Diamond VIP' | null = any tier
            $table->string('tier_requirement', 30)->nullable();
            // Product gate: specific product id or null = all products
            $table->foreignId('product_id')->nullable()->constrained()->nullOnDelete();
            // Minimum cart total in USD before promotion activates
            $table->decimal('min_purchase', 14, 2)->default(0);
            $table->boolean('is_active')->default(true);
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('promotions');
    }
};
