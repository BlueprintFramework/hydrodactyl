<?php

namespace Pterodactyl\Console\Commands\Maintenance;

use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Pterodactyl\Models\Server;

/**
 * Safety net for servers left in "installing" after a daemon callback never
 * arrives (hung install container, image pull failure, Wings crash).
 */
class ClearStuckInstallingServersCommand extends Command
{
    protected $signature = 'p:maintenance:clear-stuck-installing
                            {--minutes= : Minutes a server may remain installing before being marked failed}';

    protected $description = 'Mark servers stuck in "installing" as reinstall_failed.';

    public function handle(): int
    {
        $minutes = (int) ($this->option('minutes')
            ?: config('server_operations.timeouts.stuck_installing_minutes', 45));
        $cutoff = Carbon::now()->subMinutes(max($minutes, 5));

        $stuck = Server::query()
            ->where('status', Server::STATUS_INSTALLING)
            ->where('updated_at', '<', $cutoff)
            ->get();

        if ($stuck->isEmpty()) {
            $this->info('No stuck installing servers found.');

            return self::SUCCESS;
        }

        foreach ($stuck as $server) {
            $server->update(['status' => Server::STATUS_REINSTALL_FAILED]);
            Log::warning('Cleared stuck installing server', [
                'server_id' => $server->id,
                'uuid' => $server->uuid,
                'stuck_since' => $server->updated_at?->toIso8601String(),
                'threshold_minutes' => $minutes,
            ]);
            $this->warn("Server #{$server->id} ({$server->uuid}) → reinstall_failed");
        }

        $this->info("Marked {$stuck->count()} stuck server(s) as reinstall_failed.");

        return self::SUCCESS;
    }
}
