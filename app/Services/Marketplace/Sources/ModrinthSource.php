<?php

namespace Pterodactyl\Services\Marketplace\Sources;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
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
        return $type === 'mod' || $type === 'plugin' || $type === 'modpack';
    }

    /**
     * The authoritative loader tag list (GET /tag/loader), cached for a day.
     * Used to validate the loader extracted from a server's egg features so the
     * installer picks up new loaders Modrinth adds without a code change. Only a
     * non-empty result is cached, so a transient failure retries on the next
     * request instead of being pinned for 24h.
     *
     * @return string[]
     */
    public function loaders(): array
    {
        $cacheKey = 'marketplace:modrinth:loader-tags';

        $cached = Cache::get($cacheKey);
        if (is_array($cached)) {
            return $cached;
        }

        try {
            $response = Http::withHeaders(['User-Agent' => $this->userAgent(), 'Accept' => 'application/json'])
                ->timeout($this->timeout())
                ->get($this->url('/tag/loader'));
        } catch (ConnectionException) {
            return [];
        }

        if ($response->failed()) {
            return [];
        }

        $names = [];
        foreach (($response->json() ?? []) as $tag) {
            if (is_array($tag) && is_string($tag['name'] ?? null) && $tag['name'] !== '') {
                $names[] = $tag['name'];
            }
        }

        $names = array_values(array_unique($names));
        if ($names !== []) {
            Cache::put($cacheKey, $names, 86400);
        }

        return $names;
    }

    /**
     * Thematic Modrinth categories (adventure, economy, …), excluding loader
     * tags which already have their own filter. Used for both mods and plugins
     * — Modrinth accepts the same category facet on either project_type.
     *
     * @return array<int, array{id: string, label: string}>
     */
    public function categories(string $type): array
    {
        $cacheKey = 'marketplace:modrinth:content-categories:' . $type;

        $cached = Cache::get($cacheKey);
        if (is_array($cached)) {
            return $cached;
        }

        try {
            $response = Http::withHeaders(['User-Agent' => $this->userAgent(), 'Accept' => 'application/json'])
                ->timeout($this->timeout())
                ->get($this->url('/tag/category'));
        } catch (ConnectionException) {
            return [];
        }

        if ($response->failed()) {
            return [];
        }

        $loaders = array_fill_keys(array_map('strtolower', $this->loaders()), true);
        $out = [];
        $seen = [];
        foreach (($response->json() ?? []) as $tag) {
            if (!is_array($tag)) {
                continue;
            }
            $name = $tag['name'] ?? null;
            if (!is_string($name) || $name === '') {
                continue;
            }
            // Prefer the "categories" header (thematic). Modrinth tags plugins
            // under project_type "mod" as well; skip resource packs / shaders /
            // server-listing taxonomies.
            $projectType = (string) ($tag['project_type'] ?? '');
            $header = (string) ($tag['header'] ?? '');
            if ($header !== 'categories') {
                continue;
            }
            if ($projectType !== '' && $projectType !== 'mod' && $projectType !== 'plugin' && $projectType !== 'modpack') {
                continue;
            }
            // When browsing modpacks, prefer tags that declare project_type:modpack
            // (or untyped thematic tags) over plugin/mod-only taxonomies.
            if ($type === 'modpack' && $projectType !== '' && $projectType !== 'modpack') {
                continue;
            }
            if (isset($loaders[strtolower($name)])) {
                continue;
            }
            if (isset($seen[strtolower($name)])) {
                continue;
            }
            $seen[strtolower($name)] = true;
            $out[] = [
                'id' => $name,
                'label' => $this->humanizeCategory($name),
            ];
        }

        usort($out, fn($a, $b) => strcasecmp($a['label'], $b['label']));
        if ($out !== []) {
            Cache::put($cacheKey, $out, 86400);
        }

        return $out;
    }

    private function humanizeCategory(string $slug): string
    {
        return ucwords(str_replace(['-', '_'], ' ', $slug));
    }

    public function gameVersions(): array
    {
        $cacheKey = 'marketplace:modrinth:game-version-tags';

        $cached = Cache::get($cacheKey);
        if (is_array($cached)) {
            return $cached;
        }

        try {
            $response = Http::withHeaders(['User-Agent' => $this->userAgent(), 'Accept' => 'application/json'])
                ->timeout($this->timeout())
                ->get($this->url('/tag/game_version'));
        } catch (ConnectionException) {
            return [];
        }

        if ($response->failed()) {
            return [];
        }

        $grouped = [];
        foreach (($response->json() ?? []) as $tag) {
            if (!is_array($tag)) {
                continue;
            }
            $version = $tag['version'] ?? null;
            $type = $tag['version_type'] ?? 'unknown';
            if (!is_string($version) || $version === '' || !is_string($type) || $type === '') {
                continue;
            }
            $grouped[$type][] = $version;
        }

        foreach ($grouped as $type => $versions) {
            $grouped[$type] = array_values(array_unique($versions));
        }

        if ($grouped !== []) {
            Cache::put($cacheKey, $grouped, 300);
        }

        return $grouped;
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

        $category = trim((string) ($filters['category'] ?? ''));
        if ($category !== '') {
            // Thematic category (adventure, economy, …) — distinct from the
            // loader facet above even though Modrinth stores both under
            // "categories".
            $facets[] = ['categories:' . $category];
        }

        // Dedicated/panel installs should surface server-capable mods/packs, not
        // client-only ones. OR-group of environment facets (Modrinth facet
        // arrays are AND between groups, OR within a group).
        if ($type === 'mod' || $type === 'modpack') {
            $facets[] = [
                'environment:server_only',
                'environment:server_only_client_optional',
                'environment:dedicated_server_only',
                'environment:client_and_server',
                'environment:client_or_server',
                'environment:client_or_server_prefers_both',
            ];
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
                latestVersionId: $this->nullableString(Arr::get($hit, 'latest_version')),
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
        $file = $this->pickPrimaryFile(Arr::get($payload, 'files', []), $type === 'modpack');

        if ($file === null) {
            throw MarketplaceException::upstream($this->key(), __('exceptions.client.marketplace.no_downloadable_file'));
        }

        $url = Arr::get($file, 'url');
        $filename = Arr::get($file, 'filename');
        if (!is_string($url) || $url === '' || !is_string($filename) || $filename === '') {
            throw MarketplaceException::upstream($this->key(), __('exceptions.client.marketplace.missing_download_url'));
        }

        if ($type === 'modpack' && !str_ends_with(strtolower($filename), '.mrpack')) {
            throw MarketplaceException::upstream($this->key(), __('exceptions.client.marketplace.modpack_not_mrpack'));
        }

        $this->assertSafeDownloadUrl($url, $this->downloadHosts());

        return [
            'url' => $url,
            'filename' => $filename,
            'size' => $this->nullableInt(Arr::get($file, 'size')),
        ];
    }

    /**
     * Public wrapper used by the modpack install job when validating index URLs.
     *
     * @param string[] $allowedHosts
     *
     * @throws MarketplaceException
     */
    public function assertPublicDownloadUrl(string $url, array $allowedHosts): void
    {
        $this->assertSafeDownloadUrl($url, $allowedHosts);
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
    private function pickPrimaryFile(array $files, bool $preferMrpack = false): ?array
    {
        $files = array_values(array_filter($files, fn($f) => is_array($f)));
        if ($files === []) {
            return null;
        }

        if ($preferMrpack) {
            foreach ($files as $file) {
                $name = strtolower((string) Arr::get($file, 'filename', ''));
                if (str_ends_with($name, '.mrpack') && Arr::get($file, 'primary') === true) {
                    return $file;
                }
            }
            foreach ($files as $file) {
                $name = strtolower((string) Arr::get($file, 'filename', ''));
                if (str_ends_with($name, '.mrpack')) {
                    return $file;
                }
            }

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
