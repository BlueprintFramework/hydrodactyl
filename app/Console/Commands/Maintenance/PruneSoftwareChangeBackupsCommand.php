<?php

namespace Pterodactyl\Console\Commands\Maintenance;

use Illuminate\Console\Command;
use Pterodactyl\Models\Backup;
use Pterodactyl\Services\ServerOperations\SoftwareChangeBackupService;

/**
 * Deletes expired software-change temporary backups (72h TTL).
 */
class PruneSoftwareChangeBackupsCommand extends Command
{
    protected $signature = 'p:maintenance:prune-software-change-backups';

    protected $description = 'Prune expired software-change temporary backups.';

    public function handle(SoftwareChangeBackupService $softwareChangeBackups): int
    {
        $expired = Backup::query()
            ->where('is_software_change', true)
            ->whereNotNull('expires_at')
            ->where('expires_at', '<', now())
            ->with(['server.user', 'server.node'])
            ->get();

        if ($expired->isEmpty()) {
            $this->info('No expired software-change backups.');

            return self::SUCCESS;
        }

        foreach ($expired as $backup) {
            $softwareChangeBackups->deleteOne($backup, $backup->server?->user);
        }

        $this->info("Submitted prune for {$expired->count()} expired software-change backup(s).");

        return self::SUCCESS;
    }
}
