<?php

namespace Pterodactyl\Http\Controllers\Api\Application\Nests;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Pterodactyl\Models\Egg;
use Pterodactyl\Models\Nest;
use Pterodactyl\Models\EggVariable;
use Pterodactyl\Services\Eggs\Variables\VariableCreationService;
use Pterodactyl\Services\Eggs\Variables\VariableUpdateService;
use Pterodactyl\Transformers\Api\Application\EggVariableTransformer;
use Pterodactyl\Http\Controllers\Api\Application\ApplicationApiController;
use Pterodactyl\Http\Requests\Api\Application\Nests\Eggs\Variables\GetEggVariablesRequest;
use Pterodactyl\Http\Requests\Api\Application\Nests\Eggs\Variables\GetEggVariableRequest;
use Pterodactyl\Http\Requests\Api\Application\Nests\Eggs\Variables\StoreEggVariableRequest;
use Pterodactyl\Http\Requests\Api\Application\Nests\Eggs\Variables\UpdateEggVariableRequest;
use Pterodactyl\Http\Requests\Api\Application\Nests\Eggs\Variables\DeleteEggVariableRequest;

class EggVariableController extends ApplicationApiController
{
    public function __construct(
        private VariableCreationService $creationService,
        private VariableUpdateService $updateService,
    ) {
        parent::__construct();
    }

    public function index(GetEggVariablesRequest $request, Nest $nest, Egg $egg): array
    {
        return $this->fractal->collection($egg->variables)
            ->transformWith($this->getTransformer(EggVariableTransformer::class))
            ->toArray();
    }

    public function view(GetEggVariableRequest $request, Nest $nest, Egg $egg, EggVariable $variable): array
    {
        return $this->fractal->item($variable)
            ->transformWith($this->getTransformer(EggVariableTransformer::class))
            ->toArray();
    }

    public function store(StoreEggVariableRequest $request, Nest $nest, Egg $egg): JsonResponse
    {
        $data = array_merge($request->validated(), ['egg_id' => $egg->id]);
        $variable = $this->creationService->handle($data);

        return $this->fractal->item($variable)
            ->transformWith($this->getTransformer(EggVariableTransformer::class))
            ->addMeta([
                'resource' => route('api.application.nests.eggs.variables.view', [
                    'nest' => $nest->id,
                    'egg' => $egg->id,
                    'variable' => $variable->id,
                ]),
            ])
            ->respond(201);
    }

    public function update(UpdateEggVariableRequest $request, Nest $nest, Egg $egg, EggVariable $variable): array
    {
        $this->updateService->handle($variable, $request->validated());

        return $this->fractal->item($variable->refresh())
            ->transformWith($this->getTransformer(EggVariableTransformer::class))
            ->toArray();
    }

    public function delete(DeleteEggVariableRequest $request, Nest $nest, Egg $egg, EggVariable $variable): Response
    {
        $variable->delete();

        return response('', 204);
    }
}
