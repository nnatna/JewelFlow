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
        if (Schema::hasTable('materials') && !Schema::hasColumn('materials', 'unit_id')) {
            Schema::table('materials', function (Blueprint $table) {
                $table->foreignId('unit_id')->nullable()->after('code')->constrained('units')->nullOnDelete();
            });
        }

        if (Schema::hasTable('products') && !Schema::hasColumn('products', 'unit_id')) {
            Schema::table('products', function (Blueprint $table) {
                $table->foreignId('unit_id')->nullable()->after('name')->constrained('units')->nullOnDelete();
            });
        }

        if (Schema::hasTable('sale_items') && !Schema::hasColumn('sale_items', 'unit_id')) {
            Schema::table('sale_items', function (Blueprint $table) {
                $table->foreignId('unit_id')->nullable()->after('product_id')->constrained('units')->nullOnDelete();
            });
        }

        if (Schema::hasTable('made_products') && !Schema::hasColumn('made_products', 'unit_id')) {
            Schema::table('made_products', function (Blueprint $table) {
                $table->foreignId('unit_id')->nullable()->after('product_id')->constrained('units')->nullOnDelete();
            });
        }

        if (Schema::hasTable('buybacks') && !Schema::hasColumn('buybacks', 'unit_id')) {
            Schema::table('buybacks', function (Blueprint $table) {
                $table->foreignId('unit_id')->nullable()->after('metal_type_id')->constrained('units')->nullOnDelete();
            });
        }

        if (Schema::hasTable('gemstones') && !Schema::hasColumn('gemstones', 'unit_id')) {
            Schema::table('gemstones', function (Blueprint $table) {
                $table->foreignId('unit_id')->nullable()->after('carat_weight')->constrained('units')->nullOnDelete();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('materials') && Schema::hasColumn('materials', 'unit_id')) {
            Schema::table('materials', function (Blueprint $table) {
                $table->dropForeign(['unit_id']);
                $table->dropColumn('unit_id');
            });
        }

        if (Schema::hasTable('products') && Schema::hasColumn('products', 'unit_id')) {
            Schema::table('products', function (Blueprint $table) {
                $table->dropForeign(['unit_id']);
                $table->dropColumn('unit_id');
            });
        }

        if (Schema::hasTable('sale_items') && Schema::hasColumn('sale_items', 'unit_id')) {
            Schema::table('sale_items', function (Blueprint $table) {
                $table->dropForeign(['unit_id']);
                $table->dropColumn('unit_id');
            });
        }

        if (Schema::hasTable('made_products') && Schema::hasColumn('made_products', 'unit_id')) {
            Schema::table('made_products', function (Blueprint $table) {
                $table->dropForeign(['unit_id']);
                $table->dropColumn('unit_id');
            });
        }

        if (Schema::hasTable('buybacks') && Schema::hasColumn('buybacks', 'unit_id')) {
            Schema::table('buybacks', function (Blueprint $table) {
                $table->dropForeign(['unit_id']);
                $table->dropColumn('unit_id');
            });
        }

        if (Schema::hasTable('gemstones') && Schema::hasColumn('gemstones', 'unit_id')) {
            Schema::table('gemstones', function (Blueprint $table) {
                $table->dropForeign(['unit_id']);
                $table->dropColumn('unit_id');
            });
        }
    }
};
