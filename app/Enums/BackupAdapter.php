<?php

namespace Pterodactyl\Enums;

enum BackupAdapter: string
{
    case Wings = 'wings';
    case S3 = 's3';
    case Elytra = 'elytra';
    case RusticLocal = 'rustic_local';
    case RusticS3 = 'rustic_s3';

    // Calagopus Wings specific backup drivers. The string values match the
    // daemon's own backup adapter wire names so they can be sent verbatim.
    case DdupBak = 'ddup-bak';
    case Btrfs = 'btrfs';
    case Zfs = 'zfs';
    case Restic = 'restic';
    case Pbs = 'proxmox-backup-server';
    case Kopia = 'kopia';

    public function isRustic(): bool
    {
        return in_array($this, [self::RusticLocal, self::RusticS3], true);
    }

    /**
     * Whether the driver stores its snapshots locally on the node.
     */
    public function isLocal(): bool
    {
        return in_array($this, [
            self::Wings,
            self::Elytra,
            self::RusticLocal,
            self::DdupBak,
            self::Btrfs,
            self::Zfs,
        ], true);
    }

    /**
     * Whether this adapter belongs to the Calagopus Wings daemon.
     */
    public function isCalagopus(): bool
    {
        return in_array($this, [
            self::DdupBak,
            self::Btrfs,
            self::Zfs,
            self::Restic,
            self::Pbs,
            self::Kopia,
        ], true);
    }

    public function requiresS3Bucket(): bool
    {
        return in_array($this, [self::S3, self::RusticS3], true);
    }

    public function getRepositoryType(): ?string
    {
        return match ($this) {
            self::RusticLocal => 'local',
            self::RusticS3 => 's3',
            default => null,
        };
    }

    public function getElytraAdapterType(): string
    {
        return match ($this) {
            self::Elytra => 'elytra',
            self::S3 => 's3',
            self::RusticLocal => 'rustic_local',
            self::RusticS3 => 'rustic_s3',
            default => $this->value,
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
