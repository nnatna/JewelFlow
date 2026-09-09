<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained()->cascadeOnDelete();
            $table->foreignId('metal_type_id')->constrained()->cascadeOnDelete();
            $table->string('code_sku')->unique();
            $table->string('barcode')->nullable();
            $table->string('name');
            $table->decimal('net_weight', 10, 2)->default(0);
            $table->decimal('gross_weight', 10, 2)->default(0);
            $table->decimal('labor_cost', 12, 2)->default(0);
            $table->decimal('markup_rate', 8, 2)->default(0);
            $table->integer('stock_qty')->default(0);
            $table->enum('status', ['active', 'inactive', 'out_of_stock'])->default('active');

            $table->foreignId('image_id')->nullable()->constrained()->cascadeOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
