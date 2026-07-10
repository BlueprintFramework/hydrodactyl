<?php

namespace Pterodactyl\Http\Requests\Api\Application\ApiKeys;

use Pterodactyl\Models\ApiKey;
use Pterodactyl\Services\Acl\Api\AdminAcl;
use Pterodactyl\Http\Requests\Api\Application\ApplicationApiRequest;

class StoreApiKeyRequest extends ApplicationApiRequest
{
    protected ?string $resource = AdminAcl::RESOURCE_USERS;

    protected int $permission = AdminAcl::WRITE;

    public function rules(): array
    {
        return collect(ApiKey::getRules())->only([
            'memo',
            'allowed_ips',
            'expires_at',
        ])->toArray();
    }

    public function permissions(): array
    {
        $resources = AdminAcl::getResourceList();
        $permissions = [];

        if ($this->has('permissions') && is_array($this->input('permissions'))) {
            foreach ($this->input('permissions') as $resource => $value) {
                $permissions['r_' . $resource] = (int) $value;
            }
        }

        foreach ($resources as $resource) {
            $column = 'r_' . $resource;
            if ($this->has($column)) {
                $permissions[$column] = (int) $this->input($column);
            }
        }

        return $permissions;
    }
}
