<?php

namespace Pterodactyl\Http\Controllers\Api\Client;

use Pterodactyl\Models\Server;
use Pterodactyl\Enums\Daemon\DaemonType;
use Pterodactyl\Transformers\Api\Client\ServerTransformer;
use Pterodactyl\Services\Servers\GetUserPermissionsService;
use Pterodactyl\Http\Requests\Api\Client\Servers\GetServerRequest;

class ServerController extends ClientApiController
{
    /**
     * ServerController constructor.
     */
    public function __construct(private GetUserPermissionsService $permissionsService)
    {
        parent::__construct();
    }

    /**
     * Get a single server.
     */
    public function index(GetServerRequest $request, Server $server): array
    {
        $server->loadMissing('node');

        $daemonType = $server->node?->daemonType;

        return $this->fractal->item($server)
            ->transformWith($this->getTransformer(ServerTransformer::class))
            ->addMeta([
                'daemonType' => $daemonType,
                'is_server_owner' => $request->user()->id === $server->owner_id,
                'user_permissions' => $this->permissionsService->handle($server, $request->user()),
            ])
            ->toArray();
    }

    /**
     * Get server resources.
     */
    public function resources(GetServerRequest $request, Server $server): array
    {
        $server->loadMissing('node');

        $daemonType = $server->node?->daemonType ?? 'elytra';
        $controllers = DaemonType::allResources();
        $controllerClass = $controllers[$daemonType];

        $controller = app($controllerClass);

        return $controller->__invoke($request, $server);
    }
}
