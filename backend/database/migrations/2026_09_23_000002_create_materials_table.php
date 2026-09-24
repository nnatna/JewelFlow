<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('materials', function (Blueprint $table) {
            $table->id();
            $table->foreignId('material_category_id')->nullable()->constrained('material_categories')->nullOnDelete();
            $table->foreignId('metal_type_id')->nullable()->constrained('metal_types')->nullOnDelete();
            $table->foreignId('supplier_id')->nullable()->constrained('suppliers')->nullOnDelete();
            $table->string('name');
            $table->string('code')->nullable();
            $table->string('unit')->default('g'); // g, chi, ct, pcs, oz
            $table->decimal('stock_qty', 12, 3)->default(0);
            $table->decimal('min_stock_level', 12, 3)->default(0);
            $table->decimal('cost_price', 12, 2)->default(0); // Can be overridden or derived from metal_types / gold_rates
            $table->boolean('use_metal_rate')->default(false); // If true, cost price dynamically derives from metal_type live rate
            $table->string('purity')->nullable();
            $table->string('status')->default('in_stock'); // in_stock, low_stock, out_of_stock
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('materials');
    }
};
