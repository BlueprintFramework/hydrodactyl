<?php

namespace Pterodactyl\Tests\Unit\Services\ServerOperations;

use Pterodactyl\Models\Server;
use Pterodactyl\Tests\TestCase;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;
use Pterodactyl\Services\ServerOperations\ServerStateValidationService;

class ServerStateValidationServiceTest extends TestCase
{
    private ServerStateValidationService $service;

    public function setUp(): void
    {
        parent::setUp();

        $this->service = new ServerStateValidationService();
    }

    public function testInstallingServerThrowsException()
    {
        $server = Server::factory()->make(['status' => Server::STATUS_INSTALLING]);

        $this->expectException(ConflictHttpException::class);
        $this->expectExceptionMessage('Server is currently being installed and cannot be modified.');

        $this->service->validateServerState($server);
    }

    public function testSuspendedServerThrowsException()
    {
        $server = Server::factory()->make(['status' => Server::STATUS_SUSPENDED]);

        $this->expectException(ConflictHttpException::class);
        $this->expectExceptionMessage('Server is suspended and cannot be modified.');

        $this->service->validateServerState($server);
    }

    public function testServerWithTransferThrowsException()
    {
        $server = \Mockery::mock(Server::class)->makePartial();
        $server->status = null;
        $server->setRelation('transfer', new \stdClass());

        $this->expectException(ConflictHttpException::class);
        $this->expectExceptionMessage('Server is currently being transferred and cannot be modified.');

        $this->service->validateServerState($server);
    }

    public function testNormalServerPassesValidation()
    {
        $server = \Mockery::mock(Server::class)->makePartial();
        $server->status = null;
        $server->shouldReceive('refresh')->once();

        $this->service->validateServerState($server);
    }
}
