<?php

namespace Pterodactyl\Http\Requests\Api\Client\Account;

use Pterodactyl\Models\User;
use Pterodactyl\Http\Requests\Api\Client\ClientApiRequest;

class UpdateNameRequest extends ClientApiRequest
{
    public function rules(): array
    {
        $rules = User::getRulesForUpdate($this->user());

        return [
            'first_name' => $rules['name_first'],
            'last_name' => $rules['name_last'],
        ];
    }
}
