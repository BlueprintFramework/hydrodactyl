<?php

namespace Pterodactyl\Contracts\Repository;

use Pterodactyl\Models\Allocation;

interface AllocationRepositoryInterface extends RepositoryInterface
{
    /**
     * Return all the unassigned allocations for a node, optionally limited to a
     * set of IDs.
     *
     * @param int[] $ids
     */
    public function getUnassignedAllocationIds(int $node, array $ids = []): array;

    /**
     * Return a single allocation from those meeting the requirements.
     */
    public function getRandomAllocation(array $nodes, array $ports, bool $dedicated = false): ?Allocation;
}
