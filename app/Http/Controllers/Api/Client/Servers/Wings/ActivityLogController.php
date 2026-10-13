<?php

namespace Pterodactyl\Http\Controllers\Api\Client\Servers\Wings;

use Carbon\Carbon;
use Pterodactyl\Models\User;
use Pterodactyl\Models\Server;
use Pterodactyl\Models\Permission;
use Pterodactyl\Models\ActivityLog;
use Spatie\QueryBuilder\QueryBuilder;
use Spatie\QueryBuilder\AllowedFilter;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Query\JoinClause;
use Pterodactyl\Models\Filters\MultiFieldActivityFilter;
use Pterodactyl\Http\Requests\Api\Client\ClientApiRequest;
use Pterodactyl\Transformers\Api\Client\ActivityLogTransformer;
use Pterodactyl\Http\Controllers\Api\Client\ClientApiController;

class ActivityLogController extends ClientApiController
{
    /**
     * List server activity logs.
     */
    public function __invoke(ClientApiRequest $request, Server $server): array
    {
        $this->authorize(Permission::ACTION_ACTIVITY_READ, $server);

        $activity = QueryBuilder::for($this->baseQuery($server))
            ->with('actor')
            ->allowedSorts(['timestamp'])
            ->allowedFilters($this->filters())
            ->paginate(min($request->query('per_page', 25), 100))
            ->appends($request->query());

        return $this->fractal->collection($activity)
            ->transformWith($this->getTransformer(ActivityLogTransformer::class))
            ->toArray();
    }

    /**
     * Returns the distinct events that exist in the server's activity log so
     * the frontend can offer a global event-type filter. Honors the same
     * visibility rules as the main list (e.g. hidden admin activity).
     */
    public function events(ClientApiRequest $request, Server $server): array
    {
        $this->authorize(Permission::ACTION_ACTIVITY_READ, $server);

        return $this->baseQuery($server)
            ->distinct()
            ->pluck('event')
            ->sort()
            ->values()
            ->all();
    }

    protected function baseQuery(Server $server): Builder
    {
        $query = $server->activity()->getQuery();
        $query->whereNotIn('activity_logs.event', ActivityLog::DISABLED_EVENTS);

        if (config('activity.hide_admin_activity')) {
            // We could do this with a query and a lot of joins, but that gets pretty
            // painful so for now we'll execute a simpler query.
            $subusers = $server->subusers()->pluck('user_id')->merge($server->owner_id);

            $query->select('activity_logs.*')
                ->leftJoin('users', function (JoinClause $join) {
                    $join->on('users.id', 'activity_logs.actor_id')
                        ->where('activity_logs.actor_type', (new User())->getMorphClass());
                })
                ->where(function (Builder $builder) use ($subusers) {
                    $builder->whereNull('users.id')
                        ->orWhere('users.root_admin', 0)
                        ->orWhereIn('users.id', $subusers);
                });
        }

        return $query;
    }

    protected function filters(): array
    {
        return [
            AllowedFilter::partial('event'),
            AllowedFilter::partial('ip'),
            AllowedFilter::custom('search', new MultiFieldActivityFilter()),
            AllowedFilter::callback('after', function (Builder $builder, $value) {
                try {
                    $builder->where('activity_logs.timestamp', '>=', Carbon::parse($value));
                } catch (\Exception $exception) {
                    // Ignore malformed dates rather than failing the whole request.
                }
            }),
            AllowedFilter::callback('before', function (Builder $builder, $value) {
                try {
                    $builder->where('activity_logs.timestamp', '<=', Carbon::parse($value));
                } catch (\Exception $exception) {
                    // Ignore malformed dates rather than failing the whole request.
                }
            }),
        ];
    }
}
