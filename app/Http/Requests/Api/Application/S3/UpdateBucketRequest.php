<?php

namespace Pterodactyl\Http\Requests\Api\Application\S3;

class UpdateBucketRequest extends StoreBucketRequest
{
    public function rules(): array
    {
        $bucketId = $this->route()->parameter('bucket')->id;

        return [
            'name' => "required|string|max:255|unique:s3,name,{$bucketId}",
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
}
