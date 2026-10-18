<?php

namespace Pterodactyl\Services\Helpers;

use GuzzleHttp\Client;
use Carbon\CarbonImmutable;
use Illuminate\Support\Arr;
use Illuminate\Contracts\Cache\Repository as CacheRepository;
use Pterodactyl\Exceptions\Service\Helper\CdnVersionFetchingException;

class SoftwareVersionService
{
    public const VERSION_CACHE_KEY = 'pterodactyl:versioning_data';

    private static array $result;

    /**
     * SoftwareVersionService constructor.
     */
    public function __construct(
        protected CacheRepository $cache,
        protected Client $client,
    ) {
        self::$result = $this->cacheVersionData();
    }

    /**
     * Get the latest version of the panel from the CDN servers.
     *
     * The Hydrodactyl CDN (blueprint.zip) publishes a single "version" key for
     * the whole release; "panel" is kept as a fallback for the older Pterodactyl
     * latest.json shape.
     */
    public function getPanel(): string
    {
        return Arr::get(self::$result, 'panel') ?? Arr::get(self::$result, 'version') ?? 'error';
    }

    /**
     * Get the URL to the discord server.
     */
    public function getDiscord(): string
    {
        return Arr::get(self::$result, 'discord') ?? 'https://discord.gg/mnTJVSSaKp';
    }

    /**
     * Get the URL for donations.
     */
    public function getDonations(): string
    {
        return Arr::get(self::$result, 'donations') ?? 'https://ko-fi.com/naterfute';
    }

    /**
     * Determine if the current version of the panel is the latest.
     */
    public function isLatestPanel(): bool
    {
        if (config('app.version') === 'canary') {
            return true;
        }

        $latest = $this->getPanel();

        if ($latest === 'error') {
            return false;
        }

        return version_compare($this->normalizeVersion((string) config('app.version')), $this->normalizeVersion($latest)) >= 0;
    }

    /**
     * Strip a leading "v" so CDN-published tags compare cleanly with the
     * panel's configured version.
     */
    private function normalizeVersion(string $version): string
    {
        return ltrim($version, 'vV');
    }

    /**
     * Keeps the versioning cache up-to-date with the latest results from the CDN.
     *
     * A failed lookup is never cached: an empty result would otherwise stick for
     * the full cache window and leave every version check reporting "unknown".
     */
    protected function cacheVersionData(): array
    {
        $cached = $this->cache->get(self::VERSION_CACHE_KEY);

        if (is_array($cached) && $cached !== []) {
            return $cached;
        }

        try {
            $response = $this->client->request('GET', config('hydrodactyl.cdn.url'));

            if ($response->getStatusCode() !== 200) {
                throw new CdnVersionFetchingException();
            }

            $data = json_decode($response->getBody(), true);

            if (!is_array($data) || $data === []) {
                throw new CdnVersionFetchingException();
            }

            $this->cache->put(
                self::VERSION_CACHE_KEY,
                $data,
                CarbonImmutable::now()->addMinutes(config('hydrodactyl.cdn.cache_time', 60))
            );

            return $data;
        } catch (\Exception) {
            return [];
        }
    }
}
