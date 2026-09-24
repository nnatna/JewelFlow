<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('units', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // e.g. Gram, Chi, Damlung, Hun, Troy Ounce, Carat, Piece
            $table->string('name_kh')->nullable(); // e.g. ក្រាម, ជី, តម្លឹង, ហ៊ុន, អោនស៍, ការ៉ាត់, ដុំ/គ្រាប់
            $table->string('code')->unique(); // e.g. g, chi, damlung, hun, oz, ct, pcs
            $table->string('symbol')->nullable(); // e.g. g, ជី, តម្លឹង, ហ៊ុន, oz, ct, pcs
            $table->decimal('conversion_factor', 14, 6)->default(1.0); // Factor to base unit (grams): 1g=1, 1chi=3.75, 1damlung=37.5, 1hun=0.375
            $table->string('base_unit')->default('g'); // Default reference base: grams (g)
            $table->string('type')->default('weight'); // 'weight', 'count', 'gemstone', 'volume'
            $table->integer('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->text('description')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('units');
    }
};
