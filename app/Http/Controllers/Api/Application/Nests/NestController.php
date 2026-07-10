<?php

namespace Pterodactyl\Http\Controllers\Api\Application\Nests;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Pterodactyl\Models\Nest;
use Pterodactyl\Services\Nests\NestCreationService;
use Pterodactyl\Services\Nests\NestUpdateService;
use Pterodactyl\Services\Nests\NestDeletionService;
use Pterodactyl\Contracts\Repository\NestRepositoryInterface;
use Pterodactyl\Transformers\Api\Application\NestTransformer;
use Pterodactyl\Http\Requests\Api\Application\Nests\GetNestsRequest;
use Pterodactyl\Http\Requests\Api\Application\Nests\StoreNestRequest;
use Pterodactyl\Http\Requests\Api\Application\Nests\UpdateNestRequest;
use Pterodactyl\Http\Requests\Api\Application\Nests\DeleteNestRequest;
use Pterodactyl\Http\Controllers\Api\Application\ApplicationApiController;

class NestController extends ApplicationApiController
{
    public function __construct(
        private NestRepositoryInterface $repository,
        private NestCreationService $creationService,
        private NestUpdateService $updateService,
        private NestDeletionService $deletionService,
    ) {
        parent::__construct();
    }

    public function index(GetNestsRequest $request): array
    {
        $nests = Nest::query()
            ->withCount('eggs', 'servers')
            ->paginate($request->query('per_page') ?? 50);

        return $this->fractal->collection($nests)
            ->transformWith($this->getTransformer(NestTransformer::class))
            ->toArray();
    }

    public function view(GetNestsRequest $request, Nest $nest): array
    {
        $nest->loadCount('eggs', 'servers');

        return $this->fractal->item($nest)
            ->transformWith($this->getTransformer(NestTransformer::class))
            ->toArray();
    }

    public function store(StoreNestRequest $request): JsonResponse
    {
        $nest = $this->creationService->handle($request->validated());
        $nest->loadCount('eggs', 'servers');

        return $this->fractal->item($nest)
            ->transformWith($this->getTransformer(NestTransformer::class))
            ->addMeta([
                'resource' => route('api.application.nests.view', [
                    'nest' => $nest->id,
                ]),
            ])
            ->respond(201);
    }

    public function update(UpdateNestRequest $request, Nest $nest): array
    {
        $this->updateService->handle($nest->id, $request->validated());

        return $this->fractal->item($nest->refresh()->loadCount('eggs', 'servers'))
            ->transformWith($this->getTransformer(NestTransformer::class))
            ->toArray();
    }

    public function delete(DeleteNestRequest $request, Nest $nest): Response
    {
        $this->deletionService->handle($nest->id);

        return response('', 204);
    }
}
