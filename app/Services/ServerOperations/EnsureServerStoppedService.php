<?php

namespace Pterodactyl\Services\ServerOperations;

use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use Pterodactyl\Models\Server;
use Pterodactyl\Repositories\Calagopus\DaemonPowerRepository as CalagopusPowerRepository;
use Pterodactyl\Repositories\Calagopus\DaemonServerRepository as CalagopusServerRepository;
use Pterodactyl\Repositories\Elytra\DaemonPowerRepository as ElytraPowerRepository;
use Pterodactyl\Repositories\Elytra\DaemonServerRepository as ElytraServerRepository;
use Pterodactyl\Repositories\Wings\DaemonPowerRepository as WingsPowerRepository;
use Pterodactyl\Repositories\Wings\DaemonServerRepository as WingsServerRepository;

/**
 * Gracefully stops a server and waits until the daemon reports it offline
 * before destructive operations (software change / modpack install).
 */
class EnsureServerStoppedService
{
    public function __construct(
        private WingsPowerRepository $wingsPower,
        private WingsServerRepository $wingsServer,
        private ElytraPowerRepository $elytraPower,
        private ElytraServerRepository $elytraServer,
        private CalagopusPowerRepository $calagopusPower,
        private CalagopusServerRepository $calagopusServer,
    ) {}

    /**
     * Stop the server if it is online and wait until it is offline.
     * Escalates to kill if a graceful stop does not finish in time.
     *
     * @param callable(string): void|null $onProgress
     */
    public function handle(Server $server, ?callable $onProgress = null, int $timeoutSeconds = 120): void
    {
        $state = $this->currentState($server);
        if ($this->isOffline($state)) {
            $onProgress && $onProgress(__('exceptions.server_operations.progress_server_already_stopped'));

            return;
        }

        $onProgress && $onProgress(__('exceptions.server_operations.progress_stopping_server'));
        $this->sendPower($server, 'stop');

        if ($this->waitUntilOffline($server, $timeoutSeconds, $onProgress)) {
            return;
        }

        $onProgress && $onProgress(__('exceptions.server_operations.progress_killing_server'));
        try {
            $this->sendPower($server, 'kill');
        } catch (\Throwable $e) {
            Log::warning('Failed to send kill after stop timeout', [
                'server_id' => $server->id,
                'error' => $e->getMessage(),
            ]);
        }

        if (!$this->waitUntilOffline($server, 60, $onProgress)) {
            throw new \RuntimeException(__('exceptions.server_operations.server_stop_timed_out'));
        }
    }

    private function waitUntilOffline(Server $server, int $timeoutSeconds, ?callable $onProgress): bool
    {
        $deadline = Carbon::now()->addSeconds(max(5, $timeoutSeconds));
        $lastNotice = 0;
        $start = Carbon::now();

        while (Carbon::now()->lt($deadline)) {
            $state = $this->currentState($server);
            if ($this->isOffline($state)) {
                $onProgress && $onProgress(__('exceptions.server_operations.progress_server_stopped'));

                return true;
            }

            $elapsed = Carbon::now()->diffInSeconds($start);
            if ($onProgress && $elapsed - $lastNotice >= 10) {
                $onProgress(__('exceptions.server_operations.progress_waiting_for_stop', [
                    'state' => $state,
                ]));
                $lastNotice = $elapsed;
            }

            sleep(2);
        }

        return false;
    }

    private function currentState(Server $server): string
    {
        try {
            $details = $this->serverRepo($server)->setServer($server)->getDetails();
            $state = strtolower((string) ($details['state'] ?? 'offline'));

            return $state !== '' ? $state : 'offline';
        } catch (\Throwable $e) {
            Log::warning('Could not read server power state; treating as offline', [
                'server_id' => $server->id,
                'error' => $e->getMessage(),
            ]);

            // If the daemon is unreachable, continue — backup/wipe will surface real errors.
            return 'offline';
        }
    }

    private function isOffline(string $state): bool
    {
        return in_array($state, ['offline', 'stopped'], true);
    }

    private function sendPower(Server $server, string $action): void
    {
        $this->powerRepo($server)->setServer($server)->send($action);
    }

    private function powerRepo(Server $server): WingsPowerRepository|ElytraPowerRepository|CalagopusPowerRepository
    {
        return match ($this->daemonType($server)) {
            'elytra' => $this->elytraPower,
            'calagopus' => $this->calagopusPower,
            default => $this->wingsPower,
        };
    }

    private function serverRepo(Server $server): WingsServerRepository|ElytraServerRepository|CalagopusServerRepository
    {
        return match ($this->daemonType($server)) {
            'elytra' => $this->elytraServer,
            'calagopus' => $this->calagopusServer,
            default => $this->wingsServer,
        };
    }

    private function daemonType(Server $server): string
    {
        return strtolower((string) ($server->node->daemonType ?? 'wings'));
    }
}
