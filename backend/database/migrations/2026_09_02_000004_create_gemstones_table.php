<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gemstones', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('shape')->nullable();
            $table->string('clarity')->nullable();
            $table->string('color')->nullable();
            $table->decimal('carat_weight', 8, 2)->default(0);
            $table->decimal('cost_price', 12, 2)->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gemstones');
    }
};
