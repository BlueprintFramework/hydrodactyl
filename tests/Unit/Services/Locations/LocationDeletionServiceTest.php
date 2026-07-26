<?php

namespace Pterodactyl\Tests\Unit\Services\Locations;

use Mockery\MockInterface;
use Pterodactyl\Tests\TestCase;
use Pterodactyl\Models\Location;
use Pterodactyl\Services\Locations\LocationDeletionService;
use Pterodactyl\Contracts\Repository\NodeRepositoryInterface;
use Pterodactyl\Contracts\Repository\LocationRepositoryInterface;
use Pterodactyl\Exceptions\Service\Location\HasActiveNodesException;

class LocationDeletionServiceTest extends TestCase
{
    private MockInterface $locationRepository;
    private MockInterface $nodeRepository;
    private LocationDeletionService $service;

    public function setUp(): void
    {
        parent::setUp();

        $this->locationRepository = $this->mock(LocationRepositoryInterface::class);
        $this->nodeRepository = $this->mock(NodeRepositoryInterface::class);

        $this->service = new LocationDeletionService($this->locationRepository, $this->nodeRepository);
    }

    public function testLocationWithNoNodesCanBeDeleted()
    {
        $location = Location::factory()->make(['id' => 1]);

        $this->locationRepository->shouldReceive('find')
            ->with(1)
            ->andReturn($location);

        $this->nodeRepository->shouldReceive('findCountWhere')
            ->with([['location_id', '=', 1]])
            ->andReturn(0);

        $this->locationRepository->shouldReceive('delete')
            ->with(1)
            ->andReturn(1);

        $result = $this->service->handle(1);

        $this->assertSame(1, $result);
    }

    public function testLocationWithActiveNodesCannotBeDeleted()
    {
        $location = Location::factory()->make(['id' => 2]);

        $this->locationRepository->shouldReceive('find')
            ->with(2)
            ->andReturn($location);

        $this->nodeRepository->shouldReceive('findCountWhere')
            ->with([['location_id', '=', 2]])
            ->andReturn(3);

        $this->expectException(HasActiveNodesException::class);

        $this->service->handle(2);
    }

    public function testLocationByModelCanBeDeleted()
    {
        $location = Location::factory()->make(['id' => 3]);

        $this->nodeRepository->shouldReceive('findCountWhere')
            ->with([['location_id', '=', 3]])
            ->andReturn(0);

        $this->locationRepository->shouldReceive('delete')
            ->with(3)
            ->andReturn(1);

        $result = $this->service->handle($location);

        $this->assertSame(1, $result);
    }
}
