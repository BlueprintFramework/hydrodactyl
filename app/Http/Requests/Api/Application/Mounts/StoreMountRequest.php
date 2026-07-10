<?php

namespace Pterodactyl\Http\Requests\Api\Application\Mounts;

use Pterodactyl\Models\Mount;
use Pterodactyl\Services\Acl\Api\AdminAcl;
use Pterodactyl\Http\Requests\Api\Application\ApplicationApiRequest;

class StoreMountRequest extends ApplicationApiRequest
{
    protected ?string $resource = AdminAcl::RESOURCE_NODES;

    protected int $permission = AdminAcl::WRITE;

    public function rules(): array
    {
        return collect(Mount::getRules())->only([
            'name',
            'description',
            'source',
            'target',
            'read_only',
            'user_mountable',
        ])->toArray();
    }

    public function attributes(): array
    {
        return [
            'name' => 'Mount Name',
            'description' => 'Mount Description',
            'source' => 'Source Path',
            'target' => 'Target Path',
            'read_only' => 'Read Only',
            'user_mountable' => 'User Mountable',
        ];
    }
}
