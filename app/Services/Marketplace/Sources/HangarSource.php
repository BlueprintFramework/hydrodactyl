<?php

namespace Pterodactyl\Services\Marketplace\Sources;

use Illuminate\Support\Arr;
use Pterodactyl\Services\Marketplace\AbstractMarketplaceSource;
use Pterodactyl\Services\Marketplace\MarketplaceException;
use Pterodactyl\Services\Marketplace\MarketplaceProject;
use Pterodactyl\Services\Marketplace\MarketplaceVersion;

/**
 * Hangar (https://hangar.papermc.io) adapter — PaperMC's plugin platform.
 * Plugin-only. Projects are addressed by their namespace "owner/slug" and
 * downloads are platform-specific redirect endpoints.
 */
class HangarSource extends AbstractMarketplaceSource
{
    public function key(): string
    {
        return 'hangar';
    }

    public function label(): string
    {
        return 'Hangar';
    }

    public function supports(string $type): bool
    {
        return $type === 'plugin';
    }

    public function search(string $type, array $filters): array
    {
        $limit = min(max((int) ($filters['limit'] ?? 20), 1), 50);
        $offset = max((int) ($filters['offset'] ?? 0), 0);
        $query = trim((string) ($filters['query'] ?? ''));

        $request = [
            'limit' => $limit,
            'offset' => $offset,
        ];
        if ($query !== '') {
            // Hangar filters by query string.
            $request['q'] = $query;
        }

        $payload = $this->get($this->url('/projects'), $request);
        $items = Arr::get($payload, 'result', []);
        if (!is_array($items)) {
            return [];
        }

        $projects = [];
        foreach ($items as $item) {
            if (!is_array($item)) {
                continue;
            }
            $namespace = Arr::get($item, 'namespace', []);
            $owner = Arr::get($namespace, 'owner', '');
            $slug = Arr::get($namespace, 'slug', '');
            if (!is_string($owner) || $owner === '' || !is_string($slug) || $slug === '') {
                continue;
            }

            $projects[] = new MarketplaceProject(
                source: $this->key(),
                id: $owner . '/' . $slug,
                title: (string) (Arr::get($item, 'name', $slug)),
                slug: (string) $slug,
                description: (string) Arr::get($item, 'description', ''),
                author: (string) $owner,
                icon: $this->iconUrl(Arr::get($item, 'id')),
                downloads: (int) Arr::get($item, 'stats.downloads', 0),
                categories: array_values(array_filter(array_map('strval', Arr::wrap(Arr::get($item, 'category', []))))),
                url: $this->webUrl($owner . '/' . $slug),
                updatedAt: $this->nullableString(Arr::get($item, 'lastUpdated')),
            );
        }

        return $projects;
    }

    public function versions(string $type, string $projectId, array $filters): array
    {
        $namespace = $this->namespace($projectId);
        if ($namespace === null) {
            return [];
        }

        $payload = $this->get($this->url('/projects/' . $namespace . '/versions'), [
            'limit' => 50,
            'offset' => 0,
        ]);

        $items = Arr::get($payload, 'result', []);
        if (!is_array($items)) {
            return [];
        }

        // Honor the loader/platform filter the user picked (e.g. "paper") so we
        // don't offer versions for an incompatible platform.
        $loader = $this->normalizeLoader($filters['loader'] ?? null);

        $versions = [];
        foreach ($items as $item) {
            if (!is_array($item)) {
                continue;
            }
            $name = Arr::get($item, 'name');
            if (!is_string($name) || $name === '') {
                continue;
            }
            $platforms = Arr::get($item, 'platformDependencies', []);
            $loaders = is_array($platforms)
                ? array_values(array_filter(array_map('strtolower', array_map('strval', array_keys($platforms)))))
                : [];

            if ($loader !== null && $loader !== '' && !in_array($loader, $loaders, true)) {
                continue;
            }

            $versions[] = new MarketplaceVersion(
                id: $name, // download endpoints key off the version name
                name: $name,
                loaders: $loaders,
                gameVersions: [],
                size: null,
                date: $this->nullableString(Arr::get($item, 'createdAt')),
                type: 'release',
            );
        }

        return $versions;
    }

    public function resolve(string $type, string $projectId, string $versionId): array
    {
        $namespace = $this->namespace($projectId);
        if ($namespace === null) {
            throw MarketplaceException::upstream($this->key(), 'Invalid project namespace.');
        }

        // Reuse the version list to discover which platforms this version
        // supports (Hangar's download endpoint is platform-specific).
        $platform = null;
        $versionName = $versionId;
        foreach ($this->versions($type, $projectId, []) as $version) {
            if ($version->id === $versionId) {
                $platform = $version->loaders[0] ?? null;
                $versionName = $version->name;
                break;
            }
        }
        if ($platform === null) {
            $platform = 'PAPER';
        }

        $url = $this->url(
            '/projects/' . $namespace . '/versions/' . rawurlencode((string) $versionName) . '/' . rawurlencode((string) $platform) . '/download',
        );

        // Hangar's download endpoint redirects (301) to the real artifact, which
        // we resolve to a direct URL (the daemon does not follow redirects).
        return $this->resolveRedirectingJar($url, $this->filename($namespace, $versionName));
    }

    /**
     * @return string[]
     */
    protected function downloadHosts(): array
    {
        $hosts = config('hydrodactyl.marketplace.sources.hangar.download_hosts', ['hangar.papermc.io']);

        return is_array($hosts) ? array_values(array_map('strval', $hosts)) : ['hangar.papermc.io'];
    }

    /**
     * Parse "owner/slug" out of the stored project id. Returns null on malformed input.
     */
    protected function namespace(string $projectId): ?string
    {
        $parts = explode('/', $projectId, 2);
        if (count($parts) !== 2 || $parts[0] === '' || $parts[1] === '') {
            return null;
        }

        return rawurlencode($parts[0]) . '/' . rawurlencode($parts[1]);
    }

    protected function filename(string $namespace, string $versionName): string
    {
        $slug = basename(str_replace('/', '-', $namespace));

        return $slug . '-' . $versionName . '.jar';
    }

    protected function url(string $path): string
    {
        return rtrim((string) config('hydrodactyl.marketplace.sources.hangar.base_url'), '/') . '/' . ltrim($path, '/');
    }

    protected function webUrl(string $path): string
    {
        return rtrim((string) config('hydrodactyl.marketplace.sources.hangar.web_url'), '/') . '/' . ltrim($path, '/');
    }

    /**
     * Build a project's avatar URL. The projects list endpoint omits avatar
     * data entirely, but Hangar's CDN serves avatars at a stable path keyed by
     * the numeric project id, so we construct it without an extra request.
     * Projects without a custom avatar 404 here; the frontend degrades to the
     * letter avatar via the <img> onError handler.
     */
    private function iconUrl(mixed $id): ?string
    {
        if (!is_numeric($id)) {
            return null;
        }
        $base = rtrim((string) config('hydrodactyl.marketplace.sources.hangar.cdn_url', 'https://hangarcdn.papermc.io'), '/');

        return $base . '/avatars/project/' . (int) $id . '.webp';
    }

    private function nullableString(mixed $value): ?string
    {
        return is_string($value) && $value !== '' ? $value : null;
    }
}
