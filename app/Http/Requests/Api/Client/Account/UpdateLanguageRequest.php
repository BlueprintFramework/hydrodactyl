<?php

namespace Pterodactyl\Http\Requests\Api\Client\Account;

use Pterodactyl\Models\User;
use Illuminate\Validation\Rule;
use Pterodactyl\Http\Requests\Api\Client\ClientApiRequest;

class UpdateLanguageRequest extends ClientApiRequest
{
    public function rules(): array
    {
        return [
            'language' => ['required', 'string', Rule::in(array_keys((new User())->getAvailableLanguages()))],
        ];
    }
}
