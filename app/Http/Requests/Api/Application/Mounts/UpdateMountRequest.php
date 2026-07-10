<?php

namespace Pterodactyl\Http\Requests\Api\Application\Mounts;

use Pterodactyl\Models\Mount;

class UpdateMountRequest extends StoreMountRequest
{
    public function rules(): array
    {
        $mountId = $this->route()->parameter('mount')->id;

        return collect(Mount::getRulesForUpdate($mountId))->only([
            'name',
            'description',
            'source',
            'target',
            'read_only',
            'user_mountable',
        ])->toArray();
    }
}
