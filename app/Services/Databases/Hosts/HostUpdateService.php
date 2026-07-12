<?php

namespace Pterodactyl\Services\Databases\Hosts;

use Pterodactyl\Models\DatabaseHost;
use Illuminate\Database\DatabaseManager;
use Illuminate\Database\ConnectionInterface;
use Illuminate\Contracts\Encryption\Encrypter;
use Pterodactyl\Services\Databases\Drivers\DatabaseDriverManager;
use Pterodactyl\Contracts\Repository\DatabaseHostRepositoryInterface;

class HostUpdateService
{
    /**
     * HostUpdateService constructor.
     */
    public function __construct(
        private ConnectionInterface $connection,
        private Encrypter $encrypter,
        private DatabaseDriverManager $drivers,
        private DatabaseHostRepositoryInterface $repository,
    ) {
    }

    /**
     * Update a database host and persist to the database.
     *
     * @throws \Throwable
     */
    public function handle(int $hostId, array $data): DatabaseHost
    {
        if (!empty(array_get($data, 'password'))) {
            $data['password'] = $this->encrypter->encrypt($data['password']);
        } else {
            unset($data['password']);
        }

        return $this->connection->transaction(function () use ($data, $hostId) {
            $host = $this->repository->update($hostId, $data);
            $this->drivers->driverFor($host)->testConnection($host);

            return $host;
        });
    }
}
