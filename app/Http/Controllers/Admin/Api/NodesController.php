<?php

namespace Pterodactyl\Http\Controllers\Admin\Api;

use Pterodactyl\Models\S3;
use Pterodactyl\Models\Node;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Pterodactyl\Enums\Daemon\Adapters;
use Spatie\QueryBuilder\QueryBuilder;
use Pterodactyl\Enums\Daemon\DaemonType;
use Pterodactyl\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;
use Pterodactyl\Repositories\Eloquent\NodeRepository;
use Pterodactyl\Services\Nodes\NodeUpdateService;
use Pterodactyl\Services\Nodes\NodeCreationService;
use Pterodactyl\Services\Nodes\NodeDeletionService;
use Pterodactyl\Http\Requests\Admin\Node\NodeFormRequest;
use Pterodactyl\Contracts\Repository\LocationRepositoryInterface;
use Pterodactyl\Repositories\Wings\DaemonConfigurationRepository;

class NodesController extends Controller
{
    /**
     * NodesController constructor.
     */
    public function __construct(
        private NodeCreationService $creationService,
        private NodeUpdateService $updateService,
        private NodeDeletionService $deletionService,
        private NodeRepository $repository,
        private LocationRepositoryInterface $locationRepository,
        private DaemonConfigurationRepository $daemonConfigurationRepository,
    ) {
    }

    /**
     * Return a paginated list of nodes with their resource usage.
     */
    public function index(Request $request): JsonResponse
    {
        $nodes = QueryBuilder::for(Node::query()->with('location')->withCount('servers'))
            ->allowedFilters(['uuid', 'name'])
            ->allowedSorts(['id'])
            ->defaultSort('id')
            ->paginate(min((int) $request->query('per_page', 25), 100));

        $stats = DB::table('servers')
            ->select(
                'node_id',
                DB::raw('COALESCE(SUM(memory), 0) as sum_memory'),
                DB::raw('COALESCE(SUM(disk), 0) as sum_disk')
            )
            ->whereIn('node_id', $nodes->pluck('id'))
            ->where('exclude_from_resource_calculation', false)
            ->groupBy('node_id')
            ->get()
            ->keyBy('node_id');

        return response()->json([
            'data' => collect($nodes->items())
                ->map(function (Node $node) use ($stats) {
                    $row = $stats->get($node->id);

                    return $this->transform($node, (int) ($row->sum_memory ?? 0), (int) ($row->sum_disk ?? 0));
                })
                ->values(),
            'meta' => [
                'pagination' => [
                    'total' => $nodes->total(),
                    'count' => $nodes->count(),
                    'per_page' => $nodes->perPage(),
                    'current_page' => $nodes->currentPage(),
                    'total_pages' => $nodes->lastPage(),
                ],
            ],
        ]);
    }

    /**
     * Return the option lists used by the node forms.
     */
    public function options(): JsonResponse
    {
        return response()->json($this->optionsData());
    }

    /**
     * Return a single node with its resource usage.
     */
    public function view(Node $node): JsonResponse
    {
        $node = $this->repository->loadLocationAndServerCount($node);
        $stats = $this->repository->getUsageStatsRaw($node);

        return response()->json([
            'data' => $this->transform(
                $node,
                (int) ($stats['memory']['value'] ?? 0),
                (int) ($stats['disk']['value'] ?? 0)
            ),
        ]);
    }

    /**
     * Check whether the daemon on a node is reachable.
     *
     * This always responds with a 200 so the interface can render an up/down
     * state for every node; connection failures are reported in the payload
     * rather than as a transport error.
     */
    public function status(Node $node): JsonResponse
    {
        try {
            $data = $this->daemonConfigurationRepository->setNode($node)->getSystemInformation();
        } catch (\Throwable $exception) {
            return response()->json([
                'data' => [
                    'up' => false,
                    'version' => null,
                    'error' => $exception->getMessage(),
                ],
            ]);
        }

        return response()->json([
            'data' => [
                'up' => true,
                'version' => $data['version'] ?? null,
                'error' => null,
            ],
        ]);
    }

    /**
     * Create a new node.
     */
    public function store(NodeFormRequest $request): JsonResponse
    {
        $node = $this->creationService->handle($request->normalize());

        return response()->json(['data' => $this->transform($node)], JsonResponse::HTTP_CREATED);
    }

    /**
     * Update an existing node.
     */
    public function update(NodeFormRequest $request, Node $node): JsonResponse
    {
        $node = $this->updateService->handle($node, $request->normalize(), $request->boolean('reset_secret'));

        return response()->json(['data' => $this->transform($node)]);
    }

    /**
     * Delete a node.
     */
    public function destroy(Node $node): JsonResponse
    {
        $this->deletionService->handle($node);

        return response()->json([], JsonResponse::HTTP_NO_CONTENT);
    }

    /**
     * Build the option lists consumed by the node forms.
     */
    private function optionsData(): array
    {
        return [
            'locations' => $this->locationRepository->setColumns(['id', 'short', 'long'])
                ->all()
                ->map(fn ($location) => [
                    'id' => $location->id,
                    'short' => $location->short,
                    'long' => $location->long,
                ])
                ->values(),
            'daemonTypes' => DaemonType::values(),
            'backupDisks' => Adapters::all_sorted(),
            's3Buckets' => S3::where('enabled', true)
                ->orderBy('name')
                ->get(['id', 'name', 'bucket_name'])
                ->map(fn ($s3) => ['id' => $s3->id, 'name' => $s3->name, 'bucket_name' => $s3->bucket_name])
                ->values(),
            's3Required' => [
                Adapters::ADAPTER_WINGS_S3->value,
                Adapters::ADAPTER_RUSTIC_S3->value,
            ],
        ];
    }

    /**
     * Map a node model into the shape consumed by the admin interface.
     */
    private function transform(Node $node, int $sumMemory = 0, int $sumDisk = 0): array
    {
        return [
            'id' => $node->id,
            'uuid' => $node->uuid,
            'name' => $node->name,
            'description' => $node->description,
            'location_id' => $node->location_id,
            'location' => $node->relationLoaded('location') && $node->location ? [
                'id' => $node->location->id,
                'short' => $node->location->short,
                'long' => $node->location->long,
            ] : null,
            'fqdn' => $node->fqdn,
            'internal_fqdn' => $node->internal_fqdn,
            'scheme' => $node->scheme,
            'behind_proxy' => (bool) $node->behind_proxy,
            'public' => (bool) $node->public,
            'trust_alias' => (bool) $node->trust_alias,
            'maintenance_mode' => (bool) $node->maintenance_mode,
            'memory' => (int) $node->memory,
            'memory_overallocate' => (int) $node->memory_overallocate,
            'disk' => (int) $node->disk,
            'disk_overallocate' => (int) $node->disk_overallocate,
            'upload_size' => (int) $node->upload_size,
            'daemonListen' => (int) $node->daemonListen,
            'daemonSFTP' => (int) $node->daemonSFTP,
            'daemonBase' => $node->daemonBase,
            'daemonType' => $node->daemonType ?: 'wings',
            'backupDisk' => $node->backupDisk ?: 'wings',
            'bucket' => $node->bucket,
            'servers_count' => (int) ($node->servers_count ?? 0),
            'allocated_memory' => $sumMemory * 1024 * 1024,
            'total_memory' => $node->memory * 1024 * 1024,
            'memory_percent' => $node->memory > 0 ? round(($sumMemory / $node->memory) * 100) : 0,
            'allocated_disk' => $sumDisk * 1024 * 1024,
            'total_disk' => $node->disk * 1024 * 1024,
            'disk_percent' => $node->disk > 0 ? round(($sumDisk / $node->disk) * 100) : 0,
        ];
    }
}
