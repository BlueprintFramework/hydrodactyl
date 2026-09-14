<?php

namespace Pterodactyl\Http\Controllers\Api\Client;

use Illuminate\Http\Response;
use Pterodactyl\Models\Server;
use Pterodactyl\Transformers\Api\Client\ServerTransformer;
use Pterodactyl\Services\Servers\GetUserPermissionsService;
use Pterodactyl\Http\Controllers\Api\Client\ClientApiController;
use Pterodactyl\Http\Requests\Api\Client\Servers\GetServerRequest;
use Pterodactyl\Enums\Daemon\DaemonType;
use Pterodactyl\Http\Requests\Api\Client\Servers\Settings\SetWebhookRequest;

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
     * Get a single server
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
                'allowed_webhook_types' => config('webhook.allowed_webhook_types', []),
            ])
            ->toArray();
    }

    /**
     * Get server resources
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

    /**
     * Set the webhook type and URL for the server
     */
    public function webhook(SetWebhookRequest $request, Server $server): Response
    {
        $server->loadMissing('node');

        $server->webhook_type = $request->input('webhook_type');
        $server->webhook_url = $request->input('webhook_url');
        $server->save();

        return response()->noContent();
    }
}
