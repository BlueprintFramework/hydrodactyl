<?php

namespace Pterodactyl\Http\Requests\Api\Client\Servers\Marketplace;

use Pterodactyl\Models\Permission;
use Pterodactyl\Contracts\Http\ClientPermissionsRequest;
use Pterodactyl\Http\Requests\Api\Client\ClientApiRequest;

class ResolveInstallRequest extends ClientApiRequest implements ClientPermissionsRequest
{
    public function permission(): string
    {
        return Permission::ACTION_MOD_DOWNLOAD;
    }

    public function rules(): array
    {
        return [
            'type' => ['required', 'string', 'in:mod,plugin'],
            'source' => ['required', 'string', 'alpha_dash'],
            'project_id' => ['required', 'string', 'max:120'],
            'version_id' => ['required', 'string', 'max:120'],
        ];
    }
}
