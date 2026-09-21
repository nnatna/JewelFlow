<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            if (! Schema::hasColumn('customers', 'total_spent')) {
                $table->decimal('total_spent', 14, 2)->default(0)->after('loyalty_points');
            }
            if (! Schema::hasColumn('customers', 'tier')) {
                $table->string('tier', 30)->default('Standard')->after('total_spent');
            }
            if (! Schema::hasColumn('customers', 'discount_rate')) {
                $table->decimal('discount_rate', 5, 2)->default(0.00)->after('tier');
            }
        });
    }

    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->dropColumn(['total_spent', 'tier', 'discount_rate']);
        });
    }
};
