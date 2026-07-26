<?php

namespace Pterodactyl\Models;

use Pterodactyl\Enums\BackupAdapter;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;

/**
 * Backup model.
 *
 * @property int $id
 * @property int $server_id
 * @property string $uuid
 * @property bool $is_successful
 * @property bool $is_locked
 * @property bool $is_automatic
 * @property string $name
 * @property string[] $ignored_files
 * @property array|null $server_state
 * @property BackupAdapter $disk
 * @property string|null $checksum
 * @property int $bytes
 * @property string|null $upload_id
 * @property string|null $snapshot_id
 * @property \Carbon\CarbonImmutable|null $completed_at
 * @property \Carbon\CarbonImmutable $created_at
 * @property \Carbon\CarbonImmutable $updated_at
 * @property \Carbon\CarbonImmutable|null $deleted_at
 * @property Server $server
 * @property ElytraJob[] $elytraJobs
 * @property AuditLog[] $audits
 */
class Backup extends Model
{
    /** @use HasFactory<\Database\Factories\BackupFactory> */
    use HasFactory;
    use SoftDeletes;

    public const RESOURCE_NAME = 'backup';

    protected $table = 'backups';

    protected bool $immutableDates = true;

    protected $casts = [
        'id' => 'int',
        'is_successful' => 'bool',
        'is_locked' => 'bool',
        'is_automatic' => 'bool',
        'ignored_files' => 'array',
        'server_state' => 'array',
        'bytes' => 'int',
        'disk' => BackupAdapter::class,
        'completed_at' => 'datetime',
    ];

    protected $attributes = [
        'is_successful' => false,
        'is_locked' => false,
        'is_automatic' => false,
        'ignored_files' => '[]',
        'checksum' => null,
        'bytes' => 0,
        'upload_id' => null,
        'snapshot_id' => null,
    ];

    protected $guarded = ['id', 'created_at', 'updated_at', 'deleted_at'];

    /**
     * Check if this backup uses the rustic backup system.
     */
    public function isRustic(): bool
    {
        return $this->disk instanceof BackupAdapter && $this->disk->isRustic();
    }

    /**
     * Check if this backup is stored locally (not in cloud storage).
     */
    public function isLocal(): bool
    {
        return $this->disk instanceof BackupAdapter && $this->disk->isLocal();
    }

    /**
     * Get the repository type for rustic backups.
     */
    public function getRepositoryType(): ?string
    {
        return $this->disk instanceof BackupAdapter ? $this->disk->getRepositoryType() : null;
    }

    /**
     * Check if this backup has a rustic snapshot ID.
     */
    public function hasSnapshotId(): bool
    {
        return !empty($this->snapshot_id);
    }

    /**
     * Get the size in gigabytes for display.
     */
    public function getSizeGbAttribute(): float
    {
        return round($this->bytes / 1024 / 1024 / 1024, 3);
    }

    public static array $validationRules = [
        'server_id' => 'bail|required|numeric|exists:servers,id',
        'uuid' => 'required|uuid',
        'is_successful' => 'boolean',
        'is_locked' => 'boolean',
        'is_automatic' => 'boolean',
        'name' => 'required|string',
        'ignored_files' => 'array',
        'server_state' => 'nullable|array',
        'disk' => 'required|string',
        'checksum' => 'nullable|string',
        'snapshot_id' => 'nullable|string|max:64',
        'bytes' => 'numeric',
        'upload_id' => 'nullable|string',
    ];

    public function server(): BelongsTo
    {
        return $this->belongsTo(Server::class);
    }

    /**
     * Get all Elytra jobs related to this backup.
     */
    public function elytraJobs(): HasMany
    {
        return $this->hasMany(ElytraJob::class, 'server_id', 'server_id')
            ->where('job_data->backup_uuid', $this->uuid);
    }

    /**
     * Get the latest Elytra job for this backup.
     */
    public function latestElytraJob()
    {
        return $this->elytraJobs()->latest('created_at')->first();
    }

    /**
     * Get the adapter type formatted for Elytra API.
     */
    public function getElytraAdapterType(): string
    {
        return $this->disk instanceof BackupAdapter ? $this->disk->getElytraAdapterType() : $this->disk;
    }

    /**
     * Scope to get successful backups.
     */
    public function scopeSuccessful($query)
    {
        return $query->where('is_successful', true);
    }

    /**
     * Scope to get failed backups.
     */
    public function scopeFailed($query)
    {
        return $query->where('is_successful', false);
    }

    /**
     * Scope to get locked backups.
     */
    public function scopeLocked($query)
    {
        return $query->where('is_locked', true);
    }

    /**
     * Scope to get automatic backups.
     */
    public function scopeAutomatic($query)
    {
        return $query->where('is_automatic', true);
    }

    /**
     * Get the route key for the model.
     */
    public function getRouteKeyName(): string
    {
        return 'uuid';
    }

    /**
     * Resolve the route binding by UUID instead of ID.
     */
    public function resolveRouteBinding($value, $field = null): ?\Illuminate\Database\Eloquent\Model
    {
        return $this->query()->where($field ?? $this->getRouteKeyName(), $value)->firstOrFail();
    }
}
