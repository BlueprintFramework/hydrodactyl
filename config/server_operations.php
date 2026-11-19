<?php

/**
 * Configuration for server operations system.
 *
 * Defines timeouts, cleanup policies, and other operational parameters
 * for long-running server operations like egg changes and reinstalls.
 */

return [
    /*
    |--------------------------------------------------------------------------
    | Operation Timeouts
    |--------------------------------------------------------------------------
    |
    | Maximum execution time (in seconds) for different types of server
    | operations before they are considered timed out and marked as failed.
    |
    */
    'timeouts' => [
        'egg_change' => 1800,      // 30 minutes
        'modpack_install' => 3600, // 60 minutes (many daemon pulls)
        'reinstall' => 1200,       // 20 minutes
        'backup_restore' => 2400,  // 40 minutes
        'default' => 900,          // 15 minutes
        // How long ApplyEggChangeJob waits for Wings to leave "installing"
        // after reinstall() before marking the operation failed.
        'install_wait' => 1800,    // 30 minutes
        // Safety net: stuck "installing" servers older than this (minutes)
        // are flipped to reinstall_failed by the scheduled sweeper.
        'stuck_installing_minutes' => 45,
    ],

    /*
    |--------------------------------------------------------------------------
    | Operation Cleanup
    |--------------------------------------------------------------------------
    |
    | Configuration for automatic cleanup of old completed operations
    | to prevent database bloat and maintain performance.
    |
    */
    'cleanup' => [
        'enabled' => true,      // Enable automatic cleanup
        'retain_days' => 30,    // Days to retain completed operations
        'chunk_size' => 100,    // Records to process per cleanup batch
    ],
];