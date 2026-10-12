<?php

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

return new class () extends Migration {
    /**
     * Allow the "calagopus" daemon type on nodes.
     */
    public function up(): void
    {
        $driver = DB::connection()->getPdo()->getAttribute(PDO::ATTR_DRIVER_NAME);

        switch ($driver) {
            case 'pgsql':
                DB::statement('ALTER TABLE nodes DROP CONSTRAINT IF EXISTS nodes_daemontype_check');
                DB::statement("ALTER TABLE nodes ADD CONSTRAINT nodes_daemontype_check CHECK (\"daemonType\" IN ('wings', 'elytra', 'calagopus'))");
                break;
            case 'sqlite':
                Schema::table('nodes', function (Blueprint $table) {
                    $table->enum('daemonType', ['wings', 'elytra', 'calagopus'])->default('wings')->change();
                });
                break;
            default:
                DB::statement("ALTER TABLE nodes MODIFY COLUMN daemonType ENUM('wings', 'elytra', 'calagopus') NOT NULL DEFAULT 'wings'");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $driver = DB::connection()->getPdo()->getAttribute(PDO::ATTR_DRIVER_NAME);

        switch ($driver) {
            case 'pgsql':
                DB::statement('ALTER TABLE nodes DROP CONSTRAINT IF EXISTS nodes_daemontype_check');
                DB::statement("ALTER TABLE nodes ADD CONSTRAINT nodes_daemontype_check CHECK (\"daemonType\" IN ('wings', 'elytra'))");
                break;
            case 'sqlite':
                Schema::table('nodes', function (Blueprint $table) {
                    $table->enum('daemonType', ['wings', 'elytra'])->default('wings')->change();
                });
                break;
            default:
                DB::statement("ALTER TABLE nodes MODIFY COLUMN daemonType ENUM('wings', 'elytra') NOT NULL DEFAULT 'wings'");
        }
    }
};
