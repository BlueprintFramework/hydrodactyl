<?php

namespace Pterodactyl\Services\Marketplace\Sources;

use Illuminate\Support\Arr;
use Pterodactyl\Services\Marketplace\AbstractMarketplaceSource;
use Pterodactyl\Services\Marketplace\MarketplaceException;
use Pterodactyl\Services\Marketplace\MarketplaceProject;
use Pterodactyl\Services\Marketplace\MarketplaceVersion;

/**
 * Modrinth (https://modrinth.com) adapter. Modrinth hosts both Minecraft mods
 * and plugins, so this source serves both content types. Loaders and game
 * versions are expressed as facets (loaders are categories on Modrinth).
 */
class ModrinthSource extends AbstractMarketplaceSource
{
    public function key(): string
    {
        return 'modrinth';
    }

    public function label(): string
    {
        return 'Modrinth';
    }

    public function supports(string $type): bool
    {
        return $type === 'mod' || $type === 'plugin';
    }

    public function search(string $type, array $filters): array
    {
        $facets = [['project_type:' . $type]];

        $loader = $this->normalizeLoader($filters['loader'] ?? null);
        if ($loader !== null && $loader !== '') {
            $facets[] = ['categories:' . $loader];
        }

        $gameVersion = $filters['game_version'] ?? null;
        if (!empty($gameVersion)) {
            $facets[] = ['versions:' . $gameVersion];
        }

        $query = [
            'limit' => min(max((int) ($filters['limit'] ?? 20), 1), 50),
            'offset' => max((int) ($filters['offset'] ?? 0), 0),
            'index' => 'relevance',
            'facets' => json_encode($facets, JSON_THROW_ON_ERROR),
        ];

        $term = trim((string) ($filters['query'] ?? ''));
        if ($term !== '') {
            $query['query'] = $term;
        } else {
            // Without a query Modrinth requires a non-relevance index to return
            // popular results rather than an arbitrary ordering.
            $query['index'] = 'downloads';
        }

        $payload = $this->get($this->url('/search'), $query);

        $hits = Arr::get($payload, 'hits', []);
        if (!is_array($hits)) {
            return [];
        }

        $projects = [];
        foreach ($hits as $hit) {
            if (!is_array($hit)) {
                continue;
            }
            $id = Arr::get($hit, 'project_id');
            if (!is_string($id) || $id === '') {
                continue;
            }

            $slug = Arr::get($hit, 'slug', $id);
            // Modrinth project URLs are typed: modrinth.com/{project_type}/{slug}.
            // A bare /{slug} 404s, so include the project_type from the hit
            // (falling back to the queried type). Stale types 301-redirect to the
            // canonical one, so the link always lands on the right page.
            $projectType = (string) (Arr::get($hit, 'project_type', $type) ?? $type);
            $projects[] = new MarketplaceProject(
                source: $this->key(),
                id: $id,
                title: (string) (Arr::get($hit, 'title', $slug)),
                slug: (string) $slug,
                description: (string) Arr::get($hit, 'description', ''),
                author: (string) Arr::get($hit, 'author', ''),
                icon: $this->nullableString(Arr::get($hit, 'icon_url')),
                downloads: (int) Arr::get($hit, 'downloads', 0),
                categories: array_values(array_filter(array_map('strval', Arr::get($hit, 'categories', [])))),
                url: $this->webUrl('/' . $projectType . '/' . $slug),
                updatedAt: $this->nullableString(Arr::get($hit, 'date_modified')),
            );
        }

        return $projects;
    }

    public function versions(string $type, string $projectId, array $filters): array
    {
        $query = [];
        $loader = $this->normalizeLoader($filters['loader'] ?? null);
        if ($loader !== null && $loader !== '') {
            $query['loaders'] = json_encode([$loader], JSON_THROW_ON_ERROR);
        }
        $gameVersion = $filters['game_version'] ?? null;
        if (!empty($gameVersion)) {
            $query['game_versions'] = json_encode([$gameVersion], JSON_THROW_ON_ERROR);
        }

        $payload = $this->get($this->url('/project/' . urlencode($projectId) . '/version'), $query);
        if (!is_array($payload)) {
            return [];
        }

        $versions = [];
        foreach ($payload as $item) {
            if (!is_array($item)) {
                continue;
            }
            $version = $this->versionFromPayload($item);
            if ($version !== null) {
                $versions[] = $version;
            }
        }

        return $versions;
    }

    public function resolve(string $type, string $projectId, string $versionId): array
    {
        $payload = $this->getShortLived($this->url('/version/' . urlencode($versionId)));
        $file = $this->pickPrimaryFile(Arr::get($payload, 'files', []));

        if ($file === null) {
            throw MarketplaceException::upstream($this->key(), 'No downloadable file is available for this version.');
        }

        $url = Arr::get($file, 'url');
        $filename = Arr::get($file, 'filename');
        if (!is_string($url) || $url === '' || !is_string($filename) || $filename === '') {
            throw MarketplaceException::upstream($this->key(), 'The version file is missing a download URL.');
        }

        $this->assertSafeDownloadUrl($url, $this->downloadHosts());

        return [
            'url' => $url,
            'filename' => $filename,
            'size' => $this->nullableInt(Arr::get($file, 'size')),
        ];
    }

    /**
     * @return string[]
     */
    protected function downloadHosts(): array
    {
        $hosts = config('hydrodactyl.marketplace.sources.modrinth.download_hosts', ['cdn.modrinth.com']);

        return is_array($hosts) ? array_values(array_map('strval', $hosts)) : ['cdn.modrinth.com'];
    }

    /**
     * @param array<int, mixed> $files
     *
     * @return array<string, mixed>|null
     */
    private function pickPrimaryFile(array $files): ?array
    {
        $files = array_values(array_filter($files, fn ($f) => is_array($f)));
        if ($files === []) {
            return null;
        }

        foreach ($files as $file) {
            if (Arr::get($file, 'primary') === true) {
                return $file;
            }
        }

        return $files[0];
    }

    private function versionFromPayload(array $item): ?MarketplaceVersion
    {
        $id = Arr::get($item, 'id');
        if (!is_string($id) || $id === '') {
            return null;
        }

        return new MarketplaceVersion(
            id: $id,
            name: (string) (Arr::get($item, 'name', Arr::get($item, 'version_number', $id))),
            loaders: array_values(array_filter(array_map('strval', Arr::get($item, 'loaders', [])))),
            gameVersions: array_values(array_filter(array_map('strval', Arr::get($item, 'game_versions', [])))),
            size: $this->nullableInt(Arr::get($this->pickPrimaryFile(Arr::get($item, 'files', [])) ?? [], 'size')),
            date: $this->nullableString(Arr::get($item, 'date_published')),
            type: (string) Arr::get($item, 'version_type', 'release'),
        );
    }

    private function url(string $path): string
    {
        return rtrim((string) config('hydrodactyl.marketplace.sources.modrinth.base_url'), '/') . '/' . ltrim($path, '/');
    }

    private function webUrl(string $path): string
    {
        return rtrim((string) config('hydrodactyl.marketplace.sources.modrinth.web_url'), '/') . '/' . ltrim($path, '/');
    }

    private function nullableString(mixed $value): ?string
    {
        return is_string($value) && $value !== '' ? $value : null;
    }

    private function nullableInt(mixed $value): ?int
    {
        return is_numeric($value) ? (int) $value : null;
    }
}
