<?php

namespace Pterodactyl\Http\Controllers\Admin\Api;

use Pterodactyl\Models\Node;
use Pterodactyl\Models\Location;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Collection;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Http\Requests\Admin\LocationFormRequest;
use Pterodactyl\Services\Locations\LocationUpdateService;
use Pterodactyl\Services\Locations\LocationCreationService;
use Pterodactyl\Services\Locations\LocationDeletionService;
use Pterodactyl\Contracts\Repository\LocationRepositoryInterface;

class LocationController extends Controller
{
    /**
     * LocationController constructor.
     */
    public function __construct(
        private LocationCreationService $creationService,
        private LocationUpdateService $updateService,
        private LocationDeletionService $deletionService,
        private LocationRepositoryInterface $repository,
    ) {
    }

    /**
     * Return every location with its aggregated resource usage.
     */
    public function index(): JsonResponse
    {
        return response()->json([
            'data' => $this->repository->getAllWithDetails()
                ->map(fn (Location $location) => [
                    'id' => $location->id,
                    'short' => $location->short,
                    'long' => $location->long,
                    'nodes_count' => (int) $location->nodes_count,
                    'servers_count' => (int) $location->servers_count,
                    'memory_percent' => (int) round((float) $location->memory_percent),
                    'allocated_memory' => (int) $location->allocated_memory,
                    'total_memory' => (int) $location->total_memory,
                    'disk_percent' => (int) round((float) $location->disk_percent),
                    'allocated_disk' => (int) $location->allocated_disk,
                    'total_disk' => (int) $location->total_disk,
                ])
                ->values(),
        ]);
    }

    /**
     * Return a single location with its nodes and resource usage.
     */
    public function view(Location $location): JsonResponse
    {
        $location = $this->repository->getWithNodes($location->id);

        return response()->json([
            'data' => [
                'id' => $location->id,
                'short' => $location->short,
                'long' => $location->long,
                'memory' => $this->usage($location->nodes, 'memory'),
                'disk' => $this->usage($location->nodes, 'disk'),
                'nodes' => $location->nodes
                    ->map(fn (Node $node) => [
                        'id' => $node->id,
                        'name' => $node->name,
                        'fqdn' => $node->fqdn,
                        'memory_percent' => $this->nodeUsage($node, 'memory')['percent'],
                        'disk_percent' => $this->nodeUsage($node, 'disk')['percent'],
                        'servers_count' => $node->servers->count(),
                    ])
                    ->values(),
            ],
        ]);
    }

    /**
     * Create a new location.
     */
    public function store(LocationFormRequest $request): JsonResponse
    {
        $location = $this->creationService->handle($request->normalize());

        return response()->json(['data' => $this->basic($location)], JsonResponse::HTTP_CREATED);
    }

    /**
     * Update an existing location.
     */
    public function update(LocationFormRequest $request, Location $location): JsonResponse
    {
        $location = $this->updateService->handle($location->id, $request->normalize());

        return response()->json(['data' => $this->basic($location)]);
    }

    /**
     * Delete a location from the system.
     */
    public function destroy(Location $location): JsonResponse
    {
        $this->deletionService->handle($location->id);

        return response()->json([], JsonResponse::HTTP_NO_CONTENT);
    }

    /**
     * Reduce a location to the fields the interface actually needs to echo back.
     */
    private function basic(Location $location): array
    {
        return [
            'id' => $location->id,
            'short' => $location->short,
            'long' => $location->long,
        ];
    }

    /**
     * Aggregate resource usage across a set of nodes.
     */
    private function usage(Collection $nodes, string $key): array
    {
        $allocated = 0;
        $total = 0;

        foreach ($nodes as $node) {
            $total += $node->{$key} * (1 + ($node->{$key . '_overallocate'} / 100));
            $allocated += $node->servers->where('exclude_from_resource_calculation', false)->sum($key);
        }

        return [
            'percent' => $total > 0 ? (int) round(($allocated / $total) * 100) : 0,
            'allocated' => (int) $allocated,
            'total' => (int) $total,
        ];
    }

    /**
     * Resource usage for a single node.
     */
    private function nodeUsage(Node $node, string $key): array
    {
        $total = $node->{$key} * (1 + ($node->{$key . '_overallocate'} / 100));
        $allocated = $node->servers->where('exclude_from_resource_calculation', false)->sum($key);

        return [
            'percent' => $total > 0 ? (int) round(($allocated / $total) * 100) : 0,
            'allocated' => (int) $allocated,
            'total' => (int) $total,
        ];
    }
}
