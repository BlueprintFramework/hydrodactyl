<?php

namespace Pterodactyl\Services\Backups\Calagopus;

use Ramsey\Uuid\Uuid;
use Carbon\CarbonImmutable;
use Webmozart\Assert\Assert;
use Pterodactyl\Models\Backup;
use Pterodactyl\Models\Server;
use Pterodactyl\Enums\BackupAdapter;
use Illuminate\Database\ConnectionInterface;
use Pterodactyl\Extensions\Backups\BackupManager;
use Pterodactyl\Repositories\Eloquent\BackupRepository;
use Pterodactyl\Repositories\Calagopus\DaemonBackupRepository;
use Pterodactyl\Exceptions\Service\Backup\TooManyBackupsException;
use Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException;

/**
 * Initiates a backup on a Calagopus Wings node. Unlike the stock Wings service
 * this accepts any of Calagopus' backup drivers as the node's backup disk.
 */
class InitiateBackupService
{
    private ?array $ignoredFiles;

    private bool $isLocked = false;

    public function __construct(
        private BackupRepository $repository,
        private ConnectionInterface $connection,
        private DaemonBackupRepository $daemonBackupRepository,
        private DeleteBackupService $deleteBackupService,
        private BackupManager $backupManager,
    ) {
    }

    public function setIsLocked(bool $isLocked): self
    {
        $this->isLocked = $isLocked;

        return $this;
    }

    /**
     * @param string[]|null $ignored
     */
    public function setIgnoredFiles(?array $ignored): self
    {
        if (is_array($ignored)) {
            foreach ($ignored as $value) {
                Assert::string($value);
            }
        }

        $this->ignoredFiles = is_null($ignored) ? [] : array_filter($ignored, function ($value) {
            return strlen($value) > 0;
        });

        return $this;
    }

    /**
     * @throws \Throwable
     * @throws TooManyBackupsException
     * @throws TooManyRequestsHttpException
     */
    public function handle(Server $server, ?string $name = null, bool $override = false): Backup
    {
        $limit = config('backups.throttles.limit');
        $period = config('backups.throttles.period');
        if ($period > 0) {
            $previous = $this->repository->getBackupsGeneratedDuringTimespan($server->id, $period);
            if ($previous->count() >= $limit) {
                $message = sprintf('Only %d backups may be generated within a %d second span of time.', $limit, $period);

                throw new TooManyRequestsHttpException((int) CarbonImmutable::now()->diffInSeconds($previous->last()->created_at->addSeconds($period)), $message);
            }
        }

        // Check if the server has reached or exceeded its backup limit.
        $successful = $this->repository->getNonFailedBackups($server);
        $successfulCount = $successful->count();
        if ($server->backup_limit == null) {
            $server->backup_limit = $successfulCount + 1;
        }
        if (!$server->backup_limit || $successfulCount >= $server->backup_limit) {
            if ($server->backup_limit == null) {
                $server->backup_limit = 12;
            }

            if (!$override || $server->backup_limit <= 0) {
                throw new TooManyBackupsException($server->backup_limit);
            }

            /** @var Backup $oldest */
            $oldest = $successful->where('is_locked', false)->orderBy('created_at')->first();
            if (!$oldest) {
                throw new TooManyBackupsException($server->backup_limit);
            }

            $this->deleteBackupService->handle($oldest);
        }

        return $this->connection->transaction(function () use ($server, $name) {
            $adapter = $this->resolveAdapter($server);

            /** @var Backup $backup */
            $backup = $this->repository->create([
                'server_id' => $server->id,
                'uuid' => Uuid::uuid4()->toString(),
                'name' => trim($name) ?: sprintf('Backup at %s', CarbonImmutable::now()->toDateTimeString()),
                'ignored_files' => array_values($this->ignoredFiles ?? []),
                'disk' => $adapter->value,
                'is_locked' => $this->isLocked,
            ], true, true);

            $this->daemonBackupRepository->setServer($server)
                ->setBackupAdapter($adapter->value)
                ->backup($backup);

            return $backup;
        });
    }

    /**
     * Resolve the node's configured backup disk to a Calagopus-supported
     * adapter, falling back to the local wings driver when it isn't set.
     */
    private function resolveAdapter(Server $server): BackupAdapter
    {
        $disk = BackupAdapter::tryFrom($server->node->backupDisk ?? '');

        // Only the adapters Calagopus understands may be used on a Calagopus node.
        return match ($disk) {
            BackupAdapter::Wings,
            BackupAdapter::S3,
            BackupAdapter::DdupBak,
            BackupAdapter::Btrfs,
            BackupAdapter::Zfs,
            BackupAdapter::Restic,
            BackupAdapter::Pbs,
            BackupAdapter::Kopia => $disk,
            default => BackupAdapter::Wings,
        };
    }
}
