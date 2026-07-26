<?php

namespace Pterodactyl\Http\Controllers\Api\Application\Servers;

use Illuminate\Http\Response;
use Pterodactyl\Models\Server;
use Pterodactyl\Models\Database;
use Illuminate\Http\JsonResponse;
use Pterodactyl\Services\Databases\DatabasePasswordService;
use Pterodactyl\Services\Databases\DatabaseManagementService;
use Pterodactyl\Transformers\Api\Application\ServerDatabaseTransformer;
use Pterodactyl\Http\Controllers\Api\Application\ApplicationApiController;
use Pterodactyl\Http\Requests\Api\Application\Servers\Databases\GetServerDatabaseRequest;
use Pterodactyl\Http\Requests\Api\Application\Servers\Databases\GetServerDatabasesRequest;
use Pterodactyl\Http\Requests\Api\Application\Servers\Databases\ServerDatabaseWriteRequest;
use Pterodactyl\Http\Requests\Api\Application\Servers\Databases\StoreServerDatabaseRequest;

class DatabaseController extends ApplicationApiController
{
    /**
     * DatabaseController constructor.
     */
    public function __construct(
        private DatabaseManagementService $databaseManagementService,
        private DatabasePasswordService $databasePasswordService,
    ) {
        parent::__construct();
    }

    /**
     * List all databases for a server.
     */
    public function index(GetServerDatabasesRequest $request, Server $server): array
    {
        return $this->fractal->collection($server->databases)
            ->transformWith($this->getTransformer(ServerDatabaseTransformer::class))
            ->toArray();
    }

    /**
     * View a single server database.
     */
    public function view(GetServerDatabaseRequest $request, Server $server, Database $database): array
    {
        return $this->fractal->item($database)
            ->transformWith($this->getTransformer(ServerDatabaseTransformer::class))
            ->toArray();
    }

    /**
     * Reset a database password.
     *
     * @throws \Throwable
     */
    public function resetPassword(ServerDatabaseWriteRequest $request, Server $server, Database $database): JsonResponse
    {
        $this->databasePasswordService->handle($database);

        return new JsonResponse([], JsonResponse::HTTP_NO_CONTENT);
    }

    /**
     * Create a server database.
     *
     * @throws \Throwable
     */
    public function store(StoreServerDatabaseRequest $request, Server $server): JsonResponse
    {
        $database = $this->databaseManagementService->create($server, array_merge($request->validated(), [
            'database' => $request->databaseName(),
        ]));

        return $this->fractal->item($database)
            ->transformWith($this->getTransformer(ServerDatabaseTransformer::class))
            ->addMeta([
                'resource' => route('api.application.servers.databases.view', [
                    'server' => $server->id,
                    'database' => $database->id,
                ]),
            ])
            ->respond(Response::HTTP_CREATED);
    }

    /**
     * Delete a server database.
     */
    public function delete(ServerDatabaseWriteRequest $request, Server $server, Database $database): Response
    {
        $this->databaseManagementService->delete($database);

        return response('', 204);
    }
}
