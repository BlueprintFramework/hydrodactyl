<?php

namespace Pterodactyl\Services\Servers;

use Illuminate\Contracts\Config\Repository as ConfigRepository;
use Illuminate\Support\Arr;
use Pterodactyl\Models\Server;
use Pterodactyl\Models\ServerResourceSample;

/**
 * Appends a resource reading to a server's history and trims it back to the
 * number of samples the panel is configured to keep.
 */
class RecordServerResourceSampleService
{
    public function __construct(private ConfigRepository $config)
    {
    }

    /**
     * @param array $details the raw daemon response from getDetails()
     */
    public function handle(Server $server, array $details): void
    {
        if (!$this->config->get('pterodactyl.client_features.resource_history.enabled', true)) {
            return;
        }

        $state = Arr::get($details, 'state', 'stopped');

        // An offline server has nothing to graph, and the console clears its
        // history when the server stops, so don't keep recording zeroes.
        if ($state === 'stopped' || $state === 'offline') {
            ServerResourceSample::query()->where('server_id', $server->id)->delete();

            return;
        }

        ServerResourceSample::query()->create([
            'server_id' => $server->id,
            'cpu_absolute' => Arr::get($details, 'utilization.cpu_absolute', 0),
            'memory_bytes' => Arr::get($details, 'utilization.memory_bytes', 0),
            'network_rx_bytes' => Arr::get($details, 'utilization.network.rx_bytes', 0),
            'network_tx_bytes' => Arr::get($details, 'utilization.network.tx_bytes', 0),
            'uptime' => Arr::get($details, 'utilization.uptime', 0),
            'recorded_at' => now(),
        ]);

        $keep = ServerResourceSample::query()
            ->where('server_id', $server->id)
            ->orderByDesc('recorded_at')
            ->limit($this->limit())
            ->pluck('id');

        ServerResourceSample::query()
            ->where('server_id', $server->id)
            ->whereNotIn('id', $keep)
            ->delete();
    }

    /**
     * How many samples a server may keep. Never fewer than the console graphs
     * display, and never more than a signed 32-bit integer can hold.
     */
    public function limit(): int
    {
        return min(
            max((int) $this->config->get('pterodactyl.client_features.resource_history.samples', 20), ServerResourceSample::HISTORY_LIMIT),
            2147483647,
        );
    }
}
