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
        Schema::table('nodes', function (Blueprint $table) {
            $table->boolean('custom_domains_enabled')->default(true)->comment('Whether servers on this node may use domains added by users');
        });

        Schema::table('servers', function (Blueprint $table) {
            $table->boolean('custom_domains_enabled')->default(true)->comment('Whether this server may use domains added by users');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('servers', function (Blueprint $table) {
            $table->dropColumn('custom_domains_enabled');
        });

        Schema::table('nodes', function (Blueprint $table) {
            $table->dropColumn('custom_domains_enabled');
        });
    }
};
