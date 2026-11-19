<?php

namespace Pterodactyl\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $server_id
 * @property string $type
 * @property string $source
 * @property string $project_id
 * @property string $project_title
 * @property string $version_id
 * @property string $version_name
 * @property string $filename
 * @property \Carbon\CarbonImmutable|null $installed_at
 * @property \Carbon\CarbonImmutable $created_at
 * @property \Carbon\CarbonImmutable $updated_at
 * @property Server $server
 */
class MarketplaceInstall extends Model
{
    public const RESOURCE_NAME = 'marketplace_install';

    protected $table = 'marketplace_installs';

    protected bool $immutableDates = true;

    protected $casts = [
        'id' => 'int',
        'server_id' => 'int',
        'installed_at' => 'datetime',
    ];

    protected $guarded = ['id', 'created_at', 'updated_at'];

    public static array $validationRules = [
        'server_id' => 'bail|required|integer|exists:servers,id',
        'type' => 'required|string|in:mod,plugin,modpack',
        'source' => 'required|string|max:32',
        'project_id' => 'required|string|max:128',
        'project_title' => 'required|string|max:255',
        'version_id' => 'required|string|max:128',
        'version_name' => 'required|string|max:192',
        'filename' => 'required|string|max:255',
    ];

    public function server(): BelongsTo
    {
        return $this->belongsTo(Server::class);
    }
}
