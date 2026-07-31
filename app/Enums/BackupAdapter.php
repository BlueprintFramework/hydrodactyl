<?php

namespace Pterodactyl\Enums;

enum BackupAdapter: string
{
    case Wings = 'wings';
    case S3 = 's3';
    /** @deprecated Legacy adapter; treated as Wings for operations. */
    case Elytra = 'elytra';
    case RusticLocal = 'rustic_local';
    case RusticS3 = 'rustic_s3';

    public function isRustic(): bool
    {
        return in_array($this, [self::RusticLocal, self::RusticS3], true);
    }

    public function isLocal(): bool
    {
        return in_array($this, [self::Wings, self::Elytra, self::RusticLocal], true);
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

    /**
     * Adapter string sent to the Wings daemon API.
     */
    public function getDaemonAdapterType(): string
    {
        return match ($this) {
            self::Elytra => self::Wings->value,
            default => $this->value,
        };
    }

    /**
     * @deprecated Use getDaemonAdapterType() instead.
     */
    public function getElytraAdapterType(): string
    {
        return $this->getDaemonAdapterType();
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
