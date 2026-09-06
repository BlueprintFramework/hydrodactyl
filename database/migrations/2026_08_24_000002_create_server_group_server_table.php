<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('server_group_server');

        if (!Schema::hasColumn('servers', 'group_id')) {
            Schema::table('servers', function (Blueprint $table) {
                $table->unsignedBigInteger('group_id')->nullable()->after('owner_id');
            });
        }

        $hasFK = DB::select(
            "SELECT COUNT(*) as cnt FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = ? AND TABLE_NAME = ? AND CONSTRAINT_NAME = ? AND CONSTRAINT_TYPE = 'FOREIGN KEY'",
            [config('database.connections.mariadb.database', 'panel'), 'servers', 'servers_group_id_foreign']
        );

        if (empty($hasFK) || ($hasFK[0]->cnt ?? 0) == 0) {
            Schema::table('servers', function (Blueprint $table) {
                $table->foreign('group_id')->references('id')->on('server_groups')->onDelete('set null');
            });
        }
    }

    public function down(): void
    {
        Schema::table('servers', function (Blueprint $table) {
            if (Schema::hasColumn('servers', 'group_id')) {
                $table->dropForeign(['group_id']);
                $table->dropColumn('group_id');
            }
        });

        Schema::create('server_group_server', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('server_group_id');
            $table->unsignedInteger('server_id');
            $table->unsignedInteger('sort_order')->default(0);

            $table->foreign('server_group_id')->references('id')->on('server_groups')->onDelete('cascade');
            $table->foreign('server_id')->references('id')->on('servers')->onDelete('cascade');
            $table->unique(['server_group_id', 'server_id']);
            $table->index(['server_group_id', 'sort_order']);
        });
    }
};
