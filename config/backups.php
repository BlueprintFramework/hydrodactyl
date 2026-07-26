<?php

use Pterodactyl\Enums\BackupAdapter;
use Pterodactyl\Enums;

return [
    // The backup driver to use for this Panel instance. All client generated server backups
    // will be stored in this location by default. It is possible to change this once backups
    // have been made, without losing data.
    // Options: wings, s3, rustic_local, rustic_s3
    // Legacy value "elytra" is accepted and treated as wings.
    'default' => env('APP_BACKUP_DRIVER', BackupAdapter::Wings->value),

    // Configuration for each backup disk adapter. These can be overridden at runtime
    // by database-stored S3 bucket records configured in the admin panel.
    'disks' => [
        's3' => [
            'adapter' => 's3',
            'key' => env('S3_BACKUP_ACCESS_KEY_ID'),
            'secret' => env('S3_BACKUP_SECRET_ACCESS_KEY'),
            'bucket' => env('S3_BACKUP_BUCKET'),
            'region' => env('S3_BACKUP_REGION', 'us-east-1'),
            'endpoint' => env('S3_BACKUP_ENDPOINT'),
            'use_path_style_endpoint' => env('S3_BACKUP_USE_PATH_STYLE_ENDPOINT', false),
            'storage_class' => env('S3_BACKUP_STORAGE_CLASS'),
        ],

        'rustic_s3' => [
            'adapter' => 'rustic_s3',
            'key' => env('RUSTIC_S3_ACCESS_KEY_ID'),
            'secret' => env('RUSTIC_S3_SECRET_ACCESS_KEY'),
            'bucket' => env('RUSTIC_S3_BUCKET'),
            'region' => env('RUSTIC_S3_REGION', 'us-east-1'),
            'endpoint' => env('RUSTIC_S3_ENDPOINT'),
            'force_path_style' => env('RUSTIC_S3_FORCE_PATH_STYLE', false),
            'prefix' => env('RUSTIC_S3_PREFIX', 'rustic-repos/'),
        ],
    ],

    // This value is used to determine the lifespan of UploadPart presigned urls that wings
    // uses to upload backups to S3 storage.  Value is in minutes, so this would default to an hour.
    'presigned_url_lifespan' => env('BACKUP_PRESIGNED_URL_LIFESPAN', 60),

    // This value defines the maximal size of a single part for the S3 multipart upload during backups
    // The maximal part size must be given in bytes. The default value is 5GB.
    // Note that 5GB is the maximum for a single part when using AWS S3.
    'max_part_size' => env('BACKUP_MAX_PART_SIZE', 5 * 1024 * 1024 * 1024),

    // The time to wait before automatically failing a backup, time is in minutes and defaults
    // to 6 hours.  To disable this feature, set the value to `0`.
    'prune_age' => env('BACKUP_PRUNE_AGE', 360),

    // The maximum number of unlocked automatic backups to keep per server. When this limit is
    // exceeded, the oldest unlocked automatic backups will be automatically deleted. Locked
    // automatic backups do not count toward this limit and are preserved indefinitely.
    // Set to 0 to disable automatic pruning. Defaults to 32.
    'automatic_backup_limit' => env('BACKUP_AUTOMATIC_LIMIT', 32),
];
