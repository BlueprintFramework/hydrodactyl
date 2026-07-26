<?php

namespace Pterodactyl\Services\Backups\Drivers;

use Illuminate\Http\Response;
use Pterodactyl\Enums\BackupAdapter;
use Pterodactyl\Models\User;
use Pterodactyl\Models\Backup;
use Pterodactyl\Models\Server;
use GuzzleHttp\Exception\ClientException;
use Illuminate\Database\ConnectionInterface;
use Pterodactyl\Contracts\Backup\BackupDriverInterface;
use Pterodactyl\Services\Backups\DownloadLinkService;
use Pterodactyl\Services\Backups\Wings\DeleteBackupService;
use Pterodactyl\Services\Backups\Wings\InitiateBackupService;
use Pterodactyl\Repositories\Wings\DaemonBackupRepository;
use Pterodactyl\Exceptions\Http\Connection\DaemonConnectionException;

class WingsBackupDriver implements BackupDriverInterface
{
    public function __construct(
        private InitiateBackupService $initiateBackupService,
        private DeleteBackupService $deleteBackupService,
        private DownloadLinkService $downloadLinkService,
        private DaemonBackupRepository $daemonBackupRepository,
        private ConnectionInterface $connection,
    ) {}

    public function create(
        Server $server,
        ?string $name = null,
        ?array $ignoredFiles = null,
        bool $isLocked = false,
        bool $override = false,
        bool $isAutomatic = false,
    ): Backup {
        $backup = $this->initiateBackupService
            ->setIsLocked($isLocked)
            ->setIgnoredFiles($ignoredFiles)
            ->handle($server, $name, $override);

        if ($isAutomatic && !$backup->is_automatic) {
            $backup->update(['is_automatic' => true]);
        }

        return $backup->refresh();
    }

    public function delete(Backup $backup): void
    {
        $this->deleteBackupService->handle($backup);
    }

    public function restore(Backup $backup, User $user, bool $truncate = false): void
    {
        $server = $backup->server;

        if ($backup->disk === BackupAdapter::S3) {
            $url = $this->downloadLinkService->handle($backup, $user);
        }

        $server->update(['status' => Server::STATUS_RESTORING_BACKUP]);

        $this->daemonBackupRepository
            ->setServer($server)
            ->restore($backup, $url ?? null, $truncate);
    }

    public function download(Backup $backup, User $user): string
    {
        return $this->downloadLinkService->handle($backup, $user);
    }

    public function deleteAll(Server $server): int
    {
        return $this->connection->transaction(function () use ($server) {
            $deleted = 0;

            foreach ($server->backups()->get() as $backup) {
                try {
                    $this->deleteBackupService->handle($backup);
                    $deleted++;
                } catch (DaemonConnectionException $exception) {
                    $previous = $exception->getPrevious();
                    if ($previous instanceof ClientException && $previous->getResponse()->getStatusCode() === Response::HTTP_NOT_FOUND) {
                        $backup->delete();
                        $deleted++;
                        continue;
                    }

                    throw $exception;
                }
            }

            $server->update(['repository_backup_bytes' => 0]);

            return $deleted;
        });
    }
}
