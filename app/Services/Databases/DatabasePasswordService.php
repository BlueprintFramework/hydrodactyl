<?php

namespace Pterodactyl\Services\Databases;

use Pterodactyl\Models\Database;
use Pterodactyl\Helpers\Utilities;
use Illuminate\Database\ConnectionInterface;
use Illuminate\Contracts\Encryption\Encrypter;
use Pterodactyl\Services\Databases\Drivers\DatabaseDriverManager;

class DatabasePasswordService
{
    /**
     * DatabasePasswordService constructor.
     */
    public function __construct(
        private ConnectionInterface $connection,
        private Encrypter $encrypter,
        private DatabaseDriverManager $drivers,
    ) {
    }

    /**
     * Updates a password for a given database.
     *
     * @throws \Throwable
     */
    public function handle(Database|int $database): string
    {
        if (is_int($database)) {
            $database = Database::query()->findOrFail($database);
        }

        $password = Utilities::randomStringWithSpecialCharacters(24);
        $database->loadMissing('host');
        $driver = $this->drivers->driverFor($database->host);

        $this->connection->transaction(function () use ($database, $password, $driver) {
            $updates = [
                'password' => $this->encrypter->encrypt($password),
            ];

            $connectionDetails = $driver->rotatePassword($database->host, $database, $password);
            if ($connectionDetails !== []) {
                $updates['connection_details'] = $connectionDetails;
            }

            $database->forceFill($updates)->saveOrFail();
        });

        return $password;
    }
}
