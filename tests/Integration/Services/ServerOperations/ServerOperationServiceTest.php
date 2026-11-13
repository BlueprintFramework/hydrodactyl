<?php

namespace Pterodactyl\Tests\Integration\Services\ServerOperations;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Pterodactyl\Models\ServerOperation;
use Pterodactyl\Services\ServerOperations\ServerOperationService;
use Pterodactyl\Tests\Integration\IntegrationTestCase;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;

class ServerOperationServiceTest extends IntegrationTestCase
{
    private ServerOperationService $service;

    public function setUp(): void
    {
        parent::setUp();

        $this->service = $this->app->make(ServerOperationService::class);
    }

    public function testCreateOperationPersistsPendingOperation(): void
    {
        $server = $this->createServerModel();
        $user = $server->user;

        $operation = $this->service->createOperation(
            $server,
            $user,
            ServerOperation::TYPE_MODPACK_INSTALL,
            ['project_id' => 'AANobbMI'],
            'queued',
        );

        $this->assertSame(ServerOperation::STATUS_PENDING, $operation->status);
        $this->assertSame(ServerOperation::TYPE_MODPACK_INSTALL, $operation->type);
        $this->assertSame($server->id, $operation->server_id);
        $this->assertSame($user->id, $operation->user_id);
        $this->assertNotEmpty($operation->operation_id);
        $this->assertFalse($this->service->canAcceptOperation($server));
    }

    public function testCreateOperationRejectsWhenActiveOperationExists(): void
    {
        $server = $this->createServerModel();
        $user = $server->user;

        $this->service->createOperation($server, $user, ServerOperation::TYPE_MODPACK_INSTALL);

        $this->expectException(ConflictHttpException::class);
        $this->service->createOperation($server, $user, ServerOperation::TYPE_EGG_CHANGE);
    }

    public function testCanAcceptOperationFailsClosedWhenDatabaseThrows(): void
    {
        $server = $this->createServerModel();
        $connection = config('database.default');
        $hostKey = "database.connections.{$connection}.host";
        $portKey = "database.connections.{$connection}.port";
        $originalHost = config($hostKey);
        $originalPort = config($portKey);

        Log::shouldReceive('warning')
            ->once()
            ->withArgs(function (string $message, array $context) use ($server): bool {
                return $message === 'Failed to check server operation capacity'
                    && ($context['server_id'] ?? null) === $server->id;
            });

        // Force the next Eloquent query to fail (disconnect alone auto-reconnects).
        config([$hostKey => '127.0.0.1', $portKey => 1]);
        DB::purge($connection);

        try {
            $this->assertFalse($this->service->canAcceptOperation($server));
        } finally {
            config([$hostKey => $originalHost, $portKey => $originalPort]);
            DB::purge($connection);
            DB::reconnect($connection);
        }
    }
}
