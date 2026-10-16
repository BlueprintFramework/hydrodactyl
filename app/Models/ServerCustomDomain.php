<?php

namespace Pterodactyl\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $server_id
 * @property int|null $allocation_id
 * @property string $hostname
 * @property string $zone_name
 * @property array $dns_config
 * @property array $dns_records
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 * @property Server $server
 */
class ServerCustomDomain extends Model
{
    /**
     * The resource name for this model when it is transformed into an
     * API representation using fractal.
     */
    public const RESOURCE_NAME = 'server_custom_domain';

    /**
     * The table associated with the model.
     */
    protected $table = 'server_custom_domains';

    /**
     * Fields that are mass assignable.
     */
    protected $fillable = [
        'server_id',
        'allocation_id',
        'hostname',
        'zone_name',
        'dns_config',
        'dns_records',
    ];

    /**
     * The API token never leaves the panel.
     */
    protected $hidden = ['dns_config'];

    /**
     * Cast values to correct type.
     */
    protected $casts = [
        'server_id' => 'integer',
        'allocation_id' => 'integer',
        'dns_config' => 'encrypted:array',
        'dns_records' => 'array',
        self::CREATED_AT => 'datetime',
        self::UPDATED_AT => 'datetime',
    ];

    public static array $validationRules = [
        'server_id' => 'required|integer|exists:servers,id',
        'allocation_id' => 'nullable|integer',
        'hostname' => 'required|string|max:191',
        'zone_name' => 'required|string|max:191',
        'dns_config' => 'required|array',
        'dns_records' => 'sometimes|array',
    ];

    /**
     * Gets the server this domain points at.
     */
    public function server(): BelongsTo
    {
        return $this->belongsTo(Server::class);
    }

    /**
     * Gets the allocation this domain points at. Falls back to the server's
     * primary allocation when none was picked, or the picked one is no longer
     * assigned to the server.
     */
    public function resolveAllocation(): Allocation
    {
        if ($this->allocation_id !== null) {
            $allocation = $this->server->allocations->firstWhere('id', $this->allocation_id);

            if ($allocation) {
                return $allocation;
            }
        }

        return $this->server->allocation;
    }
}
