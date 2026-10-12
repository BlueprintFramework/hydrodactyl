<?php

namespace Pterodactyl\Http\Controllers\Admin\Api;

use Ramsey\Uuid\Uuid;
use Illuminate\Http\Request;
use Pterodactyl\Models\Egg;
use Pterodactyl\Models\Nest;
use Pterodactyl\Models\Mount;
use Pterodactyl\Models\Node;
use Pterodactyl\Models\Location;
use Illuminate\Http\JsonResponse;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Http\Requests\Admin\MountFormRequest;
use Pterodactyl\Repositories\Eloquent\MountRepository;

class MountController extends Controller
{
    /**
     * MountController constructor.
     */
    public function __construct(private MountRepository $repository)
    {
    }

    /**
     * Return every mount with its relation counts.
     */
    public function index(): JsonResponse
    {
        return response()->json([
            'data' => $this->repository->getAllWithDetails()
                ->map(fn (Mount $mount) => [
                    'id' => $mount->id,
                    'uuid' => $mount->uuid,
                    'name' => $mount->name,
                    'description' => $mount->description,
                    'source' => $mount->source,
                    'target' => $mount->target,
                    'read_only' => (bool) $mount->read_only,
                    'user_mountable' => (bool) $mount->user_mountable,
                    'eggs_count' => (int) $mount->eggs_count,
                    'nodes_count' => (int) $mount->nodes_count,
                    'servers_count' => (int) $mount->servers_count,
                ])
                ->values(),
        ]);
    }

    /**
     * Return a single mount with its attached eggs/nodes and the options to attach more.
     */
    public function view(Mount $mount): JsonResponse
    {
        $mount = $this->repository->getWithRelations($mount->id);

        $nests = Nest::query()->with('eggs')->get();
        $locations = Location::query()->with('nodes')->get();

        return response()->json([
            'data' => [
                'id' => $mount->id,
                'uuid' => $mount->uuid,
                'name' => $mount->name,
                'description' => $mount->description,
                'source' => $mount->source,
                'target' => $mount->target,
                'read_only' => (bool) $mount->read_only,
                'user_mountable' => (bool) $mount->user_mountable,
                'eggs' => $mount->eggs
                    ->map(fn (Egg $egg) => ['id' => $egg->id, 'name' => $egg->name])
                    ->values(),
                'nodes' => $mount->nodes
                    ->map(fn (Node $node) => ['id' => $node->id, 'name' => $node->name, 'fqdn' => $node->fqdn])
                    ->values(),
            ],
            'nests' => $nests
                ->map(fn (Nest $nest) => [
                    'id' => $nest->id,
                    'name' => $nest->name,
                    'eggs' => $nest->eggs
                        ->map(fn (Egg $egg) => ['id' => $egg->id, 'name' => $egg->name])
                        ->values(),
                ])
                ->values(),
            'locations' => $locations
                ->map(fn (Location $location) => [
                    'id' => $location->id,
                    'short' => $location->short,
                    'long' => $location->long,
                    'nodes' => $location->nodes
                        ->map(fn (Node $node) => ['id' => $node->id, 'name' => $node->name])
                        ->values(),
                ])
                ->values(),
        ]);
    }

    /**
     * Create a new mount.
     */
    public function store(MountFormRequest $request): JsonResponse
    {
        $mount = (new Mount())->fill($request->validated());
        $mount->forceFill(['uuid' => Uuid::uuid4()->toString()]);
        $mount->saveOrFail();

        return response()->json(['data' => ['id' => $mount->id]], JsonResponse::HTTP_CREATED);
    }

    /**
     * Update an existing mount.
     */
    public function update(MountFormRequest $request, Mount $mount): JsonResponse
    {
        $mount->forceFill($request->validated())->save();

        return response()->json(['data' => ['id' => $mount->id]]);
    }

    /**
     * Delete a mount.
     */
    public function destroy(Mount $mount): JsonResponse
    {
        $mount->delete();

        return response()->json([], JsonResponse::HTTP_NO_CONTENT);
    }

    /**
     * Attach eggs to a mount.
     */
    public function addEggs(Request $request, Mount $mount): JsonResponse
    {
        $data = $request->validate([
            'eggs' => 'required|array',
            'eggs.*' => 'integer|exists:eggs,id',
        ]);

        $mount->eggs()->syncWithoutDetaching($data['eggs']);

        return response()->json([]);
    }

    /**
     * Attach nodes to a mount.
     */
    public function addNodes(Request $request, Mount $mount): JsonResponse
    {
        $data = $request->validate([
            'nodes' => 'required|array',
            'nodes.*' => 'integer|exists:nodes,id',
        ]);

        $mount->nodes()->syncWithoutDetaching($data['nodes']);

        return response()->json([]);
    }

    /**
     * Detach an egg from a mount.
     */
    public function deleteEgg(Mount $mount, int $egg): JsonResponse
    {
        $mount->eggs()->detach($egg);

        return response()->json([], JsonResponse::HTTP_NO_CONTENT);
    }

    /**
     * Detach a node from a mount.
     */
    public function deleteNode(Mount $mount, int $node): JsonResponse
    {
        $mount->nodes()->detach($node);

        return response()->json([], JsonResponse::HTTP_NO_CONTENT);
    }
}
