<?php

namespace Pterodactyl\Tests\Unit\Services\Nests;

use Mockery\MockInterface;
use Pterodactyl\Tests\TestCase;
use Pterodactyl\Services\Nests\NestDeletionService;
use Pterodactyl\Contracts\Repository\NestRepositoryInterface;
use Pterodactyl\Exceptions\Service\HasActiveServersException;
use Pterodactyl\Contracts\Repository\ServerRepositoryInterface;

class NestDeletionServiceTest extends TestCase
{
    private MockInterface $nestRepository;
    private MockInterface $serverRepository;
    private NestDeletionService $service;

    public function setUp(): void
    {
        parent::setUp();

        $this->nestRepository = $this->mock(NestRepositoryInterface::class);
        $this->serverRepository = $this->mock(ServerRepositoryInterface::class);

        $this->service = new NestDeletionService($this->serverRepository, $this->nestRepository);
    }

    public function testNestWithNoServersCanBeDeleted()
    {
        $this->serverRepository->shouldReceive('findCountWhere')
            ->with([['nest_id', '=', 1]])
            ->andReturn(0);

        $this->nestRepository->shouldReceive('delete')
            ->with(1)
            ->andReturn(1);

        $result = $this->service->handle(1);

        $this->assertSame(1, $result);
    }

    public function testNestWithActiveServersCannotBeDeleted()
    {
        $this->serverRepository->shouldReceive('findCountWhere')
            ->with([['nest_id', '=', 2]])
            ->andReturn(3);

        $this->nestRepository->shouldNotReceive('delete');

        $this->expectException(HasActiveServersException::class);

        $this->service->handle(2);
    }
}
