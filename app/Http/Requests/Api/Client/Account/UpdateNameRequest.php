<?php

namespace Pterodactyl\Http\Requests\Api\Client\Account;

use Pterodactyl\Http\Requests\Api\Client\ClientApiRequest;

class UpdateNameRequest extends ClientApiRequest
{
    public function rules(): array
    {
        return [
            'name' => 'required|string|between:1,191',
        ];
    }
}
