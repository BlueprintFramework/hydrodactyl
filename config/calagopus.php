<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Calagopus Wings Configuration
    |--------------------------------------------------------------------------
    |
    | These values are merged into the generated node configuration that is
    | handed to a Calagopus Wings node (see Models\Daemons\Calagopus). Every
    | option here maps 1:1 onto the "system.backups" block documented at
    | https://calagopus.com/docs/wings/configuration and can be overridden per
    | panel with the corresponding environment variable.
    |
    | The daemon also accepts these values locally in its own config.yml; the
    | values emitted here are the panel-managed defaults.
    |
    */

    'backups' => [
        // Disk read/write rate limits (MiB/s) applied while creating/restoring
        // backups. 0 means unlimited.
        'write_limit' => (int) env('CALAGOPUS_BACKUP_WRITE_LIMIT', 0),
        'read_limit' => (int) env('CALAGOPUS_BACKUP_READ_LIMIT', 0),

        // best_speed, good_speed, good_compression or best_compression.
        'compression_level' => env('CALAGOPUS_BACKUP_COMPRESSION_LEVEL', 'best_speed'),

        // Allow users to browse backup contents through the file manager.
        'mounting' => [
            'enabled' => (bool) env('CALAGOPUS_BACKUP_MOUNTING_ENABLED', true),
            'path' => env('CALAGOPUS_BACKUP_MOUNTING_PATH', '.backups'),
        ],

        // Local "wings" driver (tar/zip/7z archives).
        'wings' => [
            'create_threads' => (int) env('CALAGOPUS_BACKUP_WINGS_CREATE_THREADS', 4),
            'restore_threads' => (int) env('CALAGOPUS_BACKUP_WINGS_RESTORE_THREADS', 4),
            'archive_format' => env('CALAGOPUS_BACKUP_WINGS_ARCHIVE_FORMAT', 'tar_gz'),
        ],

        // S3 driver.
        's3' => [
            'create_threads' => (int) env('CALAGOPUS_BACKUP_S3_CREATE_THREADS', 4),
            'streaming' => (bool) env('CALAGOPUS_BACKUP_S3_STREAMING', true),
            'part_upload_timeout' => (int) env('CALAGOPUS_BACKUP_S3_PART_UPLOAD_TIMEOUT', 7200),
            'retry_limit' => (int) env('CALAGOPUS_BACKUP_S3_RETRY_LIMIT', 10),
        ],

        // ddup-bak driver.
        'ddup_bak' => [
            'create_threads' => (int) env('CALAGOPUS_BACKUP_DDUP_BAK_CREATE_THREADS', 4),
            'compression_format' => env('CALAGOPUS_BACKUP_DDUP_BAK_COMPRESSION_FORMAT', 'zstd'),
        ],

        // restic driver.
        'restic' => [
            'repository' => env('CALAGOPUS_BACKUP_RESTIC_REPOSITORY', ''),
            'password_file' => env('CALAGOPUS_BACKUP_RESTIC_PASSWORD_FILE', ''),
            'retry_lock_seconds' => (int) env('CALAGOPUS_BACKUP_RESTIC_RETRY_LOCK_SECONDS', 60),
            'environment' => [],
        ],

        // btrfs driver.
        'btrfs' => [
            'restore_threads' => (int) env('CALAGOPUS_BACKUP_BTRFS_RESTORE_THREADS', 4),
            'create_read_only' => (bool) env('CALAGOPUS_BACKUP_BTRFS_CREATE_READ_ONLY', true),
        ],

        // zfs driver.
        'zfs' => [
            'restore_threads' => (int) env('CALAGOPUS_BACKUP_ZFS_RESTORE_THREADS', 4),
        ],

        // Proxmox Backup Server driver.
        'pbs' => [
            'create_threads' => (int) env('CALAGOPUS_BACKUP_PBS_CREATE_THREADS', 4),
            'download_concurrency' => (int) env('CALAGOPUS_BACKUP_PBS_DOWNLOAD_CONCURRENCY', 4),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Block IO (blkio) Weight
    |--------------------------------------------------------------------------
    |
    | The panel normally forwards a server's block-IO weight to the daemon. On
    | cgroup v2 hosts the "io" controller is frequently not delegated to the
    | rootless container engine (Podman/crun), and Calagopus then fails to create
    | any container with "open `io.weight` for writing: No such file or
    | directory". Omit the value by default so containers can start; set this to
    | false on a rootful host where blkio weights are actually enforced.
    |
    */
    'omit_io_weight' => (bool) env('CALAGOPUS_OMIT_IO_WEIGHT', true),

    /*
    |--------------------------------------------------------------------------
    | Additional Calagopus API/System Options
    |--------------------------------------------------------------------------
    |
    | A curated subset of the daemon's added options that the panel is happy to
    | standardise across nodes. Anything not listed here keeps the daemon's own
    | default and can still be tuned directly in the node's config.yml.
    |
    */

    'api' => [
        'send_offline_server_logs' => (bool) env('CALAGOPUS_API_SEND_OFFLINE_SERVER_LOGS', false),
        'directory_entry_limit' => (int) env('CALAGOPUS_API_DIRECTORY_ENTRY_LIMIT', 10000),
        'file_copy_threads' => (int) env('CALAGOPUS_API_FILE_COPY_THREADS', 4),
        'file_delete_threads' => (int) env('CALAGOPUS_API_FILE_DELETE_THREADS', 2),
        'file_compression_threads' => (int) env('CALAGOPUS_API_FILE_COMPRESSION_THREADS', 2),
        'file_decompression_threads' => (int) env('CALAGOPUS_API_FILE_DECOMPRESSION_THREADS', 4),
        'file_search_threads' => (int) env('CALAGOPUS_API_FILE_SEARCH_THREADS', 4),
    ],
];
