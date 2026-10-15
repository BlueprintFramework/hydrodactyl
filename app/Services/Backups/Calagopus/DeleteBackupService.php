<?php

namespace Pterodactyl\Services\Backups\Calagopus;

use Illuminate\Http\Response;
use Pterodactyl\Models\Backup;
use Pterodactyl\Enums\BackupAdapter;
use GuzzleHttp\Exception\ClientException;
use Illuminate\Database\ConnectionInterface;
use Pterodactyl\Extensions\Backups\BackupManager;
use Pterodactyl\Repositories\Calagopus\DaemonBackupRepository;
use Pterodactyl\Exceptions\Service\Backup\BackupLockedException;
use Pterodactyl\Exceptions\Http\Connection\DaemonConnectionException;

class DeleteBackupService
{
    public function __construct(
        private ConnectionInterface $connection,
        private BackupManager $manager,
        private DaemonBackupRepository $daemonBackupRepository,
    ) {
    }

    /**
     * Deletes a backup from the system. S3 backups are removed directly, all
     * other Calagopus drivers are removed through the daemon.
     *
     * @throws \Throwable
     */
    public function handle(Backup $backup): void
    {
        if ($backup->is_locked && ($backup->is_successful && !is_null($backup->completed_at))) {
            throw new BackupLockedException();
        }

        if ($backup->disk === BackupAdapter::S3) {
            $this->deleteFromS3($backup);

            return;
        }

        $this->connection->transaction(function () use ($backup) {
            try {
                $this->daemonBackupRepository->setServer($backup->server)->delete($backup);
            } catch (DaemonConnectionException $exception) {
                $previous = $exception->getPrevious();
                // Don't fail the request if the daemon responds with a 404, just assume the
                // backup doesn't actually exist and remove its reference from the panel.
                if (!$previous instanceof ClientException || $previous->getResponse()->getStatusCode() !== Response::HTTP_NOT_FOUND) {
                    throw $exception;
                }
            }

            $backup->delete();
        });
    }

    /**
     * @throws \Throwable
     */
    protected function deleteFromS3(Backup $backup): void
    {
        $this->connection->transaction(function () use ($backup) {
            $backup->delete();

            $s3Bucket = $backup->server->node->s3Bucket;
            if (!$s3Bucket) {
                \Log::warning('Cannot delete S3 backup: no S3 bucket configured for node', [
                    'backup_uuid' => $backup->uuid,
                    'node_id' => $backup->server->node_id,
                ]);

                return;
            }

            /** @var \Pterodactyl\Extensions\Filesystem\S3Filesystem $adapter */
            $adapter = $this->manager->createS3Adapter($s3Bucket->toS3Config());

            $adapter->getClient()->deleteObject([
                'Bucket' => $adapter->getBucket(),
                'Key' => sprintf('%s/%s.tar.gz', $backup->server->uuid, $backup->uuid),
            ]);
        });
    }
}
