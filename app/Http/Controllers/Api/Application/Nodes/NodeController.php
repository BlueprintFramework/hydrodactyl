<?php

namespace Pterodactyl\Http\Controllers\Api\Application\Nodes;

use Pterodactyl\Models\Node;
use Illuminate\Http\JsonResponse;
use Spatie\QueryBuilder\QueryBuilder;
use Pterodactyl\Services\Nodes\NodeUpdateService;
use Pterodactyl\Services\Nodes\NodeCreationService;
use Pterodactyl\Services\Nodes\NodeDeletionService;
use Pterodactyl\Transformers\Api\Application\NodeTransformer;
use Pterodactyl\Http\Requests\Api\Application\Nodes\GetNodeRequest;
use Pterodactyl\Http\Requests\Api\Application\Nodes\GetNodesRequest;
use Pterodactyl\Http\Requests\Api\Application\Nodes\StoreNodeRequest;
use Pterodactyl\Http\Requests\Api\Application\Nodes\DeleteNodeRequest;
use Pterodactyl\Http\Requests\Api\Application\Nodes\UpdateNodeRequest;
use Pterodactyl\Http\Controllers\Api\Application\ApplicationApiController;

class NodeController extends ApplicationApiController
{
    /**
     * NodeController constructor.
     */
    public function __construct(
        private NodeCreationService $creationService,
        private NodeDeletionService $deletionService,
        private NodeUpdateService $updateService,
    ) {
        parent::__construct();
    }

    /**
     * List all nodes.
     */
    public function index(GetNodesRequest $request): array
    {
        $nodes = QueryBuilder::for(Node::query())
          ->allowedFilters(['uuid', 'name', 'fqdn', 'daemon_token_id'])
          ->allowedSorts(['id', 'uuid', 'memory', 'disk'])
          ->paginate($request->query('per_page') ?? 50);

        return $this->fractal->collection($nodes)
          ->transformWith($this->getTransformer(NodeTransformer::class))
          ->toArray();
    }

    /**
     * View a single node.
     */
    public function view(GetNodeRequest $request, Node $node): array
    {
        return $this->fractal->item($node)
          ->transformWith($this->getTransformer(NodeTransformer::class))
          ->toArray();
    }

    /**
     * Create a new node.
     *
     * @throws \Pterodactyl\Exceptions\Model\DataValidationException
     */
    public function store(StoreNodeRequest $request): JsonResponse
    {
        $node = $this->creationService->handle($request->validated());

        return $this->fractal->item($node)
          ->transformWith($this->getTransformer(NodeTransformer::class))
          ->addMeta([
              'resource' => route('api.application.nodes.view', [
                  'node' => $node->id,
              ]),
          ])
          ->respond(201);
    }

    /**
     * Update a node.
     *
     * @throws \Throwable
     */
    public function update(UpdateNodeRequest $request, Node $node): array
    {
        $node = $this->updateService->handle(
            $node,
            $request->validated(),
            $request->input('reset_secret') === true
        );

        return $this->fractal->item($node)
          ->transformWith($this->getTransformer(NodeTransformer::class))
          ->toArray();
    }

    /**
     * Delete a node.
     *
     * @throws \Pterodactyl\Exceptions\Service\HasActiveServersException
     */
    public function delete(DeleteNodeRequest $request, Node $node): JsonResponse
    {
        $this->deletionService->handle($node);

        return new JsonResponse([], JsonResponse::HTTP_NO_CONTENT);
    }
}
