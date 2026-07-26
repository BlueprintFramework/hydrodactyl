<?php

namespace Pterodactyl\Contracts\Backup;

use Pterodactyl\Models\User;
use Pterodactyl\Models\Backup;
use Pterodactyl\Models\Server;

interface BackupDriverInterface
{
    /**
     * Create a new backup for the given server.
     *
     * @param  string[]|null  $ignoredFiles
     */
    public function create(
        Server $server,
        ?string $name = null,
        ?array $ignoredFiles = null,
        bool $isLocked = false,
        bool $override = false,
        bool $isAutomatic = false,
    ): Backup;

    /**
     * Delete a backup from storage and the database.
     */
    public function delete(Backup $backup): void;

    /**
     * Restore a backup onto the server.
     */
    public function restore(Backup $backup, User $user, bool $truncate = false): void;

    /**
     * Return a download URL for the backup.
     */
    public function download(Backup $backup, User $user): string;

    /**
     * Delete all backups for a server.
     */
    public function deleteAll(Server $server): int;
}
