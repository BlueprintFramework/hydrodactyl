<?php

namespace Pterodactyl\Http\Requests\Api\Application\Nests\Eggs;

use Pterodactyl\Models\Egg;
use Pterodactyl\Services\Acl\Api\AdminAcl;
use Pterodactyl\Http\Requests\Api\Application\ApplicationApiRequest;

class StoreEggRequest extends ApplicationApiRequest
{
    protected ?string $resource = AdminAcl::RESOURCE_EGGS;

    protected int $permission = AdminAcl::WRITE;

    public function rules(): array
    {
        return collect(Egg::getRules())->only([
            'nest_id',
            'name',
            'description',
            'features',
            'docker_images',
            'startup',
            'config_from',
            'config_stop',
            'config_startup',
            'config_logs',
            'config_files',
            'update_url',
            'force_outgoing_ip',
            'file_denylist',
        ])->toArray();
    }

    public function attributes(): array
    {
        return [
            'nest_id' => 'Nest',
            'name' => 'Egg Name',
            'description' => 'Egg Description',
            'features' => 'Features',
            'docker_images' => 'Docker Images',
            'startup' => 'Startup Command',
            'config_from' => 'Config From Egg',
            'config_stop' => 'Stop Command',
            'config_startup' => 'Startup Configuration',
            'config_logs' => 'Log Configuration',
            'config_files' => 'File Configuration',
            'update_url' => 'Update URL',
            'force_outgoing_ip' => 'Force Outgoing IP',
            'file_denylist' => 'File Denylist',
        ];
    }
}
