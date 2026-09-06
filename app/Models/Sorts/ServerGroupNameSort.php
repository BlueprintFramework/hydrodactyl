<?php

namespace Pterodactyl\Models\Sorts;

use Illuminate\Database\Eloquent\Builder;
use Spatie\QueryBuilder\Sorts\Sort;

class ServerGroupNameSort implements Sort
{
    public function __invoke(Builder $query, bool $descending, string $property)
    {
        $direction = $descending ? 'DESC' : 'ASC';

        $query->leftJoin('server_groups', 'servers.group_id', '=', 'server_groups.id')
            ->orderBy('server_groups.name', $direction)
            ->reorder()
            ->select('servers.*');
    }
}
