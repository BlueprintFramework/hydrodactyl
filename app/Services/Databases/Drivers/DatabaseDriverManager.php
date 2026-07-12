<?php

namespace Pterodactyl\Services\Databases\Drivers;

use InvalidArgumentException;
use Pterodactyl\Models\DatabaseHost;

class DatabaseDriverManager
{
    /** @var array<string, DatabaseDriverInterface> */
    private array $drivers;

    public function __construct(
        MysqlDatabaseDriver $mysql,
        PostgresqlDatabaseDriver $postgresql,
        RedisDatabaseDriver $redis,
        MongodbDatabaseDriver $mongodb,
    ) {
        $this->drivers = [
            $mysql->type() => $mysql,
            $postgresql->type() => $postgresql,
            $redis->type() => $redis,
            $mongodb->type() => $mongodb,
        ];
    }

    public function driverFor(DatabaseHost|string $host): DatabaseDriverInterface
    {
        $type = $host instanceof DatabaseHost ? $host->type : $host;

        if (!isset($this->drivers[$type])) {
            throw new InvalidArgumentException(sprintf('Unsupported database driver type "%s".', $type));
        }

        return $this->drivers[$type];
    }
}
