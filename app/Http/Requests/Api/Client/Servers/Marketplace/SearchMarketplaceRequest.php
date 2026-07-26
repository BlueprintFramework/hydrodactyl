<?php

namespace Pterodactyl\Http\Requests\Api\Client\Servers\Marketplace;

use Pterodactyl\Models\Permission;
use Pterodactyl\Contracts\Http\ClientPermissionsRequest;
use Pterodactyl\Http\Requests\Api\Client\ClientApiRequest;

class SearchMarketplaceRequest extends ClientApiRequest implements ClientPermissionsRequest
{
    public function permission(): string
    {
        return Permission::ACTION_MOD_DOWNLOAD;
    }

    public function rules(): array
    {
        return [
            'type' => ['required', 'string', 'in:mod,plugin'],
            'source' => ['sometimes', 'nullable', 'string', 'alpha_dash'],
            'query' => ['sometimes', 'nullable', 'string', 'max:120'],
            'loader' => ['sometimes', 'nullable', 'string', 'max:40'],
            'game_version' => ['sometimes', 'nullable', 'string', 'max:20'],
            'limit' => ['sometimes', 'integer', 'min:1', 'max:50'],
            'offset' => ['sometimes', 'integer', 'min:0'],
        ];
    }
}
