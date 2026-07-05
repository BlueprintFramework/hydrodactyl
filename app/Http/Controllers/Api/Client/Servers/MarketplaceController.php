<?php

namespace Pterodactyl\Http\Controllers\Api\Client\Servers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Pterodactyl\Http\Controllers\Api\Client\ClientApiController;
use Pterodactyl\Http\Requests\Api\Client\Servers\Marketplace\DestroyInstallRequest;
use Pterodactyl\Http\Requests\Api\Client\Servers\Marketplace\GetProjectRequest;
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
    ) {
        parent::__construct();
    }

    /**
     * Search a single source (or list available sources when no source given).
     */
    public function search(SearchMarketplaceRequest $request): JsonResponse
    {
        $type = $request->input('type');
        $sourceKey = $request->input('source');

        $filters = [
            'query' => $request->input('query'),
            'loader' => $request->input('loader'),
            'game_version' => $request->input('game_version'),
            'limit' => (int) $request->input('limit', 20),
            'offset' => (int) $request->input('offset', 0),
        ];

        // "all" (the default) fans the search out across every enabled source
        // that serves the requested type, then merges + ranks the results.
        $combined = $sourceKey === null || $sourceKey === '' || $sourceKey === 'all';

        return $this->guard(function () use ($type, $sourceKey, $filters, $combined): JsonResponse {
            $projects = $combined
                ? $this->combinedSearch($type, $filters)
                : $this->singleSourceSearch((string) $sourceKey, $type, $filters);

            return response()->json([
                'results' => collect($projects)->map(fn ($p) => $p->toArray())->values()->all(),
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
     * downloads. A single failing provider is skipped so one outage does not
     * blank out the whole installer.
     *
     * @param array<string, mixed> $filters
     *
     * @return \Pterodactyl\Services\Marketplace\MarketplaceProject[]
     */
    protected function combinedSearch(string $type, array $filters): array
    {
        $merged = [];
        foreach ($this->sources->all() as $source) {
            if (!$source->supports($type)) {
                continue;
            }
            try {
                $merged = array_merge($merged, $source->search($type, $filters));
            } catch (MarketplaceException $e) {
                // Skip a failing provider; surface results from the others.
            }
        }

        usort($merged, fn ($a, $b) => $b->downloads <=> $a->downloads);

        return $merged;
    }

    /**
     * List downloadable versions for a project.
     */
    public function project(GetProjectRequest $request): JsonResponse
    {
        $type = $request->input('type');
        $sourceKey = $request->input('source');
        $projectId = $request->input('project_id');

        return $this->guard(function () use ($type, $sourceKey, $projectId, $request): JsonResponse {
            $source = $this->sources->resolve((string) $sourceKey);
            if (!$source->supports($type)) {
                return response()->json(['versions' => []]);
            }

            $versions = $source->versions($type, (string) $projectId, [
                'loader' => $request->input('loader'),
                'game_version' => $request->input('game_version'),
            ]);

            return response()->json([
                'versions' => collect($versions)->map(fn ($v) => $v->toArray())->values()->all(),
            ]);
        });
    }

    /**
     * Resolve a version into a direct download URL + destination directory.
     */
    public function resolve(ResolveInstallRequest $request): JsonResponse
    {
        $type = $request->input('type');
        $sourceKey = $request->input('source');
        $projectId = $request->input('project_id');
        $versionId = $request->input('version_id');

        return $this->guard(function () use ($type, $sourceKey, $projectId, $versionId): JsonResponse {
            $source = $this->sources->resolve((string) $sourceKey);
            if (!$source->supports($type)) {
                return response()->json(['error' => 'This source cannot serve that content type.'], 422);
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
     * List the server's recorded installs. Install history lives in the panel
     * database (not on the daemon), so it is private to the panel and excluded
     * from server backups/archives. The frontend reconciles these against the
     * real jar files when rendering the "Installed" view.
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
            'installs' => $installs->map(fn (MarketplaceInstall $i) => $this->serializeInstall($i))->values()->all(),
        ]);
    }

    /**
     * Record (or, on reinstall, update) an install. Called by the frontend
     * after a successful daemon pull.
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
     * Remove an install record. The jar file itself is deleted separately by the
     * frontend (via the existing file-delete endpoint).
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
     * The cached Modrinth loader-tag list, so the frontend can validate the
     * loader extracted from a server's egg features against the live set rather
     * than a hard-coded list (auto-supports loaders Modrinth adds later).
     */
    public function loaders(LoadersRequest $request): JsonResponse
    {
        $loaders = $this->sources->get('modrinth')?->loaders() ?? [];

        return response()->json(['loaders' => $loaders]);
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

            return response()->json(['error' => 'Marketplace request failed.'], 502);
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
            ->filter(fn (MarketplaceSource $source) => $source->supports($type))
            ->map(fn (MarketplaceSource $source) => ['key' => $source->key(), 'label' => $source->label()])
            ->values()
            ->all();
    }
}
