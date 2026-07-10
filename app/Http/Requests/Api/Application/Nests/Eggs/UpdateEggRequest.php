<?php

namespace Pterodactyl\Http\Requests\Api\Application\Nests\Eggs;

use Pterodactyl\Models\Egg;

class UpdateEggRequest extends StoreEggRequest
{
    public function rules(): array
    {
        $eggId = $this->route()->parameter('egg')->id;

        return collect(Egg::getRulesForUpdate($eggId))->only([
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
}
