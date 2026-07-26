<?php

namespace Pterodactyl\Tests\Unit\Services\Nodes;

use Mockery\MockInterface;
use Pterodactyl\Models\Node;
use Pterodactyl\Tests\TestCase;
use Illuminate\Database\ConnectionInterface;
use Illuminate\Contracts\Encryption\Encrypter;
use Pterodactyl\Services\Nodes\NodeUpdateService;
use Pterodactyl\Repositories\Eloquent\NodeRepository;
use Pterodactyl\Repositories\Wings\DaemonConfigurationRepository;
use Pterodactyl\Exceptions\Http\Connection\DaemonConnectionException;

class NodeUpdateServiceTest extends TestCase
{
    private MockInterface $connection;
    private MockInterface $daemonConfigurationRepository;
    private MockInterface $encrypter;
    private MockInterface $repository;
    private NodeUpdateService $service;

    public function setUp(): void
    {
        parent::setUp();

        $this->connection = $this->mock(ConnectionInterface::class);
        $this->daemonConfigurationRepository = $this->mock(DaemonConfigurationRepository::class);
        $this->encrypter = $this->mock(Encrypter::class);
        $this->repository = $this->mock(NodeRepository::class);

        $this->service = new NodeUpdateService(
            $this->connection,
            $this->daemonConfigurationRepository,
            $this->encrypter,
            $this->repository,
        );
    }

    public function testNodeIsUpdated()
    {
        $node = Node::factory()->make(['id' => 1]);

        $this->connection->shouldReceive('transaction')
            ->once()
            ->andReturnUsing(function ($callback) {
                return $callback();
            });

        $this->repository->shouldReceive('withFreshModel')
            ->once()
            ->andReturnSelf();
        $this->repository->shouldReceive('update')
            ->once()
            ->with(1, ['name' => 'Updated Node'], true, true)
            ->andReturn($node);

        $this->daemonConfigurationRepository->shouldReceive('setNode')
            ->once()
            ->with(\Mockery::type(Node::class))
            ->andReturnSelf();
        $this->daemonConfigurationRepository->shouldReceive('update')->once();

        $result = $this->service->handle($node, ['name' => 'Updated Node']);

        $this->assertInstanceOf(Node::class, $result);
    }

    public function testDaemonSyncFailureThrowsConfigurationNotPersistedException()
    {
        $node = Node::factory()->make(['id' => 2, 'fqdn' => 'node.example.com']);
        $updatedNode = Node::factory()->make(['id' => 2, 'fqdn' => 'newnode.example.com']);

        $this->connection->shouldReceive('transaction')
            ->once()
            ->andReturnUsing(function ($callback) {
                return $callback();
            });

        $this->repository->shouldReceive('withFreshModel')
            ->once()
            ->andReturnSelf();
        $this->repository->shouldReceive('update')
            ->once()
            ->with(2, ['fqdn' => 'newnode.example.com'], true, true)
            ->andReturn($updatedNode);

        $this->daemonConfigurationRepository->shouldReceive('setNode')
            ->once()
            ->andReturnSelf();
        $this->daemonConfigurationRepository->shouldReceive('update')
            ->once()
            ->andThrow(\Mockery::mock(DaemonConnectionException::class));

        $this->expectException(\Pterodactyl\Exceptions\Service\Node\ConfigurationNotPersistedException::class);

        $this->service->handle($node, ['fqdn' => 'newnode.example.com']);
    }

    public function testTokenIsReEncryptedWhenResetTokenFlagIsTrue()
    {
        $node = Node::factory()->make(['id' => 3]);

        $this->encrypter->shouldReceive('encrypt')
            ->once()
            ->andReturn('encrypted-new-token');

        $this->connection->shouldReceive('transaction')
            ->once()
            ->andReturnUsing(function ($callback) {
                return $callback();
            });

        $this->repository->shouldReceive('withFreshModel')
            ->once()
            ->andReturnSelf();
        $this->repository->shouldReceive('update')
            ->once()
            ->with(3, \Mockery::on(function ($data) {
                return isset($data['daemon_token']) && $data['daemon_token'] === 'encrypted-new-token';
            }), true, true)
            ->andReturn($node);

        $this->daemonConfigurationRepository->shouldReceive('setNode')
            ->once()
            ->andReturnSelf();
        $this->daemonConfigurationRepository->shouldReceive('update')->once();

        $this->service->handle($node, [], true);
    }
}
