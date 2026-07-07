<?php

namespace Pterodactyl\Models\Sorts;

use Illuminate\Database\Eloquent\Builder;
use Spatie\QueryBuilder\Sorts\Sort;

class ServerOwnerNameSort implements Sort
{
    public function __invoke(Builder $query, bool $descending, string $property)
    {
        $direction = $descending ? 'DESC' : 'ASC';

        // Order by a correlated subquery rather than a LEFT JOIN. Ordering by a
        // joined column conflicts with MultiFieldServerFilter's GROUP BY
        // servers.id on PostgreSQL (SQLSTATE 42803 -> HTTP 500) when an IP/port
        // search filter is also applied. $direction is a hardcoded ASC/DESC
        // literal derived from Spatie's bool, so orderByRaw is injection-safe.
        $query->orderByRaw("(SELECT users.name_first FROM users WHERE users.id = servers.owner_id) {$direction}")
            ->orderByRaw("(SELECT users.name_last FROM users WHERE users.id = servers.owner_id) {$direction}")
            ->select('servers.*');
    }
}
