<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        switch (DB::connection()->getPdo()->getAttribute(PDO::ATTR_DRIVER_NAME)) {
            case 'pgsql':
                Schema::table('nodes', function (Blueprint $table) {
                    $table->string('daemonType', 16)->default('elytra')->comment('What daemon Type this node uses');
                });

                DB::statement("ALTER TABLE nodes ADD CONSTRAINT nodes_daemontype_check CHECK (\"daemonType\" IN ('wings', 'elytra'))");
                break;
            default:
                Schema::table('nodes', function (Blueprint $table) {
                    $table->enum('daemonType', ['wings', 'elytra'])->default('elytra')->comment('What daemon Type this node uses');
                });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::connection()->getPdo()->getAttribute(PDO::ATTR_DRIVER_NAME) === 'pgsql') {
            DB::statement('ALTER TABLE nodes DROP CONSTRAINT IF EXISTS nodes_daemontype_check');
        }

        Schema::table('nodes', function (Blueprint $table) {
            $table->dropColumn('daemonType');
        });
    }
};
