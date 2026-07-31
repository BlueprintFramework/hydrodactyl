<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('database_hosts', function (Blueprint $table) {
            $table->string('type', 32)->default('mysql')->after('password');
        });

        Schema::table('databases', function (Blueprint $table) {
            $table->string('type', 32)->default('mysql')->after('password');
            $table->json('connection_details')->nullable()->after('type');
        });
    }

    public function down(): void
    {
        Schema::table('databases', function (Blueprint $table) {
            $table->dropColumn(['type', 'connection_details']);
        });

        Schema::table('database_hosts', function (Blueprint $table) {
            $table->dropColumn('type');
        });
    }
};
