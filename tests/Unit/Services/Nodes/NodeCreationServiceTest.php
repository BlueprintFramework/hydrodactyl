<?php

namespace Pterodactyl\Tests\Unit\Services\Nodes;

use Mockery\MockInterface;
use Pterodactyl\Models\Node;
use Pterodactyl\Tests\TestCase;
use Pterodactyl\Services\Nodes\NodeCreationService;
use Pterodactyl\Contracts\Repository\NodeRepositoryInterface;

class NodeCreationServiceTest extends TestCase
{
    private MockInterface $repository;
    private NodeCreationService $service;

    public function setUp(): void
    {
        parent::setUp();

        $this->repository = $this->mock(NodeRepositoryInterface::class);

        $this->service = new NodeCreationService($this->repository);
    }

    public function testNodeIsCreated()
    {
        $data = [
            'name' => 'Test Node',
            'fqdn' => 'node.example.com',
            'scheme' => 'https',
            'memory' => 16384,
            'disk' => 1024000,
            'internal_fqdn' => '192.168.1.100',
        ];

        $this->repository->shouldReceive('create')
            ->once()
            ->with(\Mockery::on(function ($data) {
                return $data['name'] === 'Test Node'
                    && !is_null($data['daemon_token_id']);
            }), true, true)
            ->andReturn(new Node());

        $result = $this->service->handle($data);

        $this->assertInstanceOf(Node::class, $result);
    }

    public function testUseSeparateFqdnsIsSetBasedOnInternalFqdn()
    {
        $data = [
            'name' => 'Node Without Internal',
            'fqdn' => 'node2.example.com',
            'scheme' => 'https',
            'memory' => 8192,
            'disk' => 512000,
        ];

        $this->repository->shouldReceive('create')
            ->once()
            ->with(\Mockery::on(function ($data) {
                return !isset($data['use_separate_fqdns']);
            }), true, true)
            ->andReturn(new Node());

        $this->service->handle($data);
    }

    public function testUseSeparateFqdnsSetToTrueWhenInternalFqdnProvided()
    {
        $data = [
            'name' => 'Node With Internal',
            'fqdn' => 'node3.example.com',
            'scheme' => 'https',
            'memory' => 8192,
            'disk' => 512000,
            'internal_fqdn' => '10.0.0.1',
        ];

        $this->repository->shouldReceive('create')
            ->once()
            ->with(\Mockery::on(function ($data) {
                return isset($data['use_separate_fqdns']) && $data['use_separate_fqdns'] === true;
            }), true, true)
            ->andReturn(new Node());

        $this->service->handle($data);
    }
}
