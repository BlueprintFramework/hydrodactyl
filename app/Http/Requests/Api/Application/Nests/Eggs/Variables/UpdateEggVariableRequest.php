<?php

namespace Pterodactyl\Http\Requests\Api\Application\Nests\Eggs\Variables;

use Pterodactyl\Models\EggVariable;

class UpdateEggVariableRequest extends StoreEggVariableRequest
{
    public function rules(): array
    {
        $variableId = $this->route()->parameter('variable')->id;

        return collect(EggVariable::getRulesForUpdate($variableId))->only([
            'name',
            'description',
            'env_variable',
            'default_value',
            'user_viewable',
            'user_editable',
            'rules',
        ])->toArray();
    }
}
