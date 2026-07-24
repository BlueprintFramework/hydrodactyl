<?php

namespace Pterodactyl\Http\Controllers\Api\Application\Nests;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Pterodactyl\Models\Egg;
use Pterodactyl\Models\Nest;
use Spatie\QueryBuilder\QueryBuilder;
use Pterodactyl\Services\Eggs\EggCreationService;
use Pterodactyl\Services\Eggs\EggUpdateService;
use Pterodactyl\Services\Eggs\EggDeletionService;
use Pterodactyl\Transformers\Api\Application\EggTransformer;
use Pterodactyl\Http\Requests\Api\Application\Nests\Eggs\GetEggRequest;
use Pterodactyl\Http\Requests\Api\Application\Nests\Eggs\GetEggsRequest;
use Pterodactyl\Http\Requests\Api\Application\Nests\Eggs\StoreEggRequest;
use Pterodactyl\Http\Requests\Api\Application\Nests\Eggs\UpdateEggRequest;
use Pterodactyl\Http\Requests\Api\Application\Nests\Eggs\DeleteEggRequest;
use Pterodactyl\Http\Controllers\Api\Application\ApplicationApiController;

class EggController extends ApplicationApiController
{
    public function __construct(
        private EggCreationService $creationService,
        private EggUpdateService $updateService,
        private EggDeletionService $deletionService,
    ) {
        parent::__construct();
    }

    /**
     * List all eggs in a nest
     */
    public function index(GetEggsRequest $request, Nest $nest): array
    {
        $eggs = QueryBuilder::for(Egg::query()->where('nest_id', $nest->id))
            ->allowedFilters(['name'])
            ->allowedSorts(['id', 'name'])
            ->paginate($request->query('per_page') ?? 50);

        return $this->fractal->collection($eggs)
            ->transformWith($this->getTransformer(EggTransformer::class))
            ->toArray();
    }

    /**
     * View a single egg
     */
    public function view(GetEggRequest $request, Nest $nest, Egg $egg): array
    {
        return $this->fractal->item($egg)
            ->transformWith($this->getTransformer(EggTransformer::class))
            ->toArray();
    }

    /**
     * Create a new egg for the given nest.
     */
    public function store(StoreEggRequest $request, Nest $nest): JsonResponse
    {
        $data = array_merge($request->validated(), ['nest_id' => $nest->id]);
        $egg = $this->creationService->handle($data);

        return $this->fractal->item($egg)
            ->transformWith($this->getTransformer(EggTransformer::class))
            ->addMeta([
                'resource' => route('api.application.nests.eggs.view', [
                    'nest' => $nest->id,
                    'egg' => $egg->id,
                ]),
            ])
            ->respond(201);
    }

    /**
     * Update an egg.
     */
    public function update(UpdateEggRequest $request, Nest $nest, Egg $egg): array
    {
        $this->updateService->handle($egg, $request->validated());

        return $this->fractal->item($egg->refresh())
            ->transformWith($this->getTransformer(EggTransformer::class))
            ->toArray();
    }

    /**
     * Delete an egg.
     */
    public function delete(DeleteEggRequest $request, Nest $nest, Egg $egg): Response
    {
        $this->deletionService->handle($egg->id);

        return response('', 204);
    }
}
