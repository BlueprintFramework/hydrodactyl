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
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('custom_domains')->default(false)->comment('Whether servers owned by this user may use custom domains');
        });

        Schema::create('server_custom_domains', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('server_id'); // Match servers table increments('id')
            $table->unsignedInteger('allocation_id')->nullable(); // Null follows the primary allocation
            $table->string('hostname')->unique(); // play.example.com
            $table->string('zone_name'); // example.com
            $table->text('dns_config'); // encrypted provider configuration
            $table->json('dns_records'); // Array of DNS record IDs from the provider
            $table->timestamps();

            $table->foreign('server_id')->references('id')->on('servers')->onDelete('cascade');

            $table->index(['allocation_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('server_custom_domains');

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('custom_domains');
        });
    }
};
