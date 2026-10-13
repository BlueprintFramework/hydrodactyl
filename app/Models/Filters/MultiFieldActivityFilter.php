<?php

namespace Pterodactyl\Models\Filters;

use Pterodactyl\Models\User;
use Spatie\QueryBuilder\Filters\Filter;
use Illuminate\Database\Eloquent\Builder;

/**
 * A multi-column filter for the activity_logs table. Allows a single search
 * value to be matched against the event name, IP address, description, or the
 * username of the actor that triggered the event.
 *
 * Columns are always qualified against the activity_logs table so the filter
 * continues to work when another table (such as users) is joined onto the
 * query.
 */
class MultiFieldActivityFilter implements Filter
{
    public function __invoke(Builder $query, $value, string $property)
    {
        $search = trim(is_array($value) ? implode(' ', $value) : (string) $value);
        if ($search === '') {
            return;
        }

        $like = '%' . $search . '%';
        $userMorph = (new User())->getMorphClass();

        $query->where(function (Builder $builder) use ($like, $userMorph) {
            $builder->where('activity_logs.event', 'LIKE', $like)
                ->orWhere('activity_logs.ip', 'LIKE', $like)
                ->orWhere('activity_logs.description', 'LIKE', $like)
                ->orWhere(function (Builder $builder) use ($like, $userMorph) {
                    $builder->where('activity_logs.actor_type', $userMorph)
                        ->whereIn('activity_logs.actor_id', function ($query) use ($like) {
                            $query->select('id')
                                ->from('users')
                                ->where('username', 'LIKE', $like);
                        });
                });
        });
    }
}
