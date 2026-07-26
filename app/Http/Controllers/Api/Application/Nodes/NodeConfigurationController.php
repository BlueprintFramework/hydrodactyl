<?php

namespace Pterodactyl\Http\Controllers\Api\Application\Nodes;

use Pterodactyl\Models\Node;
use Illuminate\Http\JsonResponse;
use Pterodactyl\Http\Requests\Api\Application\Nodes\GetNodeRequest;
use Pterodactyl\Http\Controllers\Api\Application\ApplicationApiController;

class NodeConfigurationController extends ApplicationApiController
{
    /**
     * Get node configuration.
     */
    public function __invoke(GetNodeRequest $request, Node $node): JsonResponse
    {
        return new JsonResponse($node->getConfiguration());
    }
}
