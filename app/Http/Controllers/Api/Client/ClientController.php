<?php

namespace Pterodactyl\Http\Controllers\Api\Client;

use Illuminate\Support\Facades\DB;
use Pterodactyl\Models\Server;
use Pterodactyl\Models\Permission;
use Pterodactyl\Models\ServerGroup;
use Spatie\QueryBuilder\QueryBuilder;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\AllowedSort;
use Pterodactyl\Models\Filters\MultiFieldServerFilter;
use Pterodactyl\Models\Sorts\ServerOwnerNameSort;
use Pterodactyl\Models\Sorts\ServerNestNameSort;
use Pterodactyl\Models\Sorts\ServerEggNameSort;
use Pterodactyl\Models\Sorts\ServerNodeNameSort;
use Pterodactyl\Models\Sorts\ServerGroupNameSort;
use Pterodactyl\Transformers\Api\Client\ServerTransformer;
use Pterodactyl\Http\Requests\Api\Client\GetServersRequest;

class ClientController extends ClientApiController
{
    /**
     * List all accessible servers
     */
    public function index(GetServersRequest $request): array
    {
        $user = $request->user();
        $transformer = $this->getTransformer(ServerTransformer::class);

        // Start the query builder and ensure we eager load any requested relationships from the request.
        $builder = QueryBuilder::for(
            Server::query()->with(array_merge(
                $this->getIncludesForTransformer($transformer, ['node']),
                ['group']
            ))
        )->allowedFilters([
            'uuid',
            'name',
            'description',
            'external_id',
            'daemonType',
            // Foreign-key columns must use exact matching: Spatie turns a bare
            // string filter into AllowedFilter::partial() (LIKE '%value%'), which
            // would make filter[owner_id]=5 also match 15, 25, 50-59, … — returning
            // servers that don't belong to the selected owner/nest/egg/node.
            AllowedFilter::exact('owner_id'),
            AllowedFilter::exact('nest_id'),
            AllowedFilter::exact('egg_id'),
            AllowedFilter::exact('node_id'),
            AllowedFilter::custom('*', new MultiFieldServerFilter()),
        ])->allowedSorts([
            'name',
            'uuid',
            'uuidShort',
            'description',
            'status',
            'owner_id',
            'nest_id',
            'egg_id',
            'node_id',
            'memory',
            'disk',
            'cpu',
            'created_at',
            'updated_at',
            AllowedSort::custom('owner_name', new ServerOwnerNameSort()),
            AllowedSort::custom('nest_name', new ServerNestNameSort()),
            AllowedSort::custom('egg_name', new ServerEggNameSort()),
            AllowedSort::custom('node_name', new ServerNodeNameSort()),
            AllowedSort::custom('group_name', new ServerGroupNameSort()),
        ]);

        $type = $request->input('type');
        // Either return all the servers the user has access to because they are an admin `?type=admin` or
        // just return all the servers the user has access to because they are the owner or a subuser of the
        // server. If ?type=admin-all is passed all servers on the system will be returned to the user, rather
        // than only servers they can see because they are an admin.
        if (in_array($type, ['admin', 'admin-all'])) {
            // If they aren't an admin but want all the admin servers don't fail the request, just
            // make it a query that will never return any results back.
            if (!$user->root_admin) {
                $builder->whereRaw('1 = 2');
            } else {
                $builder = $type === 'admin-all'
                    ? $builder
                    : $builder->whereNotIn('servers.id', $user->accessibleServers()->pluck('id')->all());
            }
        } elseif ($type === 'owner') {
            $builder = $builder->where('servers.owner_id', $user->id);
        } elseif ($type === 'shared') {
            $builder = $builder->whereIn('servers.id', function ($q) use ($user) {
                $q->select('server_id')->from('subusers')->where('user_id', $user->id);
            });
        } else {
            // Default + 'all': every server the user can access (owned + subuser on).
            $builder = $builder->whereIn('servers.id', $user->accessibleServers()->pluck('id')->all());
        }

        // Filter by group if specified
        $groupId = $request->query('group_id');
        if ($groupId) {
            $builder->where('servers.group_id', $groupId);
        }

        $servers = $builder->paginate(min($request->query('per_page', 50), 1000))->appends($request->query());

        return $this->fractal->transformWith($transformer)->collection($servers)->toArray();
    }

    /**
     * Get server filter options
     */
    public function filterOptions(GetServersRequest $request): array
    {
        $user = $request->user();

        $baseQuery = Server::query();
        if (!$user->root_admin) {
            $baseQuery->whereIn('servers.id', $user->accessibleServers()->pluck('id')->all());
        }

        $accessibleIds = (clone $baseQuery)->select('servers.id');

        $owners = Server::query()
            ->from('servers')
            ->leftJoin('users', 'servers.owner_id', '=', 'users.id')
            ->whereIn('servers.id', clone $accessibleIds)
            ->whereNotNull('users.id')
            ->select('users.id as value', DB::raw("CONCAT(users.name_first, ' ', users.name_last) as label"))
            ->distinct()
            ->orderBy('label')
            ->get();

        $nests = Server::query()
            ->from('servers')
            ->leftJoin('nests', 'servers.nest_id', '=', 'nests.id')
            ->whereIn('servers.id', clone $accessibleIds)
            ->whereNotNull('nests.id')
            ->select('nests.id as value', 'nests.name as label')
            ->distinct()
            ->orderBy('label')
            ->get();

        $eggs = Server::query()
            ->from('servers')
            ->leftJoin('eggs', 'servers.egg_id', '=', 'eggs.id')
            ->whereIn('servers.id', clone $accessibleIds)
            ->whereNotNull('eggs.id')
            ->select('eggs.id as value', 'eggs.name as label')
            ->distinct()
            ->orderBy('label')
            ->get();

        $nodes = Server::query()
            ->from('servers')
            ->leftJoin('nodes', 'servers.node_id', '=', 'nodes.id')
            ->whereIn('servers.id', clone $accessibleIds)
            ->whereNotNull('nodes.id')
            ->select('nodes.id as value', 'nodes.name as label')
            ->distinct()
            ->orderBy('label')
            ->get();

        $groups = ServerGroup::where('user_id', $user->id)
            ->select('id as value', 'name as label')
            ->orderBy('name')
            ->get();

        return [
            'object' => 'server_filter_options',
            'attributes' => [
                'owners' => $owners,
                'nests' => $nests,
                'eggs' => $eggs,
                'nodes' => $nodes,
                'groups' => $groups,
                'groups_enabled' => config('pterodactyl.client_features.groups.enabled', true),
            ],
        ];
    }

    /**
     * List all system permissions
     */
    public function permissions(): array
    {
        return [
            'object' => 'system_permissions',
            'attributes' => [
                'permissions' => Permission::permissions(),
            ],
        ];
    }
}
