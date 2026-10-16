<?php

namespace Pterodactyl\Services\Daemons;

use GuzzleHttp\Client;
use Carbon\CarbonImmutable;
use Pterodactyl\Enums\Daemon\DaemonType;
use Illuminate\Contracts\Cache\Repository as CacheRepository;

/**
 * Resolves release information for the daemon backends the panel talks to.
 *
 * Wings, Elytra and Calagopus are released independently of the panel, so the
 * repository that publishes a daemon's latest version and the path of its
 * remote self-upgrade endpoint are defined per backend in config/daemons.php.
 */
class DaemonVersionService
{
    public function __construct(
        protected CacheRepository $cache,
        protected Client $client,
    ) {
    }

    /**
     * The GitHub repository ("owner/name") that publishes this backend.
     */
    public function repository(DaemonType $type): ?string
    {
        return config("daemons.types.{$type->value}.repository");
    }

    /**
     * The daemon-side path used to trigger a remote self-upgrade, if the
     * backend supports one.
     */
    public function upgradeEndpoint(DaemonType $type): ?string
    {
        return config("daemons.types.{$type->value}.upgrade_endpoint");
    }

    /**
     * The systemd service that runs this backend, restarted after an upgrade.
     */
    public function restartService(DaemonType $type): string
    {
        return (string) config("daemons.types.{$type->value}.restart_service", $type->value);
    }

    /**
     * The latest published version tag for a backend, or null when it cannot
     * be resolved (no repository, no releases, GitHub unreachable, ...).
     */
    public function latest(DaemonType $type): ?string
    {
        return $this->release($type)['tag_name'] ?? null;
    }

    /**
     * Whether a reported daemon version is at (or ahead of) the latest release.
     * Returns null when there is nothing to compare against.
     */
    public function isLatest(DaemonType $type, string $version): ?bool
    {
        $latest = $this->latest($type);

        if ($latest === null) {
            return null;
        }

        return version_compare($this->normalizeVersion($version), $this->normalizeVersion($latest)) >= 0;
    }

    /**
     * The latest release payload for a backend, cached to stay inside GitHub's
     * unauthenticated rate limit. A failed lookup is never cached.
     */
    public function release(DaemonType $type): ?array
    {
        $repository = $this->repository($type);

        if (!$repository) {
            return null;
        }

        $key = "daemon:release:{$type->value}";

        $cached = $this->cache->get($key);

        if (is_array($cached) && $cached !== []) {
            return $cached;
        }

        try {
            $headers = [
                'Accept' => 'application/vnd.github+json',
                'User-Agent' => config('app.name', 'Hydrodactyl'),
            ];

            if ($token = config('daemons.github_token')) {
                $headers['Authorization'] = "Bearer {$token}";
            }

            $response = $this->client->request('GET', "https://api.github.com/repos/{$repository}/releases/latest", [
                'headers' => $headers,
            ]);

            if ($response->getStatusCode() !== 200) {
                return null;
            }

            $data = json_decode($response->getBody(), true);

            if (!is_array($data) || !isset($data['tag_name'])) {
                return null;
            }

            $this->cache->put(
                $key,
                $data,
                CarbonImmutable::now()->addMinutes((int) config('daemons.cache_time', 60))
            );

            return $data;
        } catch (\Exception) {
            return null;
        }
    }

    /**
     * Normalize a release tag ("v1.4.0", "release-1.2.5") into a comparable
     * version, matching how daemons report themselves.
     */
    private function normalizeVersion(string $version): string
    {
        $numeric = preg_replace('/^[^0-9]*/', '', $version);

        return ltrim($numeric ?? $version, 'vV');
    }
}
