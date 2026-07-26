<?php

namespace Pterodactyl\Tests\Unit\Services\Servers;

use Mockery\MockInterface;
use Pterodactyl\Models\Server;
use Pterodactyl\Tests\TestCase;
use Illuminate\Database\ConnectionInterface;
use Pterodactyl\Repositories\Wings\DaemonServerRepository;
use Pterodactyl\Services\Servers\DetailsModificationService;

class DetailsModificationServiceTest extends TestCase
{
    private MockInterface $connection;
    private MockInterface $daemonServerRepository;
    private DetailsModificationService $service;

    public function setUp(): void
    {
        parent::setUp();

        $this->connection = $this->mock(ConnectionInterface::class);
        $this->daemonServerRepository = $this->mock(DaemonServerRepository::class);

        $this->service = new DetailsModificationService($this->connection, $this->daemonServerRepository);
    }

    public function testDetailsAreUpdated()
    {
        $server = \Mockery::mock(Server::class)->makePartial();
        $server->id = 1;
        $server->owner_id = 1;
        $server->name = 'Old Name';

        $server->shouldReceive('saveOrFail')->once();

        $this->connection->shouldReceive('transaction')
            ->once()
            ->andReturnUsing(function ($callback) {
                return $callback();
            });

        $this->service->handle($server, ['name' => 'New Name', 'owner_id' => 1]);

        $this->assertSame('New Name', $server->name);
    }

    public function testOwnerChangeRevokesTokensOnWings()
    {
        $server = \Mockery::mock(Server::class)->makePartial();
        $server->id = 2;
        $server->owner_id = 1;

        $server->shouldReceive('saveOrFail')->once();

        $this->connection->shouldReceive('transaction')
            ->once()
            ->andReturnUsing(function ($callback) {
                return $callback();
            });

        $this->daemonServerRepository->shouldReceive('setServer')
            ->once()
            ->with($server)
            ->andReturnSelf();
        $this->daemonServerRepository->shouldReceive('revokeUserJTI')
            ->once()
            ->with(1);

        $this->service->handle($server, ['owner_id' => 5]);
    }

    public function testDescriptionCanBeUpdated()
    {
        $server = \Mockery::mock(Server::class)->makePartial();
        $server->id = 3;
        $server->owner_id = 1;
        $server->description = 'Old description';

        $server->shouldReceive('saveOrFail')->once();

        $this->connection->shouldReceive('transaction')
            ->once()
            ->andReturnUsing(function ($callback) {
                return $callback();
            });

        $this->service->handle($server, ['description' => 'New description', 'owner_id' => 1]);

        $this->assertSame('New description', $server->description);
    }
}
