<?php

namespace Pterodactyl\Http\Requests\Api\Client\Servers\Marketplace;

use Pterodactyl\Models\Permission;
use Pterodactyl\Contracts\Http\ClientPermissionsRequest;
use Pterodactyl\Http\Requests\Api\Client\ClientApiRequest;

class StoreInstallRequest extends ClientApiRequest implements ClientPermissionsRequest
{
    public function permission(): string
    {
        return Permission::ACTION_MOD_DOWNLOAD;
    }

    public function rules(): array
    {
        return [
            'type' => ['required', 'string', 'in:mod,plugin'],
            'source' => ['required', 'string', 'max:32'],
            'project_id' => ['required', 'string', 'max:128'],
            'project_title' => ['required', 'string', 'max:255'],
            'version_id' => ['required', 'string', 'max:128'],
            'version_name' => ['required', 'string', 'max:192'],
            'filename' => ['required', 'string', 'max:255'],
        ];
    }
}
