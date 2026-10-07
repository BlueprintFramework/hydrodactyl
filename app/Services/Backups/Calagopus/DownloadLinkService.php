<?php

namespace Pterodactyl\Services\Backups\Calagopus;

use Carbon\CarbonImmutable;
use Pterodactyl\Models\User;
use Pterodactyl\Models\Backup;
use Pterodactyl\Enums\BackupAdapter;
use Pterodactyl\Enums\Daemon\JwtScope;
use Pterodactyl\Services\Nodes\NodeJWTService;
use Pterodactyl\Extensions\Backups\BackupManager;

class DownloadLinkService
{
    public function __construct(private BackupManager $backupManager, private NodeJWTService $jwtService)
    {
    }

    /**
     * Returns the URL that allows a backup to be downloaded by a user or by the
     * Calagopus daemon itself. All non-S3 drivers are streamed back through the
     * daemon using a short-lived JWT.
     */
    public function handle(Backup $backup, User $user): string
    {
        if ($backup->disk === BackupAdapter::S3) {
            return $this->getS3BackupUrl($backup);
        }

        $token = $this->jwtService
            ->setExpiresAt(CarbonImmutable::now()->addMinutes(15))
            ->setUser($user)
            ->setClaims([
                'backup_uuid' => $backup->uuid,
                'server_uuid' => $backup->server->uuid,
                'backup_disk' => $backup->disk->value,
            ])
            ->setScopes(JwtScope::BackupDownload)
            ->handle($backup->server->node, $user->id . $backup->server->uuid);

        return sprintf('%s/download/backup?token=%s', $backup->server->node->getConnectionAddress(), $token->toString());
    }

    /**
     * Returns a signed URL that allows us to download a file directly out of a
     * non-public S3 bucket by using a signed URL.
     */
    protected function getS3BackupUrl(Backup $backup): string
    {
        $s3Bucket = $backup->server->node->s3Bucket;
        if (!$s3Bucket) {
            throw new \RuntimeException('No S3 bucket configured for the node associated with this backup.');
        }

        /** @var \Pterodactyl\Extensions\Filesystem\S3Filesystem $adapter */
        $adapter = $this->backupManager->createS3Adapter($s3Bucket->toS3Config());

        $request = $adapter->getClient()->createPresignedRequest(
            $adapter->getClient()->getCommand('GetObject', [
                'Bucket' => $adapter->getBucket(),
                'Key' => sprintf('%s/%s.tar.gz', $backup->server->uuid, $backup->uuid),
                'ContentType' => 'application/x-gzip',
            ]),
            CarbonImmutable::now()->addMinutes(5)
        );

        return $request->getUri()->__toString();
    }
}
