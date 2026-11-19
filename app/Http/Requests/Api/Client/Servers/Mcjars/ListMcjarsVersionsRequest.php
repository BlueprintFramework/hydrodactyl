<?php

namespace Pterodactyl\Http\Requests\Api\Client\Servers\Mcjars;

use Pterodactyl\Contracts\Http\ClientPermissionsRequest;
use Pterodactyl\Http\Requests\Api\Client\ClientApiRequest;

class ListMcjarsVersionsRequest extends ClientApiRequest implements ClientPermissionsRequest
{
    public function permission(): string
    {
        return 'startup.software';
    }

    public function rules(): array
    {
        return [
            'type' => ['required', 'string', 'max:40', 'regex:/^[A-Za-z0-9_-]+$/'],
        ];
    }
}
