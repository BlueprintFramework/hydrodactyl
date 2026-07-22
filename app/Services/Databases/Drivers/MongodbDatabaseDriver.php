<?php

namespace Pterodactyl\Services\Databases\Drivers;

use MongoDB\Driver\Command;
use MongoDB\Driver\Manager;
use Pterodactyl\Models\Database;
use Pterodactyl\Models\DatabaseHost;
use RuntimeException;
use Illuminate\Contracts\Encryption\Encrypter;

class MongodbDatabaseDriver implements DatabaseDriverInterface
{
    public function __construct(private Encrypter $encrypter)
    {
    }

    public function type(): string
    {
        return DatabaseHost::TYPE_MONGODB;
    }

    public function supportsRemoteConnections(): bool
    {
        return true;
    }

    public function testConnection(DatabaseHost $host): array
    {
        $result = current($this->manager($host)->executeCommand('admin', new Command(['buildInfo' => 1]))->toArray());
        $version = (string) ($result->version ?? 'unknown');

        return [
            'version' => $version,
            'message' => sprintf('Successfully connected to MongoDB server (Version: %s).', $version),
        ];
    }

    public function create(DatabaseHost $host, Database $database, string $password): array
    {
        $command = [
            'createUser' => $database->username,
            'pwd' => $password,
            'roles' => [['role' => 'dbOwner', 'db' => $database->database]],
            'mechanisms' => ['SCRAM-SHA-256'],
        ];

        if ($restrictions = $this->authenticationRestrictions($database->remote)) {
            $command['authenticationRestrictions'] = $restrictions;
        }

        $this->manager($host)->executeCommand($database->database, new Command($command));

        return [];
    }

    public function delete(DatabaseHost $host, Database $database): void
    {
        $this->manager($host)->executeCommand($database->database, new Command([
            'dropUser' => $database->username,
        ]));
    }

    public function rotatePassword(DatabaseHost $host, Database $database, string $password): array
    {
        $command = [
            'updateUser' => $database->username,
            'pwd' => $password,
        ];

        if ($restrictions = $this->authenticationRestrictions($database->remote)) {
            $command['authenticationRestrictions'] = $restrictions;
        }

        $this->manager($host)->executeCommand($database->database, new Command($command));

        return [];
    }

    /**
     * @return array<int, array{clientSource: array<int, string>}>|null
     */
    private function authenticationRestrictions(string $remote): ?array
    {
        $sources = array_values(array_filter(array_map('trim', explode(',', $remote))));

        if ($sources === [] || array_intersect($sources, ['%', '*']) !== []) {
            return null;
        }

        return [[
            'clientSource' => $sources,
        ]];
    }

    private function manager(DatabaseHost $host): Manager
    {
        if (!class_exists(Manager::class)) {
            throw new RuntimeException('The MongoDB PHP extension is required to manage MongoDB database hosts.');
        }

        return new Manager(sprintf(
            'mongodb://%s:%s@%s:%d/?authSource=admin',
            rawurlencode($host->username),
            rawurlencode($this->encrypter->decrypt($host->password)),
            $host->host,
            $host->port
        ));
    }
}
