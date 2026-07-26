<?php

namespace Pterodactyl\Http\Controllers\Api\Application\Nodes;

use Pterodactyl\Services\Deployment\FindViableNodesService;
use Pterodactyl\Transformers\Api\Application\NodeTransformer;
use Pterodactyl\Http\Controllers\Api\Application\ApplicationApiController;
use Pterodactyl\Http\Requests\Api\Application\Nodes\GetDeployableNodesRequest;

class NodeDeploymentController extends ApplicationApiController
{
    /**
     * NodeDeploymentController constructor.
     */
    public function __construct(private FindViableNodesService $viableNodesService)
    {
        parent::__construct();
    }

    /**
     * Find deployable nodes.
     *
     * @throws \Pterodactyl\Exceptions\Service\Deployment\NoViableNodeException
     */
    public function __invoke(GetDeployableNodesRequest $request): array
    {
        $data = $request->validated();
        $nodes = $this->viableNodesService->setLocations($data['location_ids'] ?? [])
            ->setMemory($data['memory'])
            ->setDisk($data['disk'])
            ->handle($request->query('per_page'), $request->query('page'));

        return $this->fractal->collection($nodes)
            ->transformWith($this->getTransformer(NodeTransformer::class))
            ->toArray();
    }
}
