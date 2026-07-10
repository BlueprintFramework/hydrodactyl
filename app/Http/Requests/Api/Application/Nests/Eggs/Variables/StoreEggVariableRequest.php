<?php

namespace Pterodactyl\Http\Requests\Api\Application\Nests\Eggs\Variables;

use Pterodactyl\Models\EggVariable;
use Pterodactyl\Services\Acl\Api\AdminAcl;
use Pterodactyl\Http\Requests\Api\Application\ApplicationApiRequest;

class StoreEggVariableRequest extends ApplicationApiRequest
{
    protected ?string $resource = AdminAcl::RESOURCE_EGGS;

    protected int $permission = AdminAcl::WRITE;

    public function rules(): array
    {
        return collect(EggVariable::getRules())->only([
            'name',
            'description',
            'env_variable',
            'default_value',
            'user_viewable',
            'user_editable',
            'rules',
        ])->toArray();
    }

    public function attributes(): array
    {
        return [
            'name' => 'Variable Name',
            'description' => 'Variable Description',
            'env_variable' => 'Environment Variable',
            'default_value' => 'Default Value',
            'user_viewable' => 'User Viewable',
            'user_editable' => 'User Editable',
            'rules' => 'Validation Rules',
        ];
    }
}
