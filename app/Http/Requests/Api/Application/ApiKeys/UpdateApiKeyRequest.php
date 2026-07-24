<?php

namespace Pterodactyl\Http\Requests\Api\Application\ApiKeys;

use Pterodactyl\Models\ApiKey;
use Pterodactyl\Services\Acl\Api\AdminAcl;

class UpdateApiKeyRequest extends StoreApiKeyRequest
{
    public function rules(): array
    {
        return collect(ApiKey::getRules())->only([
            'memo',
            'allowed_ips',
            'expires_at',
        ])->toArray();
    }
}
