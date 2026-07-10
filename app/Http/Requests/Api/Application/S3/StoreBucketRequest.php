<?php

namespace Pterodactyl\Http\Requests\Api\Application\S3;

use Pterodactyl\Services\Acl\Api\AdminAcl;
use Pterodactyl\Http\Requests\Api\Application\ApplicationApiRequest;

class StoreBucketRequest extends ApplicationApiRequest
{
    protected ?string $resource = AdminAcl::RESOURCE_NODES;

    protected int $permission = AdminAcl::WRITE;

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255|unique:s3,name',
            'description' => 'nullable|string|max:1000',
            'access_key' => 'required|string|max:255',
            'secret_key' => 'required|string|max:255',
            'endpoint' => 'nullable|url|max:255',
            'bucket_name' => 'required|string|max:255',
            'use_path_style_endpoint' => 'boolean',
            'enabled' => 'boolean',
            'is_local' => 'boolean',
            'minio_instance_url' => 'nullable|string|max:255',
        ];
    }

    public function attributes(): array
    {
        return [
            'name' => 'Bucket Name',
            'description' => 'Bucket Description',
            'access_key' => 'Access Key',
            'secret_key' => 'Secret Key',
            'endpoint' => 'Endpoint URL',
            'bucket_name' => 'S3 Bucket Name',
            'use_path_style_endpoint' => 'Use Path Style Endpoint',
            'enabled' => 'Enabled',
            'is_local' => 'Local Storage',
            'minio_instance_url' => 'MinIO Instance URL',
        ];
    }
}
