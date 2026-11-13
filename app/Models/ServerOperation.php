<?php

namespace Pterodactyl\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Server operations tracking model.
 *
 * Tracks long-running server operations like egg changes, reinstalls, and backup restores.
 * Provides status tracking, timeout detection, and operation lifecycle management.
 */
class ServerOperation extends Model
{
    public const STATUS_PENDING = 'pending';
    public const STATUS_RUNNING = 'running';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_FAILED = 'failed';
    public const STATUS_CANCELLED = 'cancelled';

    public const TYPE_EGG_CHANGE = 'egg_change';
    public const TYPE_MODPACK_INSTALL = 'modpack_install';
    public const TYPE_REINSTALL = 'reinstall';
    public const TYPE_BACKUP_RESTORE = 'backup_restore';

    protected $table = 'server_operations';

    protected $fillable = [
        'operation_id',
        'server_id',
        'user_id',
        'type',
        'status',
        'message',
        'parameters',
        'started_at',
    ];

    protected $casts = [
        'parameters' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'started_at' => 'datetime',
    ];

    public function server(): BelongsTo
    {
        return $this->belongsTo(Server::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function isActive(): bool
    {
        return in_array($this->status, [self::STATUS_PENDING, self::STATUS_RUNNING]);
    }

    public function isCompleted(): bool
    {
        return $this->status === self::STATUS_COMPLETED;
    }

    public function hasFailed(): bool
    {
        return $this->status === self::STATUS_FAILED;
    }

    public function scopeForServer($query, Server $server)
    {
        return $query->where('server_id', $server->id);
    }

    public function scopeActive($query)
    {
        return $query->whereIn('status', [self::STATUS_PENDING, self::STATUS_RUNNING]);
    }

    public function scopeOfType($query, string $type)
    {
        return $query->where('type', $type);
    }

    public function scopeTimedOut($query, int $timeoutMinutes = 30)
    {
        return $query->where('status', self::STATUS_RUNNING)
            ->whereNotNull('started_at')
            ->where('started_at', '<', now()->subMinutes($timeoutMinutes));
    }

    public function scopeForCleanup($query, int $daysOld = 30)
    {
        return $query->whereIn('status', [self::STATUS_COMPLETED, self::STATUS_FAILED, self::STATUS_CANCELLED])
            ->where('created_at', '<', now()->subDays($daysOld));
    }

    /**
     * Check if the operation has exceeded the timeout threshold.
     */
    public function hasTimedOut(int $timeoutMinutes = 30): bool
    {
        if (!$this->isActive() || !$this->started_at) {
            return false;
        }

        return $this->started_at->diffInMinutes(now()) > $timeoutMinutes;
    }

    /**
     * Mark operation as started and update status.
     */
    public function markAsStarted(): bool
    {
        return $this->update([
            'status' => self::STATUS_RUNNING,
            'started_at' => now(),
            'message' => __('exceptions.server_operations.operation_started'),
        ]);
    }

    /**
     * Mark operation as completed with optional message.
     */
    public function markAsCompleted(?string $message = null): bool
    {
        return $this->update([
            'status' => self::STATUS_COMPLETED,
            'message' => $message ?? __('exceptions.server_operations.operation_completed'),
        ]);
    }

    /**
     * Mark operation as failed with error message.
     */
    public function markAsFailed(string $message): bool
    {
        return $this->update([
            'status' => self::STATUS_FAILED,
            'message' => $message,
        ]);
    }

    /**
     * Update operation progress message, optionally with structured progress
     * metadata (percent, current file, recent log) stored in parameters.
     *
     * @param array{
     *     percent?: int|float,
     *     current?: string|null,
     *     done?: int,
     *     total?: int,
     *     stage?: string,
     *     log_line?: string,
     * }|null $progress
     */
    public function updateProgress(string $message, ?array $progress = null): bool
    {
        $data = ['message' => $message];

        if ($progress !== null) {
            $params = is_array($this->parameters) ? $this->parameters : [];
            $existing = is_array($params['progress'] ?? null) ? $params['progress'] : [];
            // Keep rolling log/recent across updates; scalar keys from $progress still win.
            $preservedLog = is_array($existing['log'] ?? null) ? $existing['log'] : [];
            $preservedRecent = is_array($existing['recent'] ?? null) ? $existing['recent'] : [];
            $merged = array_merge($existing, $progress);
            $merged['log'] = $preservedLog;
            $merged['recent'] = $preservedRecent;

            if (isset($progress['percent'])) {
                $merged['percent'] = max(0, min(100, (int) round((float) $progress['percent'])));
            }

            $current = $progress['current'] ?? null;
            if (is_string($current) && $current !== '') {
                array_unshift($merged['recent'], $current);
                $merged['recent'] = array_values(array_slice(array_unique($merged['recent']), 0, 24));
            }

            $logLine = $progress['log_line'] ?? $message;
            if (is_string($logLine) && $logLine !== '') {
                $last = $merged['log'][0]['text'] ?? null;
                if ($last !== $logLine) {
                    array_unshift($merged['log'], [
                        'at' => now()->toIso8601String(),
                        'text' => $logLine,
                    ]);
                    $merged['log'] = array_values(array_slice($merged['log'], 0, 50));
                }
            }
            unset($merged['log_line']);

            $params['progress'] = $merged;
            $data['parameters'] = $params;
        }

        return $this->update($data);
    }

    /**
     * Get operation duration in seconds if started.
     */
    public function getDurationInSeconds(): ?int
    {
        if (!$this->started_at) {
            return null;
        }

        return $this->started_at->diffInSeconds(now());
    }
}