<?php

namespace Pterodactyl\Services\Backups;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Pterodactyl\Models\Backup;
use Pterodactyl\Models\Server;
use Pterodactyl\Models\User;
use Pterodactyl\Models\Permission;
use Pterodactyl\Services\Backups\ServerStateService;

class BackupCoordinator
{
    public function __construct(
        private BackupDriverManager $driverManager,
        private ServerStateService $serverStateService,
    ) {}

    public function getRequiredPermissions(string $operation): array
    {
        return match ($operation) {
            'index' => [Permission::ACTION_BACKUP_READ],
            'create' => [Permission::ACTION_BACKUP_CREATE],
            'show' => [Permission::ACTION_BACKUP_READ],
            'delete', 'delete_all' => [Permission::ACTION_BACKUP_DELETE],
            'restore' => [Permission::ACTION_BACKUP_RESTORE],
            'download' => [Permission::ACTION_BACKUP_DOWNLOAD],
            default => [],
        };
    }

    /**
     * Validate job/operation payload for backup operations.
     */
    public function validateJobData(array $jobData): array
    {
        $rules = match ($jobData['operation'] ?? '') {
            'create' => [
                'operation' => 'required|string|in:create',
                'adapter' => 'nullable|string',
                'ignored' => 'nullable|string',
                'name' => 'nullable|string|max:255',
                'is_automatic' => 'nullable|boolean',
                'is_locked' => 'nullable|boolean',
                'override' => 'nullable|boolean',
            ],
            'delete' => [
                'operation' => 'required|string|in:delete',
                'backup_uuid' => 'required|string|uuid',
            ],
            'restore' => [
                'operation' => 'required|string|in:restore',
                'backup_uuid' => 'required|string|uuid',
                'truncate_directory' => 'boolean',
            ],
            'download' => [
                'operation' => 'required|string|in:download',
                'backup_uuid' => 'required|string|uuid',
            ],
            'delete_all' => [
                'operation' => 'required|string|in:delete_all',
            ],
            default => throw new \InvalidArgumentException('Invalid or missing operation'),
        };

        $validator = Validator::make($jobData, $rules);

        if ($validator->fails()) {
            throw new \InvalidArgumentException('Invalid job data: ' . implode(', ', $validator->errors()->all()));
        }

        return $validator->validated();
    }

    /**
     * Resolve the active backup adapter from APP_BACKUP_DRIVER / config.
     */
    public function resolveAdapter(?string $requested = null): string
    {
        $adapter = $requested
            ?: $this->driverManager->getDefaultDriver();

        return $this->driverManager->normalizeAdapter($adapter);
    }

    public function create(
        Server $server,
        ?User $user = null,
        ?string $name = null,
        ?string $ignored = null,
        bool $isLocked = false,
        bool $override = false,
        bool $isAutomatic = false,
        ?string $adapter = null,
    ): Backup {
        $this->resolveAdapter($adapter);

        $ignoredFiles = $this->parseIgnoredFiles($ignored ?? '');

        $backup = $this->driverManager->driver($adapter)->create(
            $server,
            $name,
            $ignoredFiles,
            $isLocked,
            $override,
            $isAutomatic,
        );

        try {
            $serverState = $this->serverStateService->captureServerState($server);
            if ($serverState) {
                $backup->update(['server_state' => $serverState]);
            }
        } catch (\Exception $e) {
            Log::warning('Could not capture server state for backup', [
                'backup_uuid' => $backup->uuid,
                'error' => $e->getMessage(),
            ]);
        }

        return $backup->refresh();
    }

    public function delete(Server $server, Backup $backup): void
    {
        $this->driverManager->driver($backup->disk?->value)->delete($backup);
    }

    public function restore(Server $server, Backup $backup, User $user, bool $truncate = false): void
    {
        if (!is_null($server->status)) {
            throw new \InvalidArgumentException('This server is not currently in a state that allows for a backup to be restored.');
        }

        if (!$backup->is_successful && is_null($backup->completed_at)) {
            throw new \InvalidArgumentException('This backup cannot be restored at this time: not completed or failed.');
        }

        $this->driverManager->driver($backup->disk?->value)->restore($backup, $user, $truncate);
    }

    public function download(Backup $backup, User $user): string
    {
        if (!$backup->is_successful) {
            throw new \InvalidArgumentException('Cannot download an incomplete backup.');
        }

        return $this->driverManager->driver($backup->disk?->value)->download($backup, $user);
    }

    public function deleteAll(Server $server): int
    {
        return $this->driverManager->driver()->deleteAll($server);
    }

    /**
     * Prune old automatic backups for a server if the count exceeds the configured limit.
     * Only unlocked automatic backups count toward the limit. Locked backups are preserved indefinitely.
     */
    public function pruneOldAutomaticBackups(Server $server): void
    {
        $limit = (int) config('backups.automatic_backup_limit', 32);

        if ($limit <= 0) {
            return;
        }

        $unlockedAutomaticBackupCount = $server->backups()
            ->where('is_automatic', true)
            ->where('is_successful', true)
            ->where('is_locked', false)
            ->count();

        if ($unlockedAutomaticBackupCount <= $limit) {
            return;
        }

        $excessCount = $unlockedAutomaticBackupCount - $limit;

        $oldBackups = $server->backups()
            ->where('is_automatic', true)
            ->where('is_successful', true)
            ->where('is_locked', false)
            ->orderBy('created_at', 'asc')
            ->limit($excessCount)
            ->get();

        if ($oldBackups->isEmpty()) {
            return;
        }

        $deletedCount = 0;
        $driver = $this->driverManager->driver();

        foreach ($oldBackups as $backup) {
            try {
                $driver->delete($backup);
                $deletedCount++;

                Log::info('Deleted automatic backup due to limit', [
                    'server_id' => $server->id,
                    'backup_uuid' => $backup->uuid,
                    'backup_name' => $backup->name,
                ]);
            } catch (\Exception $e) {
                Log::error('Failed to delete automatic backup during pruning', [
                    'server_id' => $server->id,
                    'backup_uuid' => $backup->uuid,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        $lockedCount = $server->backups()
            ->where('is_automatic', true)
            ->where('is_successful', true)
            ->where('is_locked', true)
            ->count();

        Log::info('Automatic backup pruning completed', [
            'server_id' => $server->id,
            'unlocked_automatic_backup_count' => $unlockedAutomaticBackupCount,
            'locked_automatic_backup_count' => $lockedCount,
            'limit' => $limit,
            'deleted' => $deletedCount,
        ]);
    }

    /**
     * @return string[]
     */
    private function parseIgnoredFiles(string $ignored): array
    {
        if ($ignored === '') {
            return [];
        }

        $files = array_filter(
            array_map('trim', explode("\n", $ignored)),
            fn ($line) => $line !== ''
        );

        return array_values($files);
    }
}
