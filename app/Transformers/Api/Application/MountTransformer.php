<?php

namespace Pterodactyl\Transformers\Api\Application;

use Pterodactyl\Models\Mount;
use Pterodactyl\Models\Egg;
use Pterodactyl\Models\Node;
use Pterodactyl\Models\Server;
use League\Fractal\Resource\Collection;
use League\Fractal\Resource\NullResource;
use Pterodactyl\Services\Acl\Api\AdminAcl;

class MountTransformer extends BaseTransformer
{
    protected array $availableIncludes = [
        'eggs',
        'nodes',
        'servers',
    ];

    public function getResourceName(): string
    {
        return Mount::RESOURCE_NAME;
    }

    public function transform(Mount $model): array
    {
        return [
            'id' => $model->id,
            'uuid' => $model->uuid,
            'name' => $model->name,
            'description' => $model->description,
            'source' => $model->source,
            'target' => $model->target,
            'read_only' => $model->read_only,
            'user_mountable' => $model->user_mountable,
        ];
    }

    public function includeEggs(Mount $model): Collection|NullResource
    {
        if (!$this->authorize(AdminAcl::RESOURCE_EGGS)) {
            return $this->null();
        }

        $model->loadMissing('eggs');

        return $this->collection($model->getRelation('eggs'), $this->makeTransformer(EggTransformer::class), Egg::RESOURCE_NAME);
    }

    public function includeNodes(Mount $model): Collection|NullResource
    {
        if (!$this->authorize(AdminAcl::RESOURCE_NODES)) {
            return $this->null();
        }

        $model->loadMissing('nodes');

        return $this->collection($model->getRelation('nodes'), $this->makeTransformer(NodeTransformer::class), Node::RESOURCE_NAME);
    }

    public function includeServers(Mount $model): Collection|NullResource
    {
        if (!$this->authorize(AdminAcl::RESOURCE_SERVERS)) {
            return $this->null();
        }

        $model->loadMissing('servers');

        return $this->collection($model->getRelation('servers'), $this->makeTransformer(ServerTransformer::class), Server::RESOURCE_NAME);
    }
}
