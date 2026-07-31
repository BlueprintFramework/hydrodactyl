<?php

namespace Pterodactyl\Services\Databases\Drivers;

use Predis\Client;
use Pterodactyl\Models\Database;
use Pterodactyl\Models\DatabaseHost;
use Illuminate\Contracts\Encryption\Encrypter;

class RedisDatabaseDriver implements DatabaseDriverInterface
{
    public function __construct(private Encrypter $encrypter)
    {
    }

    public function type(): string
    {
        return DatabaseHost::TYPE_REDIS;
    }

    public function supportsRemoteConnections(): bool
    {
        return false;
    }

    public function testConnection(DatabaseHost $host): array
    {
        $client = $this->client($host);
        $info = $client->info('server');
        $version = (string) ($info['Server']['redis_version'] ?? $info['redis_version'] ?? 'unknown');

        return [
            'version' => $version,
            'message' => sprintf('Successfully connected to Redis server (Version: %s).', $version),
        ];
    }

    public function create(DatabaseHost $host, Database $database, string $password): array
    {
        $client = $this->client($host);
        $prefix = $database->database . ':*';

        $client->executeRaw([
            'ACL', 'SETUSER', $database->username,
            'on',
            '>' . $password,
            '~' . $prefix,
            '&' . $prefix,
            '+@all',
            '-@dangerous',
        ]);

        return [
            'key_prefix' => rtrim($prefix, '*'),
        ];
    }

    public function delete(DatabaseHost $host, Database $database): void
    {
        $client = $this->client($host);
        $client->executeRaw(['ACL', 'DELUSER', $database->username]);
    }

    public function rotatePassword(DatabaseHost $host, Database $database, string $password): array
    {
        $client = $this->client($host);

        $client->executeRaw([
            'ACL', 'SETUSER', $database->username,
            'on',
            'resetpass',
            '>' . $password,
        ]);

        return [
            'key_prefix' => $database->connection_details['key_prefix'] ?? ($database->database . ':'),
        ];
    }

    private function client(DatabaseHost $host): Client
    {
        $parameters = [
            'scheme' => 'tcp',
            'host' => $host->host,
            'port' => $host->port,
        ];

        if ($host->username !== '') {
            $parameters['username'] = $host->username;
        }

        $password = $this->encrypter->decrypt($host->password);
        if ($password !== '') {
            $parameters['password'] = $password;
        }

        return new Client($parameters);
    }
}
