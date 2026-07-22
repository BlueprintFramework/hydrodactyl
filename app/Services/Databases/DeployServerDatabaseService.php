<?php

namespace Pterodactyl\Services\Databases;

use Webmozart\Assert\Assert;
use Illuminate\Support\Collection;
use Pterodactyl\Models\DatabaseHost;
use Pterodactyl\Models\Database;
use Pterodactyl\Models\Server;
use Pterodactyl\Exceptions\Service\Database\NoSuitableDatabaseHostException;
use Pterodactyl\Services\Databases\Drivers\DatabaseDriverManager;

class DeployServerDatabaseService
{
    /**
     * DeployServerDatabaseService constructor.
     */
    public function __construct(
        private DatabaseManagementService $managementService,
        private DatabaseDriverManager $drivers,
    )
    {
    }

    /**
     * @throws \Throwable
     * @throws \Pterodactyl\Exceptions\Service\Database\TooManyDatabasesException
     * @throws \Pterodactyl\Exceptions\Service\Database\DatabaseClientFeatureNotEnabledException
     */
    public function handle(Server $server, array $data): Database
    {
        Assert::notEmpty($data['database'] ?? null);
        Assert::notEmpty($data['remote'] ?? '%');

        $type = $data['database_type'] ?? DatabaseHost::TYPE_MYSQL;

        $hosts = DatabaseHost::query()->where('type', $type)->get()->toBase();
        if ($hosts->isEmpty()) {
            throw new NoSuitableDatabaseHostException();
        } else {
            $nodeHosts = $hosts->where('node_id', $server->node_id)->toBase();

            if ($nodeHosts->isEmpty() && !config('pterodactyl.client_features.databases.allow_random')) {
                throw new NoSuitableDatabaseHostException();
            }
        }

        return $this->managementService->create($server, [
            'database_host_id' => $nodeHosts->isEmpty()
                ? $hosts->random()->id
                : $nodeHosts->random()->id,
            'database' => DatabaseManagementService::generateUniqueDatabaseName($data['database'], $server->id),
            'remote' => $data['remote'] ?? '%',
        ]);
    }

    public function availableTypes(Server $server): Collection
    {
        $hosts = DatabaseHost::query()->get()->toBase();
        $nodeHosts = $hosts->where('node_id', $server->node_id)->toBase();

        if ($nodeHosts->isNotEmpty()) {
            return $nodeHosts->pluck('type')->unique()->values();
        }

        if (!config('pterodactyl.client_features.databases.allow_random')) {
            return collect();
        }

        return $hosts->pluck('type')->unique()->values();
    }

    public function availableTypeMetadata(Server $server): Collection
    {
        return $this->availableTypes($server)->map(function (string $type) {
            $driver = $this->drivers->driverFor($type);

            return [
                'value' => $type,
                'label' => DatabaseHost::typeLabels()[$type] ?? $type,
                'supports_remote_connections' => $driver->supportsRemoteConnections(),
            ];
        })->values();
    }
}
