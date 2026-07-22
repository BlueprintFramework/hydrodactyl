<?php

namespace Pterodactyl\Services\Databases\Drivers;

use PDO;
use Pterodactyl\Models\Database;
use Pterodactyl\Models\DatabaseHost;

class PostgresqlDatabaseDriver implements DatabaseDriverInterface
{
    private const MAINTENANCE_DATABASE = 'postgres';

    public function type(): string
    {
        return DatabaseHost::TYPE_POSTGRESQL;
    }

    public function supportsRemoteConnections(): bool
    {
        return false;
    }

    public function testConnection(DatabaseHost $host): array
    {
        $pdo = $this->connect($host);
        $version = (string) $pdo->query('SELECT version()')->fetchColumn();

        return [
            'version' => $version,
            'message' => sprintf('Successfully connected to PostgreSQL server (%s).', $version),
        ];
    }

    public function create(DatabaseHost $host, Database $database, string $password): array
    {
        $pdo = $this->connect($host);

        $pdo->exec(sprintf(
            'CREATE ROLE %s WITH LOGIN PASSWORD %s%s',
            $this->quoteIdentifier($database->username),
            $pdo->quote($password),
            $database->max_connections ? sprintf(' CONNECTION LIMIT %d', $database->max_connections) : ''
        ));
        $pdo->exec(sprintf('CREATE DATABASE %s', $this->quoteIdentifier($database->database)));
        $pdo->exec(sprintf(
            'ALTER DATABASE %s OWNER TO %s',
            $this->quoteIdentifier($database->database),
            $this->quoteIdentifier($database->username)
        ));
        $pdo->exec(sprintf(
            'GRANT ALL PRIVILEGES ON DATABASE %s TO %s',
            $this->quoteIdentifier($database->database),
            $this->quoteIdentifier($database->username)
        ));

        return [];
    }

    public function delete(DatabaseHost $host, Database $database): void
    {
        $pdo = $this->connect($host);

        $pdo->exec(sprintf(
            "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = %s AND pid <> pg_backend_pid()",
            $pdo->quote($database->database)
        ));
        $pdo->exec(sprintf('DROP DATABASE IF EXISTS %s', $this->quoteIdentifier($database->database)));
        $pdo->exec(sprintf('DROP ROLE IF EXISTS %s', $this->quoteIdentifier($database->username)));
    }

    public function rotatePassword(DatabaseHost $host, Database $database, string $password): array
    {
        $pdo = $this->connect($host);

        $pdo->exec(sprintf(
            'ALTER ROLE %s WITH PASSWORD %s',
            $this->quoteIdentifier($database->username),
            $pdo->quote($password)
        ));

        return [];
    }

    private function connect(DatabaseHost $host): PDO
    {
        return new PDO(
            sprintf('pgsql:host=%s;port=%d;dbname=%s', $host->host, $host->port, self::MAINTENANCE_DATABASE),
            $host->username,
            app(\Illuminate\Contracts\Encryption\Encrypter::class)->decrypt($host->password),
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_TIMEOUT => 5,
            ]
        );
    }

    private function quoteIdentifier(string $value): string
    {
        return '"' . str_replace('"', '""', $value) . '"';
    }
}
