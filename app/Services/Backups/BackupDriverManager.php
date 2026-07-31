<?php

namespace Pterodactyl\Services\Backups;

use InvalidArgumentException;
use Illuminate\Contracts\Container\Container;
use Pterodactyl\Enums\BackupAdapter;
use Pterodactyl\Contracts\Backup\BackupDriverInterface;
use Pterodactyl\Services\Backups\Drivers\WingsBackupDriver;

class BackupDriverManager
{
    /**
     * Resolved driver instances keyed by adapter name.
     *
     * @var array<string, BackupDriverInterface>
     */
    protected array $drivers = [];

    public function __construct(protected Container $app) {}

    /**
     * Get a backup operations driver for the given adapter name.
     * Defaults to config('backups.default') / APP_BACKUP_DRIVER.
     */
    public function driver(?string $name = null): BackupDriverInterface
    {
        $name = $this->normalizeAdapter($name ?? $this->getDefaultDriver());

        return $this->drivers[$name] ??= $this->resolve($name);
    }

    /**
     * Get the default backup adapter from config (APP_BACKUP_DRIVER).
     */
    public function getDefaultDriver(): string
    {
        return (string) config('backups.default', BackupAdapter::Wings->value);
    }

    /**
     * Normalize legacy / alias adapter names to a canonical value.
     */
    public function normalizeAdapter(string $adapter): string
    {
        return match ($adapter) {
            'elytra', 'local' => BackupAdapter::Wings->value,
            default => $adapter,
        };
    }

    /**
     * Resolve an operations driver for the given storage adapter.
     * All supported adapters use the Wings daemon API; the adapter
     * string is passed through to Wings / S3 as storage metadata.
     */
    protected function resolve(string $adapter): BackupDriverInterface
    {
        return match ($adapter) {
            BackupAdapter::Wings->value,
            BackupAdapter::S3->value,
            BackupAdapter::RusticLocal->value,
            BackupAdapter::RusticS3->value,
            BackupAdapter::Elytra->value => $this->app->make(WingsBackupDriver::class),
            default => throw new InvalidArgumentException("Backup driver [{$adapter}] is not supported."),
        };
    }
}
