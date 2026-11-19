<?php

namespace Pterodactyl\Services\ServerOperations;

use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use Pterodactyl\Models\Backup;
use Pterodactyl\Models\Server;
use Pterodactyl\Models\User;
use Pterodactyl\Services\Backups\Calagopus\DeleteBackupService as CalagopusDeleteBackupService;
use Pterodactyl\Services\Backups\Wings\DeleteBackupService as WingsDeleteBackupService;
use Pterodactyl\Services\Elytra\ElytraJobService;

/**
 * Shared helpers for the single 72h software-change / modpack rollback slot.
 *
 * Daemon-aware delete: Wings and Calagopus use their DeleteBackupService;
 * Elytra submits a backup_delete job (and falls back to a soft DB delete if
 * the job cannot be submitted).
 */
class SoftwareChangeBackupService
{
    public function __construct(
        private WingsDeleteBackupService $wingsDelete,
        private CalagopusDeleteBackupService $calagopusDelete,
        private ElytraJobService $elytraJobService,
    ) {
    }

    /**
     * Drop every prior software-change temporary backup for the server so the
     * next change replaces the 72h rollback slot instead of stacking forever.
     */
    public function purgePrior(Server $server, ?User $actor = null): void
    {
        $prior = Backup::query()
            ->where('server_id', $server->id)
            ->where('is_software_change', true)
            ->get();

        foreach ($prior as $backup) {
            $this->deleteOne($backup, $actor);
        }
    }

    /**
     * Tag the backup created for this change by its exact name (Elytra creates
     * the Backup row asynchronously during the job — matching by name avoids
     * mis-tagging a concurrent user backup).
     */
    public function markByName(Server $server, string $backupName): void
    {
        $backup = Backup::query()
            ->where('server_id', $server->id)
            ->where('name', $backupName)
            ->where('is_software_change', false)
            ->orderByDesc('id')
            ->first();

        if (!$backup) {
            return;
        }

        $backup->update([
            'is_software_change' => true,
            'expires_at' => Carbon::now()->addHours(72),
            'is_locked' => false,
        ]);
    }

    /**
     * Apply the 72h software-change markers to an already-created Wings backup.
     */
    public function markBackup(Backup $backup): void
    {
        $backup->update([
            'is_software_change' => true,
            'expires_at' => Carbon::now()->addHours(72),
            'is_locked' => false,
        ]);
    }

    /**
     * Delete a single backup using the daemon-appropriate path.
     */
    public function deleteOne(Backup $backup, ?User $actor = null): void
    {
        $server = $backup->server;
        $daemon = strtolower((string) ($server->node->daemonType ?? 'wings'));

        try {
            if ($daemon === 'elytra') {
                $this->deleteElytra($backup, $actor ?? $server->user);
            } elseif ($daemon === 'calagopus') {
                $this->calagopusDelete->handle($backup);
            } else {
                $this->wingsDelete->handle($backup);
            }
        } catch (\Throwable $e) {
            Log::warning('Failed to delete software-change backup', [
                'backup_id' => $backup->id,
                'server_id' => $server->id,
                'daemon' => $daemon,
                'error' => $e->getMessage(),
            ]);
        }
    }

    private function deleteElytra(Backup $backup, User $actor): void
    {
        try {
            $this->elytraJobService->submitJob(
                $backup->server,
                'backup_delete',
                [
                    'operation' => 'delete',
                    'backup_uuid' => $backup->uuid,
                    'snapshot_id' => $backup->snapshot_id,
                ],
                $actor,
            );
        } catch (\Throwable $e) {
            // Job submission failed — still drop the panel row so the slot frees.
            Log::warning('Elytra backup_delete job failed; soft-deleting panel row', [
                'backup_id' => $backup->id,
                'error' => $e->getMessage(),
            ]);
            $backup->delete();
        }
    }
}
