<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('buybacks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete();
            $table->foreignId('metal_type_id')->constrained()->cascadeOnDelete();
            $table->decimal('weight', 10, 2)->default(0);
            $table->decimal('buyback_rate', 12, 2)->default(0);
            $table->decimal('deduction_rate', 12, 2)->default(0);
            $table->decimal('labor_deduction', 12, 2)->default(0);
            $table->decimal('total_refund', 14, 2)->default(0);
            $table->date('buyback_date');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('buybacks');
    }
};
