<?php

namespace Pterodactyl\Console\Commands\Server;

use Exception;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Pterodactyl\Models\Server;
use Pterodactyl\Enums\Daemon\DaemonType;
use Pterodactyl\Services\Servers\RecordServerResourceSampleService;

class RecordResourceUsageCommand extends Command
{
    protected $signature = 'p:server:record-resources';

    protected $description = 'Record a resource usage sample for every running server.';

    public function __construct(private RecordServerResourceSampleService $samples)
    {
        parent::__construct();
    }

    public function handle(): int
    {
        if (!config('pterodactyl.client_features.resource_history.enabled', true)) {
            $this->line('Resource history is disabled.');

            return 0;
        }

        $recorded = 0;

        Server::query()
            ->with('node')
            ->whereNull('status')
            ->each(function (Server $server) use (&$recorded) {
                $type = strtolower($server->node->daemonType ?? DaemonType::WINGS->value);
                $repository = match ($type) {
                    DaemonType::ELYTRA->value => app(\Pterodactyl\Repositories\Elytra\DaemonServerRepository::class),
                    DaemonType::CALAGOPUS->value => app(\Pterodactyl\Repositories\Calagopus\DaemonServerRepository::class),
                    default => app(\Pterodactyl\Repositories\Wings\DaemonServerRepository::class),
                };

                try {
                    $details = $repository->setServer($server)->getDetails();
                    $this->samples->handle($server, $details);
                    ++$recorded;
                } catch (Exception $exception) {
                    Log::warning('Failed to record resource usage for server ' . $server->uuid, [
                        'exception' => $exception->getMessage(),
                    ]);
                }
            });

        $this->line("Recorded resource usage for {$recorded} server(s).");

        return 0;
    }
}
