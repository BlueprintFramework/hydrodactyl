<?php

namespace Pterodactyl\Models\Sorts;

use Illuminate\Database\Eloquent\Builder;
use Spatie\QueryBuilder\Sorts\Sort;

class ServerNodeNameSort implements Sort
{
    public function __invoke(Builder $query, bool $descending, string $property)
    {
        $direction = $descending ? 'DESC' : 'ASC';

        // Correlated subquery instead of a LEFT JOIN: ordering by a joined
        // column conflicts with MultiFieldServerFilter's GROUP BY servers.id on
        // PostgreSQL (SQLSTATE 42803 -> HTTP 500) when an IP/port search filter
        // is also applied. $direction is a hardcoded literal -> injection-safe.
        $query->orderByRaw("(SELECT nodes.name FROM nodes WHERE nodes.id = servers.node_id) {$direction}")
            ->select('servers.*');
    }
}
