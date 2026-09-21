<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->morphs('payable');
            $table->decimal('amount', 14, 2)->default(0);
            $table->string('payment_method');
            $table->enum('currency', ['USD', 'KHR'])->default('USD');
            $table->date('payment_date');
            $table->string('reference_no')->nullable();
            $table->enum('status', ['paid', 'pending', 'partial', 'refunded'])->default('paid');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
