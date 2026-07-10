<?php

namespace Pterodactyl\Http\Controllers\Api\Application\DatabaseHosts;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
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
        $host = $this->creationService->handle($request->validated());

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
        $host = $this->updateService->handle($host->id, $request->validated());

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
