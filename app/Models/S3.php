<?php

namespace Pterodactyl\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Pterodactyl\Models\S3
 *
 * @property int $id
 * @property string $name
 * @property string|null $description
 * @property string $access_key
 * @property string $secret_key
 * @property string|null $endpoint
 * @property string $region
 * @property string $bucket_name
 * @property bool $use_path_style_endpoint
 * @property bool $enabled
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 *
 * @property-read \Illuminate\Database\Eloquent\Collection|\Pterodactyl\Models\Server[] $servers
 * @property-read int|null $servers_count
 *
 * @method static \Illuminate\Database\Eloquent\Builder|S3 newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|S3 newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|S3 query()
 * @method static \Illuminate\Database\Eloquent\Builder|S3 whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder|S3 whereName($value)
 * @method static \Illuminate\Database\Eloquent\Builder|S3 whereDescription($value)
 * @method static \Illuminate\Database\Eloquent\Builder|S3 whereAccessKey($value)
 * @method static \Illuminate\Database\Eloquent\Builder|S3 whereSecretKey($value)
 * @method static \Illuminate\Database\Eloquent\Builder|S3 whereEndpoint($value)
 * @method static \Illuminate\Database\Eloquent\Builder|S3 whereBucketName($value)
 * @method static \Illuminate\Database\Eloquent\Builder|S3 whereUsePathStyleEndpoints($value)
 * @method static \Illuminate\Database\Eloquent\Builder|S3 whereEnabled($value)
 * @method static \Illuminate\Database\Eloquent\Builder|S3 whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder|S3 whereUpdatedAt($value)
 *
 * @mixin \Eloquent
 */
class S3 extends Model
{
    protected $table = 's3';

    protected $fillable = [
        'name',
        'description',
        'access_key',
        'secret_key',
        'endpoint',
        'region',
        'bucket_name',
        'use_path_style_endpoint',
        'enabled',
        'is_local',
        'minio_instance_url',
    ];

    protected static array $validationRules = [
        'name' => 'required|string|max:255|unique:s3,name',
        'description' => 'nullable|string|max:1000',
        'access_key' => 'required|string|max:255',
        'secret_key' => 'required|string|max:255',
        'endpoint' => 'nullable|url|max:255',
        'region' => 'nullable|string|max:64',
        'bucket_name' => 'required|string|max:255',
        'use_path_style_endpoint' => 'boolean',
        'enabled' => 'boolean',
        'is_local' => 'boolean',
        'minio_instance_url' => 'nullable|string|max:255',
    ];

    protected $casts = [
        'use_path_style_endpoint' => 'boolean',
        'enabled'                  => 'boolean',
        'is_local'                 => 'boolean',
    ];

    protected $hidden = [
        'access_key',
        'secret_key',
    ];

    public const RESOURCE_NAME = 's3';

    public function servers(): HasMany
    {
        return $this->hasMany(Server::class, 'bucket');
    }

    public function nodes(): HasMany
    {
        return $this->hasMany(Node::class, 'bucket');
    }
    /**
     * Build a config array compatible with BackupManager::createS3Adapter().
     */
    public function toS3Config(): array
    {
        return [
            'key' => $this->access_key,
            'secret' => $this->secret_key,
            'bucket' => $this->bucket_name,
            'region' => $this->region ?: 'us-east-1',
            'endpoint' => $this->endpoint,
            'use_path_style_endpoint' => $this->use_path_style_endpoint,
        ];
    }

    /**
     * Build a config array for rustic S3 adapter usage.
     */
    public function toRusticS3Config(): array
    {
        return [
            'key' => $this->access_key,
            'secret' => $this->secret_key,
            'bucket' => $this->bucket_name,
            'region' => $this->region ?: 'us-east-1',
            'endpoint' => $this->endpoint,
            'force_path_style' => $this->use_path_style_endpoint,
            'prefix' => env('RUSTIC_S3_PREFIX', 'rustic-repos/'),
        ];
    }
}
