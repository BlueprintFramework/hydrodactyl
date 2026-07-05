<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Marketplace (Plugin & Mod Installer)
    |--------------------------------------------------------------------------
    |
    | Configuration for the native plugin/mod installer available to Minecraft
    | servers. The panel proxies marketplace searches through itself so that a
    | correct User-Agent can be sent, responses can be cached, and the browser
    | never has to deal with CORS.
    |
    | Actual file installation is performed by the existing per-daemon
    | "pull file" mechanism (POST /files/pull), which downloads the resolved
    | URL directly on the daemon and writes it into the egg's mods/plugins
    | folder.
    |
    */

    'marketplace' => [
        'timeout' => (int) env('MARKETPLACE_TIMEOUT', 15),
        'cache_ttl' => (int) env('MARKETPLACE_CACHE_TTL', 120),

        'sources' => [
            'modrinth' => [
                'enabled' => (bool) env('MARKETPLACE_MODRINTH_ENABLED', true),
                'base_url' => 'https://api.modrinth.com/v2',
                'web_url' => 'https://modrinth.com',
                // CDN hosts a resolved download URL is permitted to point at.
                // Anything else (loopback, RFC1918, metadata endpoints, etc.) is
                // rejected before the URL ever reaches the daemon — see
                // AbstractMarketplaceSource::assertSafeDownloadUrl().
                'download_hosts' => ['cdn.modrinth.com', 'cdn-raw.modrinth.com', 'github.com', 'raw.githubusercontent.com'],
            ],

            // Plugin-only sources.
            'hangar' => [
                // PaperMC's plugin platform (https://hangar.papermc.io). Always
                // enabled — it is a public, keyless API.
                'enabled' => (bool) env('MARKETPLACE_HANGAR_ENABLED', true),
                'base_url' => 'https://hangar.papermc.io/api/v1',
                'web_url' => 'https://hangar.papermc.io',
                // CDN serving project avatars. The projects list endpoint omits
                // avatar data, but avatars are addressable by numeric project id
                // at a stable CDN path — see HangarSource::iconUrl().
                'cdn_url' => 'https://hangarcdn.papermc.io',
                // Download endpoints redirect (302) to the real artifact, so we
                // allowlist the hangar host and let the daemon follow the redirect.
                'download_hosts' => ['hangar.papermc.io'],
            ],

            'spiget' => [
                // Spigot resource API (https://spiget.org). Keyless.
                'enabled' => (bool) env('MARKETPLACE_SPIGET_ENABLED', true),
                'base_url' => 'https://api.spiget.org/v2',
                'web_url' => 'https://www.spigotmc.org',
                'download_hosts' => ['api.spiget.org'],
            ],
        ],

        // Destination folder written for each content type. Mods always land in
        // the loader's "mods" directory (Fabric/Forge/NeoForge/Quilt); plugins
        // land in "plugins".
        'destinations' => [
            'mod' => 'mods',
            'plugin' => 'plugins',
        ],
    ],
];
