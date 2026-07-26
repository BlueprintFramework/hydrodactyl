<?php

namespace Pterodactyl\Http\Controllers\Api\Client\Nests;

use Pterodactyl\Models\Nest;
use Pterodactyl\Transformers\Api\Client\NestTransformer;
use Pterodactyl\Contracts\Repository\NestRepositoryInterface;
use Pterodactyl\Http\Controllers\Api\Client\ClientApiController;
use Pterodactyl\Http\Requests\Api\Application\Nests\GetNestsRequest;

class NestController extends ClientApiController
{
    /**
     * NestController constructor.
     */
    public function __construct(private NestRepositoryInterface $repository)
    {
        parent::__construct();
    }

    /**
     * List all nests.
     */
    public function index(): array
    {
        $nests = $this->repository->all();

        return $this->fractal->collection($nests)
        ->transformWith($this->getTransformer(NestTransformer::class))
        ->toArray();
    }

    /**
     * View a single nest.
     */
    public function view(GetNestsRequest $request, Nest $nest): array
    {
        return $this->fractal->item($nest)
            ->transformWith($this->getTransformer(NestTransformer::class))
            ->toArray();
    }
}
