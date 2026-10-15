<?php

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

return new class () extends Migration {
    /**
     * The adapter values that were allowed by the previous (rustic-era) column.
     */
    private const PREVIOUS_VALUES = ['wings', 's3', 'rustic_local', 'rustic_s3'];

    /**
     * Widen backups.disk so it can hold every backup adapter, including the
     * Calagopus drivers (ddup-bak, btrfs, zfs, restic, proxmox-backup-server,
     * kopia). It was an enum/check constrained to the rustic-era values, so
     * MySQL silently truncated any new adapter to an empty string.
     */
    public function up(): void
    {
        $driver = DB::connection()->getPdo()->getAttribute(PDO::ATTR_DRIVER_NAME);

        // Repair rows that the old enum truncated to an empty string so the
        // BackupAdapter cast no longer throws when listing backups.
        DB::table('backups')->where('disk', '')->update(['disk' => 'wings']);

        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE backups DROP CONSTRAINT IF EXISTS backups_disk_check');
        }

        Schema::table('backups', function (Blueprint $table) {
            $table->string('disk')->default('wings')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $driver = DB::connection()->getPdo()->getAttribute(PDO::ATTR_DRIVER_NAME);

        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE backups DROP CONSTRAINT IF EXISTS backups_disk_check');

            Schema::table('backups', function (Blueprint $table) {
                $table->string('disk')->default('wings')->change();
            });

            DB::statement("ALTER TABLE backups ADD CONSTRAINT backups_disk_check CHECK (disk IN ('wings', 's3', 'rustic_local', 'rustic_s3'))");

            return;
        }

        Schema::table('backups', function (Blueprint $table) {
            $table->enum('disk', self::PREVIOUS_VALUES)->default('wings')->change();
        });
    }
};
