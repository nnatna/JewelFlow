<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('sales', 'status')) {
            Schema::table('sales', function (Blueprint $table) {
                $table->enum('status', ['pending', 'completed', 'cancelled'])->default('completed')->after('sale_date');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('sales', 'status')) {
            Schema::table('sales', function (Blueprint $table) {
                $table->dropColumn('status');
            });
        }
    }
};
