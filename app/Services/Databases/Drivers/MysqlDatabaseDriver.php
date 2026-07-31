<?php

namespace Pterodactyl\Services\Databases\Drivers;

use PDO;
use Pterodactyl\Models\Database;
use Pterodactyl\Models\DatabaseHost;
use Illuminate\Database\DatabaseManager;
use Illuminate\Contracts\Encryption\Encrypter;
use Pterodactyl\Extensions\DynamicDatabaseConnection;
use Pterodactyl\Repositories\Eloquent\DatabaseRepository;

class MysqlDatabaseDriver implements DatabaseDriverInterface
{
    public function __construct(
        private DatabaseManager $databaseManager,
        private DynamicDatabaseConnection $dynamic,
        private DatabaseRepository $repository,
        private Encrypter $encrypter,
    ) {
    }

    public function type(): string
    {
        return DatabaseHost::TYPE_MYSQL;
    }

    public function supportsRemoteConnections(): bool
    {
        return true;
    }

    public function testConnection(DatabaseHost $host): array
    {
        $this->dynamic->set('dynamic', $host);

        /** @var PDO $pdo */
        $pdo = $this->databaseManager->connection('dynamic')->getPdo();
        $version = (string) $pdo->query('SELECT VERSION()')->fetchColumn();
        $grants = $pdo->query('SHOW GRANTS FOR CURRENT_USER()')->fetchAll(PDO::FETCH_COLUMN);

        $hasGrantOption = false;
        foreach ($grants as $grant) {
            if (stripos((string) $grant, 'GRANT OPTION') !== false) {
                $hasGrantOption = true;
                break;
            }
        }

        return [
            'version' => $version,
            'has_grant_option' => $hasGrantOption,
            'message' => $hasGrantOption
                ? sprintf('Successfully connected to MariaDB/MySQL server (Version: %s).', $version)
                : sprintf('Connected to MariaDB/MySQL server (Version: %s), but the user appears to be missing GRANT OPTION.', $version),
        ];
    }

    public function create(DatabaseHost $host, Database $database, string $password): array
    {
        $this->dynamic->set('dynamic', $host);

        $this->repository->createDatabase($database->database);
        $this->repository->createUser($database->username, $database->remote, $password, $database->max_connections);
        $this->repository->assignUserToDatabase($database->database, $database->username, $database->remote);
        $this->repository->flush();

        return [];
    }

    public function delete(DatabaseHost $host, Database $database): void
    {
        $this->dynamic->set('dynamic', $host);

        $this->repository->dropDatabase($database->database);
        $this->repository->dropUser($database->username, $database->remote);
        $this->repository->flush();
    }

    public function rotatePassword(DatabaseHost $host, Database $database, string $password): array
    {
        $this->dynamic->set('dynamic', $host);

        $this->repository->dropUser($database->username, $database->remote);
        $this->repository->createUser($database->username, $database->remote, $password, $database->max_connections);
        $this->repository->assignUserToDatabase($database->database, $database->username, $database->remote);
        $this->repository->flush();

        return [];
    }
}
