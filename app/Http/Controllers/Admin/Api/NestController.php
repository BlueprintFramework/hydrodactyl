<?php

namespace Pterodactyl\Http\Controllers\Admin\Api;

use Pterodactyl\Models\Egg;
use Pterodactyl\Models\Nest;
use Illuminate\Http\JsonResponse;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Services\Nests\NestUpdateService;
use Pterodactyl\Services\Nests\NestCreationService;
use Pterodactyl\Services\Nests\NestDeletionService;
use Pterodactyl\Contracts\Repository\NestRepositoryInterface;
use Pterodactyl\Http\Requests\Admin\Nest\StoreNestFormRequest;

class NestController extends Controller
{
    /**
     * NestController constructor.
     */
    public function __construct(
        private NestCreationService $creationService,
        private NestUpdateService $updateService,
        private NestDeletionService $deletionService,
        private NestRepositoryInterface $repository,
    ) {
    }

    /**
     * Return every nest with its egg/server counts.
     */
    public function index(): JsonResponse
    {
        return response()->json([
            'data' => $this->repository->getWithCounts()
                ->map(fn (Nest $nest) => [
                    'id' => $nest->id,
                    'uuid' => $nest->uuid,
                    'author' => $nest->author,
                    'name' => $nest->name,
                    'description' => $nest->description,
                    'eggs_count' => (int) $nest->eggs_count,
                    'servers_count' => (int) $nest->servers_count,
                ])
                ->values(),
        ]);
    }

    /**
     * Return a single nest with its eggs.
     */
    public function view(Nest $nest): JsonResponse
    {
        $nest = $this->repository->getWithEggServers($nest->id);

        return response()->json([
            'data' => [
                'id' => $nest->id,
                'uuid' => $nest->uuid,
                'author' => $nest->author,
                'name' => $nest->name,
                'description' => $nest->description,
                'eggs' => $nest->eggs
                    ->map(fn (Egg $egg) => [
                        'id' => $egg->id,
                        'uuid' => $egg->uuid,
                        'name' => $egg->name,
                        'description' => $egg->description,
                        'author' => $egg->author,
                        'servers_count' => $egg->servers->count(),
                    ])
                    ->values(),
            ],
        ]);
    }

    /**
     * Create a new nest.
     */
    public function store(StoreNestFormRequest $request): JsonResponse
    {
        $nest = $this->creationService->handle($request->normalize());

        return response()->json(['data' => ['id' => $nest->id]], JsonResponse::HTTP_CREATED);
    }

    /**
     * Update an existing nest.
     */
    public function update(StoreNestFormRequest $request, Nest $nest): JsonResponse
    {
        $this->updateService->handle($nest->id, $request->normalize());

        return response()->json(['data' => ['id' => $nest->id]]);
    }

    /**
     * Delete a nest.
     */
    public function destroy(Nest $nest): JsonResponse
    {
        $this->deletionService->handle($nest->id);

        return response()->json([], JsonResponse::HTTP_NO_CONTENT);
    }
}
