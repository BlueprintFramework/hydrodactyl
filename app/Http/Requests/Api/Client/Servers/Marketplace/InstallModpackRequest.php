<?php

namespace Pterodactyl\Http\Requests\Api\Client\Servers\Marketplace;

use Pterodactyl\Contracts\Http\ClientPermissionsRequest;
use Pterodactyl\Http\Requests\Api\Client\ClientApiRequest;
use Pterodactyl\Models\Permission;

class InstallModpackRequest extends ClientApiRequest implements ClientPermissionsRequest
{
    public function permission(): string
    {
        return Permission::ACTION_MOD_DOWNLOAD;
    }

    public function rules(): array
    {
        return [
            'project_id' => ['required', 'string', 'max:128'],
            'version_id' => ['required', 'string', 'max:128'],
            'project_title' => ['sometimes', 'nullable', 'string', 'max:255'],
            'version_name' => ['sometimes', 'nullable', 'string', 'max:192'],
            'should_backup' => ['sometimes', 'boolean'],
            'should_wipe' => ['sometimes', 'boolean'],
        ];
    }
}
