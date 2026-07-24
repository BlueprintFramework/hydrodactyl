<?php

namespace Pterodactyl\Http\Controllers\Api\Application\Mounts;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Pterodactyl\Models\Mount;
use Spatie\QueryBuilder\QueryBuilder;
use Pterodactyl\Transformers\Api\Application\MountTransformer;
use Pterodactyl\Http\Controllers\Api\Application\ApplicationApiController;
use Pterodactyl\Http\Requests\Api\Application\Mounts\GetMountsRequest;
use Pterodactyl\Http\Requests\Api\Application\Mounts\GetMountRequest;
use Pterodactyl\Http\Requests\Api\Application\Mounts\StoreMountRequest;
use Pterodactyl\Http\Requests\Api\Application\Mounts\UpdateMountRequest;
use Pterodactyl\Http\Requests\Api\Application\Mounts\DeleteMountRequest;

class MountController extends ApplicationApiController
{
    public function __construct() {
        parent::__construct();
    }

    public function index(GetMountsRequest $request): array
    {
        $mounts = QueryBuilder::for(Mount::query())
            ->allowedFilters(['name', 'source', 'target'])
            ->allowedSorts(['name', 'id'])
            ->paginate($request->query('per_page') ?? 50);

        return $this->fractal->collection($mounts)
            ->transformWith($this->getTransformer(MountTransformer::class))
            ->toArray();
    }

    public function view(GetMountRequest $request, Mount $mount): array
    {
        return $this->fractal->item($mount)
            ->transformWith($this->getTransformer(MountTransformer::class))
            ->toArray();
    }

    public function store(StoreMountRequest $request): JsonResponse
    {
        $mount = Mount::create($request->validated());

        return $this->fractal->item($mount)
            ->transformWith($this->getTransformer(MountTransformer::class))
            ->addMeta([
                'resource' => route('api.application.mounts.view', [
                    'mount' => $mount->id,
                ]),
            ])
            ->respond(201);
    }

    public function update(UpdateMountRequest $request, Mount $mount): array
    {
        $mount->update($request->validated());

        return $this->fractal->item($mount->refresh())
            ->transformWith($this->getTransformer(MountTransformer::class))
            ->toArray();
    }

    public function delete(DeleteMountRequest $request, Mount $mount): Response
    {
        $mount->delete();

        return response('', 204);
    }
}
