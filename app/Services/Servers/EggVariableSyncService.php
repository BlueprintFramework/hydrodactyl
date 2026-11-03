<?php

namespace Pterodactyl\Services\Servers;

use Pterodactyl\Models\Egg;
use Pterodactyl\Models\Server;
use Pterodactyl\Models\ServerVariable;
use Illuminate\Database\ConnectionInterface;

/**
 * Synchronizes the server_variables rows with the variables of an egg.
 *
 * When a server changes its egg the old rows reference variables that no
 * longer belong to it and the new egg variables have no value assigned yet,
 * which breaks the startup variable endpoints and shows blank values in the
 * client panel. This service removes the obsolete rows and seeds the new ones
 * with the egg defaults (existing values are never overwritten).
 */
class EggVariableSyncService
{
    public function __construct(private ConnectionInterface $connection)
    {
    }

    public function handle(Server $server, Egg $egg): void
    {
        $egg->loadMissing('variables');

        $this->connection->transaction(function () use ($server, $egg) {
            $variableIds = $egg->variables->pluck('id');

            ServerVariable::query()
                ->where('server_id', $server->id)
                ->whereNotIn('variable_id', $variableIds)
                ->delete();

            foreach ($egg->variables as $variable) {
                ServerVariable::query()->firstOrCreate(
                    [
                        'server_id' => $server->id,
                        'variable_id' => $variable->id,
                    ],
                    ['variable_value' => $variable->default_value ?? '']
                );
            }
        });
    }
}
