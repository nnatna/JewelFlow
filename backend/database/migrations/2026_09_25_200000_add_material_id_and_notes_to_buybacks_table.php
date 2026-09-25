<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('buybacks', function (Blueprint $table) {
            if (!Schema::hasColumn('buybacks', 'material_id')) {
                $table->foreignId('material_id')->nullable()->after('metal_type_id')->constrained('materials')->nullOnDelete();
            }
            if (!Schema::hasColumn('buybacks', 'destination_type')) {
                $table->string('destination_type')->default('material')->after('material_id');
            }
            if (!Schema::hasColumn('buybacks', 'notes')) {
                $table->text('notes')->nullable()->after('total_refund');
            }
        });
    }

    public function down(): void
    {
        Schema::table('buybacks', function (Blueprint $table) {
            if (Schema::hasColumn('buybacks', 'material_id')) {
                $table->dropForeign(['material_id']);
                $table->dropColumn('material_id');
            }
            if (Schema::hasColumn('buybacks', 'destination_type')) {
                $table->dropColumn('destination_type');
            }
            if (Schema::hasColumn('buybacks', 'notes')) {
                $table->dropColumn('notes');
            }
        });
    }
};
