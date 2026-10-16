<?php

namespace Pterodactyl\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One point in a server's resource history, kept so the console graphs can be
 * drawn on page load instead of waiting for the websocket to fill them in.
 */
class ServerResourceSample extends Model
{
    public const RESOURCE_NAME = 'resource_sample';

    /**
     * How many points the console graphs show, and how many we keep per server.
     */
    public const HISTORY_LIMIT = 20;

    public $timestamps = false;

    protected $fillable = [
        'server_id',
        'cpu_absolute',
        'memory_bytes',
        'network_rx_bytes',
        'network_tx_bytes',
        'uptime',
        'recorded_at',
    ];

    protected $casts = [
        'server_id' => 'integer',
        'cpu_absolute' => 'float',
        'memory_bytes' => 'integer',
        'network_rx_bytes' => 'integer',
        'network_tx_bytes' => 'integer',
        'uptime' => 'integer',
        'recorded_at' => 'datetime',
    ];

    public function server(): BelongsTo
    {
        return $this->belongsTo(Server::class);
    }
}
