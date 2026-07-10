<?php

namespace Pterodactyl\Http\Requests\Api\Application\Nests;

use Pterodactyl\Models\Nest;

class UpdateNestRequest extends StoreNestRequest
{
    public function rules(): array
    {
        $nestId = $this->route()->parameter('nest')->id;

        return collect(Nest::getRulesForUpdate($nestId))->only([
            'name',
            'description',
        ])->toArray();
    }
}
