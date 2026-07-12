<?php

namespace Pterodactyl\Services\Databases\Hosts;

use Pterodactyl\Models\DatabaseHost;
use Illuminate\Database\DatabaseManager;
use Illuminate\Database\ConnectionInterface;
use Illuminate\Contracts\Encryption\Encrypter;
use Pterodactyl\Services\Databases\Drivers\DatabaseDriverManager;
use Pterodactyl\Contracts\Repository\DatabaseHostRepositoryInterface;

class HostCreationService
{
    /**
     * HostCreationService constructor.
     */
    public function __construct(
        private ConnectionInterface $connection,
        private Encrypter $encrypter,
        private DatabaseDriverManager $drivers,
        private DatabaseHostRepositoryInterface $repository,
    ) {
    }

    /**
     * Create a new database host on the Panel.
     *
     * @throws \Throwable
     */
    public function handle(array $data): DatabaseHost
    {
        return $this->connection->transaction(function () use ($data) {
            $host = $this->repository->create([
                'password' => $this->encrypter->encrypt(array_get($data, 'password')),
                'name' => array_get($data, 'name'),
                'host' => array_get($data, 'host'),
                'port' => array_get($data, 'port'),
                'username' => array_get($data, 'username'),
                'type' => array_get($data, 'type', DatabaseHost::TYPE_MYSQL),
                'max_databases' => null,
                'node_id' => array_get($data, 'node_id'),
            ]);

            // Confirm access using the provided credentials before saving data.
            $this->drivers->driverFor($host)->testConnection($host);

            return $host;
        });
    }
}
