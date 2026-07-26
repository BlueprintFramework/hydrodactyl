<?php

namespace Pterodactyl\Tests\Unit\Services\Eggs;

use Mockery\MockInterface;
use Pterodactyl\Tests\TestCase;
use Pterodactyl\Services\Eggs\EggDeletionService;
use Pterodactyl\Contracts\Repository\EggRepositoryInterface;
use Pterodactyl\Exceptions\Service\Egg\HasChildrenException;
use Pterodactyl\Exceptions\Service\HasActiveServersException;
use Pterodactyl\Contracts\Repository\ServerRepositoryInterface;

class EggDeletionServiceTest extends TestCase
{
    private MockInterface $eggRepository;
    private MockInterface $serverRepository;
    private EggDeletionService $service;

    public function setUp(): void
    {
        parent::setUp();

        $this->eggRepository = $this->mock(EggRepositoryInterface::class);
        $this->serverRepository = $this->mock(ServerRepositoryInterface::class);

        $this->service = new EggDeletionService($this->serverRepository, $this->eggRepository);
    }

    public function testEggWithNoServersOrChildrenCanBeDeleted()
    {
        $this->serverRepository->shouldReceive('findCountWhere')
            ->with([['egg_id', '=', 1]])
            ->andReturn(0);

        $this->eggRepository->shouldReceive('findCountWhere')
            ->with([['config_from', '=', 1]])
            ->andReturn(0);

        $this->eggRepository->shouldReceive('delete')
            ->with(1)
            ->andReturn(1);

        $result = $this->service->handle(1);

        $this->assertSame(1, $result);
    }

    public function testEggWithActiveServersCannotBeDeleted()
    {
        $this->serverRepository->shouldReceive('findCountWhere')
            ->with([['egg_id', '=', 2]])
            ->andReturn(2);

        $this->eggRepository->shouldNotReceive('delete');

        $this->expectException(HasActiveServersException::class);

        $this->service->handle(2);
    }

    public function testEggWithChildrenCannotBeDeleted()
    {
        $this->serverRepository->shouldReceive('findCountWhere')
            ->with([['egg_id', '=', 3]])
            ->andReturn(0);

        $this->eggRepository->shouldReceive('findCountWhere')
            ->with([['config_from', '=', 3]])
            ->andReturn(1);

        $this->eggRepository->shouldNotReceive('delete');

        $this->expectException(HasChildrenException::class);

        $this->service->handle(3);
    }
}
