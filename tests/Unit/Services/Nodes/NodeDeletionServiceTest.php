<?php

namespace Pterodactyl\Tests\Unit\Services\Nodes;

use Mockery\MockInterface;
use Pterodactyl\Models\Node;
use Pterodactyl\Tests\TestCase;
use Illuminate\Contracts\Translation\Translator;
use Pterodactyl\Services\Nodes\NodeDeletionService;
use Pterodactyl\Contracts\Repository\NodeRepositoryInterface;
use Pterodactyl\Exceptions\Service\HasActiveServersException;
use Pterodactyl\Contracts\Repository\ServerRepositoryInterface;

class NodeDeletionServiceTest extends TestCase
{
    private MockInterface $nodeRepository;
    private MockInterface $serverRepository;
    private MockInterface $translator;
    private NodeDeletionService $service;

    public function setUp(): void
    {
        parent::setUp();

        $this->nodeRepository = $this->mock(NodeRepositoryInterface::class);
        $this->serverRepository = $this->mock(ServerRepositoryInterface::class);
        $this->translator = $this->mock(Translator::class);

        $this->service = new NodeDeletionService($this->nodeRepository, $this->serverRepository, $this->translator);
    }

    public function testNodeWithNoServersCanBeDeleted()
    {
        $node = Node::factory()->make(['id' => 1]);

        $this->nodeRepository->shouldReceive('find')
            ->with(1)
            ->andReturn($node);

        $this->serverRepository->shouldReceive('setColumns')
            ->with('id')
            ->andReturnSelf();
        $this->serverRepository->shouldReceive('findCountWhere')
            ->with([['node_id', '=', 1]])
            ->andReturn(0);

        $this->nodeRepository->shouldReceive('delete')
            ->with(1)
            ->andReturn(1);

        $result = $this->service->handle(1);

        $this->assertSame(1, $result);
    }

    public function testNodeWithActiveServersCannotBeDeleted()
    {
        $node = Node::factory()->make(['id' => 2]);

        $this->nodeRepository->shouldReceive('find')
            ->with(2)
            ->andReturn($node);

        $this->serverRepository->shouldReceive('setColumns')
            ->with('id')
            ->andReturnSelf();
        $this->serverRepository->shouldReceive('findCountWhere')
            ->with([['node_id', '=', 2]])
            ->andReturn(5);

        $this->translator->shouldReceive('get')
            ->andReturn('This node has active servers.');

        $this->expectException(HasActiveServersException::class);

        $this->service->handle(2);
    }

    public function testNodeByModelCanBeDeleted()
    {
        $node = Node::factory()->make(['id' => 3]);

        $this->serverRepository->shouldReceive('setColumns')
            ->with('id')
            ->andReturnSelf();
        $this->serverRepository->shouldReceive('findCountWhere')
            ->with([['node_id', '=', 3]])
            ->andReturn(0);

        $this->nodeRepository->shouldReceive('delete')
            ->with(3)
            ->andReturn(1);

        $result = $this->service->handle($node);

        $this->assertSame(1, $result);
    }
}
