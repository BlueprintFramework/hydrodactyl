<?php

namespace Pterodactyl\Enums\Daemon;

enum Adapters: string
{
    case ADAPTER_WINGS = 'wings';
    case ADAPTER_WINGS_S3 = 's3';
    case ADAPTER_ELYTRA = 'elytra';
    case ADAPTER_RUSTIC_LOCAL = 'rustic_local';
    case ADAPTER_RUSTIC_S3 = 'rustic_s3';

    // Calagopus Wings specific backup drivers. Values intentionally match
    // BackupAdapter (and the daemon's wire names) so they can be used directly.
    case ADAPTER_DDUP_BAK = 'ddup-bak';
    case ADAPTER_BTRFS = 'btrfs';
    case ADAPTER_ZFS = 'zfs';
    case ADAPTER_RESTIC = 'restic';
    case ADAPTER_PBS = 'proxmox-backup-server';
    case ADAPTER_KOPIA = 'kopia';

    private const ELYTRA = [
        self::ADAPTER_ELYTRA, // NOTE: This is local storage without Rustic
        self::ADAPTER_RUSTIC_LOCAL,
        self::ADAPTER_RUSTIC_S3,
    ];

    private const WINGS = [
        self::ADAPTER_WINGS, // NOTE: This is local storage
        self::ADAPTER_WINGS_S3,
    ];

    private const CALAGOPUS = [
        self::ADAPTER_WINGS, // NOTE: This is local storage
        self::ADAPTER_WINGS_S3,
        self::ADAPTER_DDUP_BAK,
        self::ADAPTER_BTRFS,
        self::ADAPTER_ZFS,
        self::ADAPTER_RESTIC,
        self::ADAPTER_PBS,
        self::ADAPTER_KOPIA,
    ];

    public static function all(): array
    {
        return array_column(self::cases(), 'value', 'value');
    }

    public static function all_sorted(): array
    {
        return [
            'calagopus' => self::all_calagopus(),
            'elytra' => self::all_elytra(),
            'wings' => self::all_wings(),
        ];
    }

    public static function all_elytra(): array
    {
        return array_column(self::ELYTRA, 'value');
    }

    public static function all_wings(): array
    {
        return array_column(self::WINGS, 'value');
    }

    public static function all_calagopus(): array
    {
        return array_column(self::CALAGOPUS, 'value');
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    public static function requiresS3Bucket(string $adapter): bool
    {
        return in_array($adapter, [
            self::ADAPTER_WINGS_S3->value,
            self::ADAPTER_RUSTIC_S3->value,
        ]);
    }

}
