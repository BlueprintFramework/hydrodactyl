<?php

namespace Pterodactyl\Http\Controllers\Admin\Api;

use Pterodactyl\Models\Node;
use Pterodactyl\Models\Server;
use Illuminate\Http\JsonResponse;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Contracts\Repository\ServerRepositoryInterface;

class NodeServersController extends Controller
{
    /**
     * NodeServersController constructor.
     */
    public function __construct(private ServerRepositoryInterface $serverRepository)
    {
    }

    /**
     * Return a paginated listing of servers assigned to a node.
     */
    public function index(Node $node): JsonResponse
    {
        $servers = $this->serverRepository->loadAllServersForNode($node->id, 25);

        return response()->json([
            'data' => collect($servers->items())
                ->map(fn (Server $server) => [
                    'id' => $server->id,
                    'uuid' => $server->uuid,
                    'uuidShort' => $server->uuidShort,
                    'name' => $server->name,
                    'owner' => $server->user ? [
                        'id' => $server->user->id,
                        'username' => $server->user->username,
                        'email' => $server->user->email,
                    ] : null,
                    'nest' => $server->nest?->name,
                    'egg' => $server->egg?->name,
                ])
                ->values(),
            'meta' => [
                'pagination' => [
                    'total' => $servers->total(),
                    'count' => $servers->count(),
                    'per_page' => $servers->perPage(),
                    'current_page' => $servers->currentPage(),
                    'total_pages' => $servers->lastPage(),
                ],
            ],
        ]);
    }
}
