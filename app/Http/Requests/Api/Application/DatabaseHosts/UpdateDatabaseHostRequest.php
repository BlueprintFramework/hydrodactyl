<?php

namespace Pterodactyl\Http\Requests\Api\Application\DatabaseHosts;

use Pterodactyl\Models\DatabaseHost;

class UpdateDatabaseHostRequest extends StoreDatabaseHostRequest
{
    public function rules(): array
    {
        $hostId = $this->route()->parameter('host')->id;

        return collect(DatabaseHost::getRulesForUpdate($hostId))->only([
            'name',
            'host',
            'port',
            'username',
            'password',
            'node_id',
        ])->toArray();
    }
}
