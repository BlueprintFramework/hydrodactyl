<?php

namespace Pterodactyl\Transformers\Api\Application;

use Pterodactyl\Models\S3;
use Pterodactyl\Services\Acl\Api\AdminAcl;

class S3Transformer extends BaseTransformer
{
    public function getResourceName(): string
    {
        return S3::RESOURCE_NAME;
    }

    public function transform(S3 $model): array
    {
        return [
            'id' => $model->id,
            'name' => $model->name,
            'description' => $model->description,
            'bucket_name' => $model->bucket_name,
            'endpoint' => $model->endpoint,
            'use_path_style_endpoint' => $model->use_path_style_endpoint,
            'is_local' => $model->is_local,
            'enabled' => $model->enabled,
            'minio_instance_url' => $model->minio_instance_url,
            $model->getCreatedAtColumn() => $this->formatTimestamp($model->created_at),
            $model->getUpdatedAtColumn() => $this->formatTimestamp($model->updated_at),
        ];
    }
}
