<?php

namespace Pterodactyl\Http\Controllers\Api\Client\Servers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Pterodactyl\Http\Controllers\Api\Client\ClientApiController;
use Pterodactyl\Http\Requests\Api\Client\Servers\Marketplace\CategoriesRequest;
use Pterodactyl\Http\Requests\Api\Client\Servers\Marketplace\DestroyInstallRequest;
use Pterodactyl\Http\Requests\Api\Client\Servers\Marketplace\GameVersionsRequest;
use Pterodactyl\Http\Requests\Api\Client\Servers\Marketplace\GetProjectRequest;
use Pterodactyl\Http\Requests\Api\Client\Servers\Marketplace\InstallModpackRequest;
use Pterodactyl\Http\Requests\Api\Client\Servers\Marketplace\ListInstallsRequest;
use Pterodactyl\Http\Requests\Api\Client\Servers\Marketplace\LoadersRequest;
use Pterodactyl\Http\Requests\Api\Client\Servers\Marketplace\ResolveInstallRequest;
use Pterodactyl\Http\Requests\Api\Client\Servers\Marketplace\SearchMarketplaceRequest;
use Pterodactyl\Http\Requests\Api\Client\Servers\Marketplace\StoreInstallRequest;
use Pterodactyl\Models\MarketplaceInstall;
use Pterodactyl\Services\Marketplace\DestinationResolver;
use Pterodactyl\Services\Marketplace\MarketplaceException;
use Pterodactyl\Services\Marketplace\MarketplaceSource;
use Pterodactyl\Services\Marketplace\SourceRegistry;
use Pterodactyl\Services\ServerOperations\ModpackInstallService;

/**
 * Daemon-agnostic marketplace controller powering the plugin/mod installer.
 *
 * It only proxies browse/resolve calls to upstream providers — the actual file
 * transfer is performed by the existing per-daemon "pull file" endpoint, which
 * the frontend invokes with the resolved URL and the destination directory.
 */
class MarketplaceController extends ClientApiController
{
    public function __construct(
        private SourceRegistry $sources,
        private DestinationResolver $destinations,
        private ModpackInstallService $modpackInstalls,
    ) {
        parent::__construct();
    }

    /**
     * Search marketplace
     */
    public function search(SearchMarketplaceRequest $request): JsonResponse
    {
        $type = $request->input('type');
        $sourceKey = $request->input('source');

        $limit = min(max((int) $request->input('limit', 20), 1), 50);
        $offset = max((int) $request->input('offset', 0), 0);

        $filters = [
            'query' => $request->input('query'),
            'loader' => $request->input('loader'),
            'game_version' => $request->input('game_version'),
            'category' => $request->input('category'),
            'limit' => $limit,
            'offset' => $offset,
        ];

        // "all" fans the search out across every enabled source that serves the
        // requested type, then merges + ranks the results. A specific provider
        // queries just that one (Modrinth is the UI default).
        $combined = $sourceKey === null || $sourceKey === '' || $sourceKey === 'all';

        return $this->guard(function () use ($request, $type, $sourceKey, $filters, $combined, $limit, $offset): JsonResponse {
            if ($denied = $this->denyUnsupportedEggType($request, (string) $type)) {
                return $denied;
            }

            $projects = $combined
                ? $this->combinedSearch($type, $filters, $limit, $offset)
                : $this->singleSourceSearch((string) $sourceKey, $type, $filters);

            return response()->json([
                'results' => collect($projects)->map(fn($p) => $p->toArray())->values()->all(),
                'sources' => $this->availableSources($type),
            ]);
        });
    }

    /**
     * Query a single source (used when the user picks a specific provider).
     *
     * @param array<string, mixed> $filters
     *
     * @return \Pterodactyl\Services\Marketplace\MarketplaceProject[]
     */
    protected function singleSourceSearch(string $sourceKey, string $type, array $filters): array
    {
        $source = $this->sources->resolve($sourceKey);
        if (!$source->supports($type)) {
            return [];
        }

        return $source->search($type, $filters);
    }

    /**
     * Query every enabled source for the type and merge the results, ranked by
     * downloads, then slice to the requested page. Providers are asked for a
     * larger window so a global offset/limit still yields a full page after
     * merge (per-source offset alone paginates incorrectly).
     *
     * @param array<string, mixed> $filters
     *
     * @return \Pterodactyl\Services\Marketplace\MarketplaceProject[]
     */
    protected function combinedSearch(string $type, array $filters, int $limit, int $offset): array
    {
        // Over-fetch so ranking across providers still fills the requested page.
        $perSource = [
            ...$filters,
            'limit' => min($limit + $offset, 50),
            'offset' => 0,
        ];

        $merged = [];
        foreach ($this->sources->all() as $source) {
            if (!$source->supports($type)) {
                continue;
            }
            try {
                $merged = array_merge($merged, $source->search($type, $perSource));
            } catch (MarketplaceException $e) {
                // Skip a failing provider; surface results from the others.
            }
        }

        usort($merged, fn($a, $b) => $b->downloads <=> $a->downloads);

        return array_slice($merged, $offset, $limit);
    }

    /**
     * Get project versions
     */
    public function project(GetProjectRequest $request): JsonResponse
    {
        $type = $request->input('type');
        $sourceKey = $request->input('source');
        $projectId = $request->input('project_id');

        return $this->guard(function () use ($type, $sourceKey, $projectId, $request): JsonResponse {
            if ($denied = $this->denyUnsupportedEggType($request, (string) $type)) {
                return $denied;
            }

            $source = $this->sources->resolve((string) $sourceKey);
            if (!$source->supports($type)) {
                return response()->json(['versions' => []]);
            }

            $versions = $source->versions($type, (string) $projectId, [
                'loader' => $request->input('loader'),
                'game_version' => $request->input('game_version'),
            ]);

            $versions = $this->sortVersionsNewestFirst($versions);

            return response()->json([
                'versions' => collect($versions)->map(fn($v) => $v->toArray())->values()->all(),
            ]);
        });
    }

    /**
     * Resolve a version download
     */
    public function resolve(ResolveInstallRequest $request): JsonResponse
    {
        $type = $request->input('type');
        $sourceKey = $request->input('source');
        $projectId = $request->input('project_id');
        $versionId = $request->input('version_id');

        return $this->guard(function () use ($request, $type, $sourceKey, $projectId, $versionId): JsonResponse {
            if ($denied = $this->denyUnsupportedEggType($request, (string) $type)) {
                return $denied;
            }

            $source = $this->sources->resolve((string) $sourceKey);
            if (!$source->supports($type)) {
                return response()->json(['error' => __('exceptions.client.marketplace.unsupported_content_type')], 422);
            }

            $download = $source->resolve($type, (string) $projectId, (string) $versionId);

            return response()->json([
                'url' => $download['url'],
                'filename' => $download['filename'],
                'size' => $download['size'],
                'directory' => $this->destinations->directory($type),
            ]);
        });
    }

    /**
     * Reject marketplace types the server's egg does not advertise (e.g. mods
     * on a Paper-only egg). Mirrors the frontend nav gate.
     */
    protected function denyUnsupportedEggType(SearchMarketplaceRequest|GetProjectRequest|ResolveInstallRequest $request, string $type): ?JsonResponse
    {
        /** @var \Pterodactyl\Models\Server $server */
        $server = $request->route()->parameter('server');
        $features = $server->egg?->inherit_features ?? [];
        if (!is_array($features)) {
            $features = [];
        }

        if ($this->destinations->supportsType($features, $type)) {
            return null;
        }

        return response()->json(['error' => __('exceptions.client.marketplace.egg_type_unsupported')], 422);
    }

    /**
     * Normalize version order across providers: newest first by date; undated
     * versions sink to the end while preserving relative order.
     *
     * @param \Pterodactyl\Services\Marketplace\MarketplaceVersion[] $versions
     *
     * @return \Pterodactyl\Services\Marketplace\MarketplaceVersion[]
     */
    protected function sortVersionsNewestFirst(array $versions): array
    {
        usort($versions, function ($a, $b) {
            $aTime = $a->date !== null && $a->date !== '' ? strtotime($a->date) : false;
            $bTime = $b->date !== null && $b->date !== '' ? strtotime($b->date) : false;
            $aOk = $aTime !== false;
            $bOk = $bTime !== false;

            if ($aOk && $bOk) {
                return $bTime <=> $aTime;
            }
            if ($aOk) {
                return -1;
            }
            if ($bOk) {
                return 1;
            }

            return 0;
        });

        return $versions;
    }

    /**
     * List installed projects
     */
    public function installed(ListInstallsRequest $request): JsonResponse
    {
        /** @var \Pterodactyl\Models\Server $server */
        $server = $request->route()->parameter('server');

        $installs = MarketplaceInstall::query()
            ->where('server_id', $server->id)
            ->orderByDesc('installed_at')
            ->get();

        return response()->json([
            'installs' => $installs->map(fn(MarketplaceInstall $i) => $this->serializeInstall($i))->values()->all(),
        ]);
    }

    /**
     * Queue an automatic Modrinth modpack install (backup / wipe / egg / materialize).
     */
    public function installModpack(InstallModpackRequest $request): JsonResponse
    {
        /** @var \Pterodactyl\Models\Server $server */
        $server = $request->route()->parameter('server');

        $result = $this->modpackInstalls->installAsync(
            $server,
            $request->user(),
            (string) $request->input('project_id'),
            (string) $request->input('version_id'),
            $request->input('project_title'),
            $request->input('version_name'),
            $request->boolean('should_backup', true),
            $request->boolean('should_wipe', true),
        );

        return response()->json($result);
    }

    /**
     * Record an install
     */
    public function store(StoreInstallRequest $request): JsonResponse
    {
        /** @var \Pterodactyl\Models\Server $server */
        $server = $request->route()->parameter('server');

        $install = MarketplaceInstall::updateOrCreate(
            [
                'server_id' => $server->id,
                'type' => $request->input('type'),
                'source' => $request->input('source'),
                'project_id' => $request->input('project_id'),
            ],
            [
                'project_title' => $request->input('project_title'),
                'version_id' => $request->input('version_id'),
                'version_name' => $request->input('version_name'),
                'filename' => $request->input('filename'),
                'installed_at' => now(),
            ],
        );

        return response()->json(['install' => $this->serializeInstall($install)]);
    }

    /**
     * Remove an install record
     */
    public function destroy(DestroyInstallRequest $request): JsonResponse
    {
        /** @var \Pterodactyl\Models\Server $server */
        $server = $request->route()->parameter('server');

        MarketplaceInstall::query()
            ->where('server_id', $server->id)
            ->where('type', $request->input('type'))
            ->where('source', $request->input('source'))
            ->where('project_id', $request->input('project_id'))
            ->delete();

        return response()->json([], 204);
    }

    /**
     * @return array{type: string, source: string, project_id: string, project_title: string, version_id: string, version_name: string, filename: string, installed_at: ?string}
     */
    protected function serializeInstall(MarketplaceInstall $i): array
    {
        return [
            'type' => $i->type,
            'source' => $i->source,
            'project_id' => $i->project_id,
            'project_title' => $i->project_title,
            'version_id' => $i->version_id,
            'version_name' => $i->version_name,
            'filename' => $i->filename,
            'installed_at' => $i->installed_at?->toIso8601String(),
        ];
    }

    /**
     * List available loaders
     */
    public function loaders(LoadersRequest $request): JsonResponse
    {
        $loaders = $this->sources->get('modrinth')?->loaders() ?? [];

        return response()->json(['loaders' => $loaders]);
    }

    /**
     * List supported game versions
     */
    public function gameVersions(GameVersionsRequest $request): JsonResponse
    {
        $versions = $this->sources->get('modrinth')?->gameVersions() ?? [];

        return response()->json(['game_versions' => $versions]);
    }

    /**
     * Content categories for a specific marketplace source + type (Modrinth
     * thematic tags, Hangar categories, Spigot resource categories).
     */
    public function categories(CategoriesRequest $request): JsonResponse
    {
        $type = (string) $request->input('type');
        $sourceKey = (string) $request->input('source');

        return $this->guard(function () use ($type, $sourceKey): JsonResponse {
            $source = $this->sources->resolve($sourceKey);
            if (!$source->supports($type)) {
                return response()->json(['categories' => []]);
            }

            return response()->json(['categories' => $source->categories($type)]);
        });
    }

    /**
     * Wrap a handler so any upstream provider failure becomes a clean 502.
     * Clients receive a generic message (never raw upstream status codes or
     * internal host details); the full detail is logged server-side.
     *
     * @param callable(): JsonResponse $callback
     */
    protected function guard(callable $callback): JsonResponse
    {
        try {
            return $callback();
        } catch (MarketplaceException $e) {
            Log::warning('Marketplace request failed', ['source' => $e->getMessage()]);

            return response()->json(['error' => __('exceptions.client.marketplace.request_failed')], 502);
        }
    }

    /**
     * Source metadata for the active type, so the UI can render selectors and
     * hide sources that don't serve the current tab.
     *
     * @return array<int, array{key: string, label: string}>
     */
    protected function availableSources(string $type): array
    {
        return Collection::make($this->sources->all())
            ->filter(fn(MarketplaceSource $source) => $source->supports($type))
            ->map(fn(MarketplaceSource $source) => ['key' => $source->key(), 'label' => $source->label()])
            ->values()
            ->all();
    }
}
