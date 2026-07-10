<?php

namespace Pterodactyl\Http\Requests\Api\Application\DatabaseHosts;

use Pterodactyl\Models\DatabaseHost;
use Pterodactyl\Services\Acl\Api\AdminAcl;
use Pterodactyl\Http\Requests\Api\Application\ApplicationApiRequest;

class StoreDatabaseHostRequest extends ApplicationApiRequest
{
    protected ?string $resource = AdminAcl::RESOURCE_DATABASE_HOSTS;

    protected int $permission = AdminAcl::WRITE;

    public function rules(): array
    {
        return collect(DatabaseHost::getRules())->only([
            'name',
            'host',
            'port',
            'username',
            'password',
            'node_id',
        ])->toArray();
    }

    public function attributes(): array
    {
        return [
            'name' => 'Database Host Name',
            'host' => 'Database Host Address',
            'port' => 'Database Host Port',
            'username' => 'Database Host Username',
            'password' => 'Database Host Password',
            'node_id' => 'Linked Node',
        ];
    }
}
