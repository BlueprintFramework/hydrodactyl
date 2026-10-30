<?php

namespace Pterodactyl\Services\Servers;

use Pterodactyl\Models\Egg;
use Pterodactyl\Models\Server;
use Illuminate\Database\ConnectionInterface;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

/**
 * Assigns a different egg to a server, keeping its startup command, docker
 * image and environment variables consistent with the new egg.
 */
class EggAssignmentService
{
    public function __construct(
        private ConnectionInterface $connection,
        private EggVariableSyncService $variableSyncService,
    ) {
    }

    public function handle(Server $server, int $eggId, int $nestId): Server
    {
        $egg = Egg::query()->with('variables')->findOrFail($eggId);

        if ((int) $egg->nest_id !== (int) $nestId) {
            throw new BadRequestHttpException(__('exceptions.server_operations.egg_not_in_nest'));
        }

        return $this->connection->transaction(function () use ($server, $egg) {
            $dockerImages = array_values($egg->docker_images ?? []);

            $server->forceFill([
                'egg_id' => $egg->id,
                'nest_id' => $egg->nest_id,
                'startup' => $egg->startup,
                'image' => $dockerImages[0] ?? $server->image,
            ])->saveOrFail();

            $server->unsetRelation('egg');
            $this->variableSyncService->handle($server, $egg);

            return $server->refresh();
        });
    }
}
