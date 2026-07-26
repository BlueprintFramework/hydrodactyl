<?php

namespace Pterodactyl\Tests\Unit\Services\Allocations;

use Mockery\MockInterface;
use Pterodactyl\Tests\TestCase;
use Pterodactyl\Models\Allocation;
use Pterodactyl\Services\Allocations\AllocationDeletionService;
use Pterodactyl\Contracts\Repository\AllocationRepositoryInterface;
use Pterodactyl\Exceptions\Service\Allocation\ServerUsingAllocationException;

class AllocationDeletionServiceTest extends TestCase
{
    private MockInterface $repository;
    private AllocationDeletionService $service;

    public function setUp(): void
    {
        parent::setUp();

        $this->repository = $this->mock(AllocationRepositoryInterface::class);
        $this->service = new AllocationDeletionService($this->repository);
    }

    public function testUnassignedAllocationCanBeDeleted()
    {
        $allocation = Allocation::factory()->make(['id' => 1, 'server_id' => null]);

        $this->repository->shouldReceive('delete')
            ->with(1)
            ->andReturn(1);

        $result = $this->service->handle($allocation);

        $this->assertSame(1, $result);
    }

    public function testAssignedAllocationCannotBeDeleted()
    {
        $allocation = Allocation::factory()->make(['id' => 2, 'server_id' => 5]);

        $this->repository->shouldNotReceive('delete');

        $this->expectException(ServerUsingAllocationException::class);

        $this->service->handle($allocation);
    }
}
