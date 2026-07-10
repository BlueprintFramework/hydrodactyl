<?php

namespace Pterodactyl\Transformers\Api\Application;

use Pterodactyl\Models\ApiKey;
use Pterodactyl\Services\Acl\Api\AdminAcl;

class ApiKeyTransformer extends BaseTransformer
{
    public function getResourceName(): string
    {
        return ApiKey::RESOURCE_NAME;
    }

    public function transform(ApiKey $model): array
    {
        $permissions = [];
        foreach (AdminAcl::getResourceList() as $resource) {
            $column = AdminAcl::COLUMN_IDENTIFIER . $resource;
            $permissions[$resource] = (int) $model->{$column};
        }

        return [
            'id' => $model->id,
            'user_id' => $model->user_id,
            'key_type' => $model->key_type,
            'identifier' => $model->identifier,
            'memo' => $model->memo,
            'allowed_ips' => $model->allowed_ips,
            'last_used_at' => $model->last_used_at?->toAtomString(),
            'expires_at' => $model->expires_at?->toAtomString(),
            'permissions' => $permissions,
            $model->getCreatedAtColumn() => $this->formatTimestamp($model->created_at),
            $model->getUpdatedAtColumn() => $this->formatTimestamp($model->updated_at),
        ];
    }
}
