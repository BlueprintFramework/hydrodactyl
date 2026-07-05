<?php

namespace Pterodactyl\Services\Marketplace\Sources;

use Illuminate\Support\Arr;
use Pterodactyl\Services\Marketplace\AbstractMarketplaceSource;
use Pterodactyl\Services\Marketplace\MarketplaceProject;
use Pterodactyl\Services\Marketplace\MarketplaceVersion;

/**
 * Spiget (https://spiget.org) adapter for Spigot resources. Plugin-only,
 * keyless. Downloads are version-specific redirect endpoints.
 */
class SpigetSource extends AbstractMarketplaceSource
{
    public function key(): string
    {
        return 'spiget';
    }

    public function label(): string
    {
        return 'Spiget';
    }

    public function supports(string $type): bool
    {
        return $type === 'plugin';
    }

    public function search(string $type, array $filters): array
    {
        $limit = min(max((int) ($filters['limit'] ?? 20), 1), 50);
        $offset = max((int) ($filters['offset'] ?? 0), 0);
        $page = intdiv($offset, max($limit, 1));
        $query = trim((string) ($filters['query'] ?? ''));

        // Spiget has no project_type filter (everything is a plugin resource).
        // With a query we use the search endpoint; without one we list the most
        // downloaded resources for a sensible default home.
        $path = $query !== '' ? '/search/resources/' . rawurlencode($query) : '/resources';
        $request = ['size' => $limit, 'page' => $page];
        if ($query === '') {
            $request['sort'] = '-downloads';
        }

        $items = $this->get($this->url($path), $request);
        if (!is_array($items)) {
            return [];
        }

        $projects = [];
        foreach ($items as $item) {
            if (!is_array($item)) {
                continue;
            }
            $id = Arr::get($item, 'id');
            if ($id === null) {
                continue;
            }
            $name = (string) (Arr::get($item, 'name', 'spiget-' . $id));

            $projects[] = new MarketplaceProject(
                source: $this->key(),
                id: (string) $id,
                title: $name,
                slug: (string) $id,
                description: (string) (Arr::get($item, 'tag', '') ?: ''),
                author: (string) Arr::get($item, 'author.name', ''),
                icon: $this->absoluteIcon($this->nullableString(Arr::get($item, 'icon.url'))),
                downloads: (int) (Arr::get($item, 'downloads', 0) ?: 0),
                categories: array_values(array_filter(array_map('strval', Arr::wrap(Arr::get($item, 'category', []))))),
                url: $this->nullableString(Arr::get($item, 'links.discussion'))
                    ? $this->webUrl(Arr::get($item, 'links.discussion'))
                    : null,
                updatedAt: null,
            );
        }

        return $projects;
    }

    public function versions(string $type, string $projectId, array $filters): array
    {
        $limit = min(max((int) ($filters['limit'] ?? 50), 1), 50);
        $items = $this->get($this->url('/resources/' . rawurlencode($projectId) . '/versions'), ['size' => $limit, 'page' => 0]);
        if (!is_array($items)) {
            return [];
        }

        $versions = [];
        foreach ($items as $item) {
            if (!is_array($item)) {
                continue;
            }
            $id = Arr::get($item, 'id');
            if ($id === null) {
                continue;
            }
            $versions[] = new MarketplaceVersion(
                id: (string) $id,
                name: (string) (Arr::get($item, 'name', $id)),
                loaders: ['spigot'],
                gameVersions: array_values(array_filter(array_map('strval', Arr::wrap(Arr::get($item, 'testedVersions', []))))),
                size: null,
                date: null,
                type: 'release',
            );
        }

        return $versions;
    }

    public function resolve(string $type, string $projectId, string $versionId): array
    {
        // Version-specific download endpoint. Redirects (302) to the real file,
        // which we resolve to a direct URL (the daemon does not follow redirects).
        $endpoint = $this->url('/resources/' . rawurlencode($projectId) . '/download?version=' . rawurlencode($versionId));

        return $this->resolveRedirectingJar($endpoint, "spiget-{$projectId}-{$versionId}.jar");
    }

    /**
     * @return string[]
     */
    protected function downloadHosts(): array
    {
        $hosts = config('hydrodactyl.marketplace.sources.spiget.download_hosts', ['api.spiget.org']);

        return is_array($hosts) ? array_values(array_map('strval', $hosts)) : ['api.spiget.org'];
    }

    protected function url(string $path): string
    {
        return rtrim((string) config('hydrodactyl.marketplace.sources.spiget.base_url'), '/') . '/' . ltrim($path, '?/');
    }

    protected function webUrl(string $path): string
    {
        return rtrim((string) config('hydrodactyl.marketplace.sources.spiget.web_url'), '/') . '/' . ltrim($path, '/');
    }

    /**
     * Spiget returns icon paths relative to spigotmc.org (e.g.
     * "data/resource_icons/2/2124.jpg?…"). Resolve them to absolute URLs so
     * the browser doesn't try to load them from the panel origin. Already-
     * absolute URLs (rare) pass through unchanged.
     */
    private function absoluteIcon(?string $url): ?string
    {
        if ($url === null) {
            return null;
        }
        if (preg_match('#^https?://#i', $url)) {
            return $url;
        }

        return $this->webUrl($url);
    }

    private function nullableString(mixed $value): ?string
    {
        return is_string($value) && $value !== '' ? $value : null;
    }
}
