<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Daemon backends
    |--------------------------------------------------------------------------
    |
    | Daemons are released independently of the panel. Each backend declares
    | where its releases are published (GitHub) and the path of its own
    | remote self-upgrade endpoint, if it has one. The panel reads the latest
    | release tag from the repository to tell whether a node is up to date.
    |
    | `upgrade_endpoint` is a path on the daemon's HTTP API. Leave it null when
    | the daemon has no remote self-upgrade; the panel will only report that an
    | update is available.
    |
    */

    'types' => [
        'wings' => [
            'repository' => 'pterodactyl/wings',
            'upgrade_endpoint' => null,
            'restart_service' => 'wings',
        ],

        'elytra' => [
            'repository' => 'pyrohost/elytra',
            'upgrade_endpoint' => null,
            'restart_service' => 'elytra',
        ],

        'calagopus' => [
            'repository' => 'calagopus/wings',
            'upgrade_endpoint' => '/api/system/upgrade',
            'restart_service' => 'calagopus-wings',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | GitHub API
    |--------------------------------------------------------------------------
    |
    | Optional token to raise the GitHub API rate limit (60 requests/hour
    | without one). Release lookups are cached below so a token is usually
    | unnecessary.
    |
    */

    'github_token' => env('DAEMON_GITHUB_TOKEN'),

    'cache_time' => (int) env('DAEMON_VERSION_CACHE_TIME', 60),
];
