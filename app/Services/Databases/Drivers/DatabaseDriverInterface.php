<?php

namespace Pterodactyl\Services\Databases\Drivers;

use Pterodactyl\Models\Database;
use Pterodactyl\Models\DatabaseHost;

interface DatabaseDriverInterface
{
    public function type(): string;

    public function supportsRemoteConnections(): bool;

    /**
     * Validate that the supplied host credentials can connect and perform basic operations.
     *
     * @return array<string, mixed>
     */
    public function testConnection(DatabaseHost $host): array;

    /**
     * Provision database resources for the given record.
     *
     * @return array<string, mixed>
     */
    public function create(DatabaseHost $host, Database $database, string $password): array;

    /**
     * Delete any provisioned resources for the given record.
     */
    public function delete(DatabaseHost $host, Database $database): void;

    /**
     * Rotate credentials for the given record.
     *
     * @return array<string, mixed>
     */
    public function rotatePassword(DatabaseHost $host, Database $database, string $password): array;
}
