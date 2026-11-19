<?php

namespace Pterodactyl\Services\Marketplace\Sources;

use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Cache;
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
        // Spiget is the API; Spigot is the brand users recognize in the UI.
        return 'Spigot';
    }

    public function supports(string $type): bool
    {
        return $type === 'plugin';
    }

    /**
     * SpigotMC resource categories via Spiget. IDs are the filter values;
     * duplicate names (legacy free vs premium sections) get a disambiguating id.
     *
     * @return array<int, array{id: string, label: string}>
     */
    public function categories(string $type): array
    {
        if ($type !== 'plugin') {
            return [];
        }

        $cacheKey = 'marketplace:spiget:categories:ui';
        $cached = Cache::get($cacheKey);
        if (is_array($cached)) {
            return $cached;
        }

        $skip = [
            'premium',
            'no rating',
            'standalone',
            'universal',
            'spigot',
            'bungee - spigot',
            'bungee - proxy',
        ];

        $out = [];
        foreach ($this->rawCategories() as $id => $name) {
            if (in_array(strtolower($name), $skip, true)) {
                continue;
            }
            $out[] = [
                'id' => (string) $id,
                'label' => $name,
            ];
        }

        // Disambiguate duplicate labels (same name, different Spiget ids).
        $counts = array_count_values(array_column($out, 'label'));
        foreach ($out as &$row) {
            if (($counts[$row['label']] ?? 0) > 1) {
                $row['label'] = $row['label'] . ' · ' . $row['id'];
            }
        }
        unset($row);

        usort($out, fn($a, $b) => strcasecmp($a['label'], $b['label']));
        if ($out !== []) {
            Cache::put($cacheKey, $out, 86400);
        }

        return $out;
    }

    /**
     * Full Spiget category id → name map (including structural buckets used
     * only for chip labels on search results).
     *
     * @return array<int, string>
     */
    private function rawCategories(): array
    {
        $cacheKey = 'marketplace:spiget:categories:raw';
        $cached = Cache::get($cacheKey);
        if (is_array($cached)) {
            return $cached;
        }

        $items = $this->get($this->url('/categories'), ['size' => 100, 'page' => 0]);
        if (!is_array($items)) {
            return [];
        }

        $map = [];
        foreach ($items as $item) {
            if (!is_array($item)) {
                continue;
            }
            $id = Arr::get($item, 'id');
            $name = Arr::get($item, 'name');
            if ($id === null || !is_string($name) || $name === '') {
                continue;
            }
            $map[(int) $id] = $name;
        }

        if ($map !== []) {
            Cache::put($cacheKey, $map, 86400);
        }

        return $map;
    }

    public function search(string $type, array $filters): array
    {
        $limit = min(max((int) ($filters['limit'] ?? 20), 1), 50);
        $offset = max((int) ($filters['offset'] ?? 0), 0);
        $page = intdiv($offset, max($limit, 1));
        $query = trim((string) ($filters['query'] ?? ''));
        $category = trim((string) ($filters['category'] ?? ''));

        // Spiget has no project_type filter (everything is a plugin resource).
        // Category browse uses /categories/{id}/resources; text search uses
        // /search/resources/{q}; otherwise list by downloads.
        if ($category !== '' && $query === '') {
            $path = '/categories/' . rawurlencode($category) . '/resources';
            $request = ['size' => $limit, 'page' => $page, 'sort' => '-downloads'];
        } elseif ($query !== '') {
            $path = '/search/resources/' . rawurlencode($query);
            $request = ['size' => $limit, 'page' => $page];
        } else {
            $path = '/resources';
            $request = ['size' => $limit, 'page' => $page, 'sort' => '-downloads'];
        }

        $items = $this->get($this->url($path), $request);
        if (!is_array($items)) {
            return [];
        }

        // Soft-resolve names for chips; never fail a search if /categories is down.
        $categoryNames = [];
        try {
            $categoryNames = $this->rawCategories();
        } catch (\Throwable) {
            $categoryNames = [];
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

            // When the user searched by text AND picked a category, Spiget's
            // search endpoint ignores category — filter client-side.
            if ($category !== '' && $query !== '') {
                $resourceCat = Arr::get($item, 'category.id');
                if ((string) $resourceCat !== $category) {
                    continue;
                }
            }

            $name = (string) (Arr::get($item, 'name', 'spiget-' . $id));
            // Spiget marks resources that only ship an external HTML download
            // page. Those cannot be auto-installed via the daemon pull path.
            $externallyHosted = (bool) Arr::get($item, 'external', false);

            $projects[] = new MarketplaceProject(
                source: $this->key(),
                id: (string) $id,
                title: $name,
                slug: (string) $id,
                description: (string) (Arr::get($item, 'tag', '') ?: ''),
                author: (string) $this->getAuthorName(Arr::get($item, 'author.id', 1)),
                icon: $this->absoluteIcon($this->nullableString(Arr::get($item, 'icon.url'))),
                downloads: (int) (Arr::get($item, 'downloads', 0) ?: 0),
                categories: $this->categoryLabels(Arr::get($item, 'category'), $categoryNames),
                url: $this->nullableString(Arr::get($item, 'links.discussion'))
                    ? $this->webUrl(Arr::get($item, 'links.discussion'))
                    : null,
                updatedAt: null,
                externallyHosted: $externallyHosted,
            );
        }

        return $projects;
    }

    public function versions(string $type, string $projectId, array $filters): array
    {
        $limit = min(max((int) ($filters['limit'] ?? 50), 1), 50);
        // Newest first — Spiget defaults to ascending id without an explicit sort.
        $items = $this->get($this->url('/resources/' . rawurlencode($projectId) . '/versions'), [
            'size' => $limit,
            'page' => 0,
            'sort' => '-releaseDate',
        ]);
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
            $releaseDate = Arr::get($item, 'releaseDate');
            $date = is_numeric($releaseDate)
                ? gmdate('c', (int) $releaseDate)
                : $this->nullableString($releaseDate);

            $versions[] = new MarketplaceVersion(
                id: (string) $id,
                name: (string) (Arr::get($item, 'name', $id)),
                loaders: ['spigot'],
                gameVersions: array_values(array_filter(array_map('strval', Arr::wrap(Arr::get($item, 'testedVersions', []))))),
                size: null,
                date: $date,
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

    private function getAuthorName(int $authorId): ?string
    {
        $path = '/authors/' . $authorId;

        $items = $this->get($this->url($path));
        if (!is_array($items)) {
            return null;
        }

        return $items['name'] ?? null;
    }

    /**
     * Spiget's `category` field is an object `{id, name?}`, not a string list.
     * Casting that object to string produced the "Array" chip bug in the UI.
     *
     * @param array<int, string> $names
     *
     * @return string[]
     */
    private function categoryLabels(mixed $category, array $names): array
    {
        if (!is_array($category)) {
            return [];
        }

        $name = $category['name'] ?? null;
        if (is_string($name) && $name !== '') {
            return [$name];
        }

        $id = $category['id'] ?? null;
        if ($id !== null && isset($names[(int) $id])) {
            return [$names[(int) $id]];
        }

        return [];
    }
}
