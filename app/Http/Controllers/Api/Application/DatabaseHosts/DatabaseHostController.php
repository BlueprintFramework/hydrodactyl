<?php

namespace Pterodactyl\Http\Controllers\Api\Application\DatabaseHosts;

use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use PDOException;
use Pterodactyl\Models\DatabaseHost;
use Spatie\QueryBuilder\QueryBuilder;
use Pterodactyl\Services\Databases\Hosts\HostCreationService;
use Pterodactyl\Services\Databases\Hosts\HostUpdateService;
use Pterodactyl\Services\Databases\Hosts\HostDeletionService;
use Pterodactyl\Transformers\Api\Application\DatabaseHostTransformer;
use Pterodactyl\Http\Controllers\Api\Application\ApplicationApiController;
use Pterodactyl\Http\Requests\Api\Application\DatabaseHosts\GetDatabaseHostsRequest;
use Pterodactyl\Http\Requests\Api\Application\DatabaseHosts\GetDatabaseHostRequest;
use Pterodactyl\Http\Requests\Api\Application\DatabaseHosts\StoreDatabaseHostRequest;
use Pterodactyl\Http\Requests\Api\Application\DatabaseHosts\UpdateDatabaseHostRequest;
use Pterodactyl\Http\Requests\Api\Application\DatabaseHosts\DeleteDatabaseHostRequest;

class DatabaseHostController extends ApplicationApiController
{
    public function __construct(
        private HostCreationService $creationService,
        private HostUpdateService $updateService,
        private HostDeletionService $deletionService,
    ) {
        parent::__construct();
    }

    public function index(GetDatabaseHostsRequest $request): array
    {
        $hosts = QueryBuilder::for(DatabaseHost::query())
            ->allowedFilters(['name', 'host'])
            ->allowedSorts(['name', 'id'])
            ->paginate($request->query('per_page') ?? 50);

        return $this->fractal->collection($hosts)
            ->transformWith($this->getTransformer(DatabaseHostTransformer::class))
            ->toArray();
    }

    public function view(GetDatabaseHostRequest $request, DatabaseHost $host): array
    {
        return $this->fractal->item($host)
            ->transformWith($this->getTransformer(DatabaseHostTransformer::class))
            ->toArray();
    }

    public function store(StoreDatabaseHostRequest $request): JsonResponse
    {
        try {
            $host = $this->creationService->handle($request->validated());
        } catch (Exception $exception) {
            if ($exception instanceof PDOException || $exception->getPrevious() instanceof PDOException) {
                return response()->json([
                    'error' => 'There was an error while trying to connect to the host or while executing a query.',
                    'message' => $exception->getMessage(),
                ], 422);
            }

            throw $exception;
        }

        return $this->fractal->item($host)
            ->transformWith($this->getTransformer(DatabaseHostTransformer::class))
            ->addMeta([
                'resource' => route('api.application.database-hosts.view', [
                    'host' => $host->id,
                ]),
            ])
            ->respond(201);
    }

    public function update(UpdateDatabaseHostRequest $request, DatabaseHost $host): array
    {
        try {
            $host = $this->updateService->handle($host->id, $request->validated());
        } catch (Exception $exception) {
            if ($exception instanceof PDOException || $exception->getPrevious() instanceof PDOException) {
                abort(422, 'There was an error while trying to connect to the host or while executing a query: ' . $exception->getMessage());
            }

            throw $exception;
        }

        return $this->fractal->item($host)
            ->transformWith($this->getTransformer(DatabaseHostTransformer::class))
            ->toArray();
    }

    public function delete(DeleteDatabaseHostRequest $request, DatabaseHost $host): Response
    {
        $this->deletionService->handle($host->id);

        return response('', 204);
    }
}
