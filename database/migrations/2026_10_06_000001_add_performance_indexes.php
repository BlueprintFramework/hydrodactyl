<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class AddPerformanceIndexes extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasIndex('activity_logs', 'activity_logs_timestamp_index')) {
            Schema::table('activity_logs', function (Blueprint $table) {
                $table->index('timestamp');
            });
        }

        if (!Schema::hasIndex('servers', 'servers_status_index')) {
            Schema::table('servers', function (Blueprint $table) {
                $table->index('status');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('activity_logs', function (Blueprint $table) {
            $table->dropIndex('activity_logs_timestamp_index');
        });

        Schema::table('servers', function (Blueprint $table) {
            $table->dropIndex('servers_status_index');
        });
    }
}
