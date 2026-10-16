<?php

namespace Pterodactyl\Http\Controllers\Api\Client;

use Carbon\Carbon;
use Pterodactyl\Models\ActivityLog;
use Spatie\QueryBuilder\QueryBuilder;
use Spatie\QueryBuilder\AllowedFilter;
use Illuminate\Database\Eloquent\Builder;
use Pterodactyl\Models\Filters\MultiFieldActivityFilter;
use Pterodactyl\Http\Requests\Api\Client\ClientApiRequest;
use Pterodactyl\Transformers\Api\Client\ActivityLogTransformer;

class ActivityLogController extends ClientApiController
{
    /**
     * List account activity logs.
     */
    public function __invoke(ClientApiRequest $request): array
    {
        $activity = QueryBuilder::for($request->user()->activity())
            ->with('actor')
            ->allowedFilters($this->filters())
            ->allowedSorts(['timestamp'])
            ->whereNotIn('activity_logs.event', ActivityLog::DISABLED_EVENTS)
            ->paginate(min($request->query('per_page', 25), 100))
            ->appends($request->query());

        return $this->fractal->collection($activity)
            ->transformWith($this->getTransformer(ActivityLogTransformer::class))
            ->toArray();
    }

    /**
     * Returns the distinct events that exist in the account's activity log so
     * the frontend can offer a global event-type filter rather than one that is
     * limited to the currently visible page of results.
     */
    public function events(ClientApiRequest $request): array
    {
        return $request->user()->activity()
            ->whereNotIn('activity_logs.event', ActivityLog::DISABLED_EVENTS)
            ->distinct()
            ->pluck('event')
            ->sort()
            ->values()
            ->all();
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
