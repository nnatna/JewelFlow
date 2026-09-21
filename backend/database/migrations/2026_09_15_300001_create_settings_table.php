<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->string('key', 100)->unique();
            $table->text('value')->nullable();
            $table->string('group', 50)->default('general');
            $table->timestamps();
        });

        // Insert initial default settings
        DB::table('settings')->insert([
            ['key' => 'language',             'value' => 'km',    'group' => 'general',    'created_at' => now(), 'updated_at' => now()],
            ['key' => 'calculator_tier',      'value' => 'Gold',  'group' => 'calculator', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'alert_low_stock',      'value' => 'true',  'group' => 'inventory',  'created_at' => now(), 'updated_at' => now()],
            ['key' => 'low_stock_threshold',  'value' => '5',     'group' => 'inventory',  'created_at' => now(), 'updated_at' => now()],
            ['key' => 'gold_tax_rate',        'value' => '7.5',   'group' => 'pos',        'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};
