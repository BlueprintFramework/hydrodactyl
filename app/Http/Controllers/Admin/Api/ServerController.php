<?php

namespace Pterodactyl\Http\Controllers\Admin\Api;

use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Pterodactyl\Models\Node;
use Pterodactyl\Models\Server;
use Illuminate\Http\JsonResponse;
use Pterodactyl\Models\Allocation;
use Pterodactyl\Models\ServerTransfer;
use Pterodactyl\Enums\Daemon\JwtScope;
use Spatie\QueryBuilder\QueryBuilder;
use Spatie\QueryBuilder\AllowedFilter;
use Illuminate\Database\ConnectionInterface;
use Pterodactyl\Exceptions\DisplayException;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Services\Nodes\NodeJWTService;
use Illuminate\Validation\ValidationException;
use Pterodactyl\Repositories\Eloquent\NodeRepository;
use Pterodactyl\Services\Servers\SuspensionService;
use Pterodactyl\Models\Filters\AdminServerFilter;
use Pterodactyl\Services\Servers\ServerDeletionService;
use Pterodactyl\Services\Servers\ReinstallServerService;
use Pterodactyl\Exceptions\Model\DataValidationException;
use Pterodactyl\Services\Servers\DetailsModificationService;
use Pterodactyl\Repositories\Wings\DaemonTransferRepository;
use Pterodactyl\Contracts\Repository\ServerRepositoryInterface;
use Pterodactyl\Contracts\Repository\AllocationRepositoryInterface;

class ServerController extends Controller
{
    /**
     * ServerController constructor.
     */
    public function __construct(
        private AllocationRepositoryInterface $allocationRepository,
        private ConnectionInterface $connection,
        private DaemonTransferRepository $daemonTransferRepository,
        private DetailsModificationService $detailsModificationService,
        private NodeJWTService $nodeJWTService,
        private NodeRepository $nodeRepository,
        private ReinstallServerService $reinstallService,
        private ServerDeletionService $deletionService,
        private ServerRepositoryInterface $repository,
        private SuspensionService $suspensionService,
    ) {
    }

    /**
     * Return a paginated listing of servers.
     */
    public function index(Request $request): JsonResponse
    {
        $servers = QueryBuilder::for(Server::query()->with('node', 'user', 'allocation'))
            ->allowedFilters([
                AllowedFilter::exact('owner_id'),
                AllowedFilter::custom('*', new AdminServerFilter()),
            ])
            ->paginate(config()->get('pterodactyl.paginate.admin.servers'));

        return response()->json([
            'data' => collect($servers->items())->map(fn (Server $server) => $this->transform($server))->values(),
            'meta' => [
                'pagination' => [
                    'total' => $servers->total(),
                    'count' => $servers->count(),
                    'per_page' => $servers->perPage(),
                    'current_page' => $servers->currentPage(),
                    'total_pages' => $servers->lastPage(),
                ],
            ],
        ]);
    }

    /**
     * Return a single server with the relationships the interface needs.
     */
    public function view(Server $server): JsonResponse
    {
        $server->load(['nest', 'egg', 'user', 'node', 'allocation']);

        return response()->json(['data' => $this->transform($server)]);
    }

    /**
     * Update the base details for a server.
     */
    public function updateDetails(Request $request, Server $server): JsonResponse
    {
        try {
            $this->detailsModificationService->handle($server, $request->only([
                'owner_id', 'external_id', 'name', 'description',
            ]));
        } catch (DataValidationException $exception) {
            throw new ValidationException($exception->getValidator());
        }

        return response()->json(['data' => $this->transform($server->fresh())]);
    }

    /**
     * Return the data needed to manage a server (transfer options, state).
     */
    public function manage(Server $server): JsonResponse
    {
        if ($server->status === Server::STATUS_INSTALL_FAILED) {
            throw new DisplayException(
                'This server is in a failed install state and cannot be recovered. Please delete and re-create the server.'
            );
        }

        $server->loadMissing('transfer');

        $nodes = \Pterodactyl\Models\Location::query()
            ->with(['nodes' => fn ($query) => $query->select('id', 'name', 'location_id')->orderBy('name')])
            ->orderBy('short')
            ->get(['id', 'short', 'long']);

        return response()->json([
            'can_transfer' => Node::query()->count() >= 2,
            'transfer' => $server->transfer ? [
                'created_at' => $server->transfer->created_at->toIso8601String(),
            ] : null,
            'locations' => $nodes->map(fn ($location) => [
                'id' => $location->id,
                'short' => $location->short,
                'long' => $location->long,
                'nodes' => $location->nodes
                    ->reject(fn (Node $node) => $node->id === $server->node_id)
                    ->map(fn (Node $node) => ['id' => $node->id, 'name' => $node->name])
                    ->values(),
            ])->values(),
        ]);
    }

    /**
     * Return the unassigned allocations available on a node for a transfer.
     */
    public function transferAllocations(Request $request, Server $server): JsonResponse
    {
        $data = $request->validate([
            'node_id' => 'required|numeric|exists:nodes,id',
        ]);

        $allocations = Allocation::query()
            ->where('node_id', $data['node_id'])
            ->whereNull('server_id')
            ->orderBy('ip')
            ->orderBy('port')
            ->get(['id', 'ip', 'port', 'ip_alias']);

        return response()->json([
            'data' => $allocations->map(fn (Allocation $allocation) => [
                'id' => $allocation->id,
                'ip' => $allocation->ip,
                'port' => $allocation->port,
                'alias' => $allocation->alias,
            ])->values(),
        ]);
    }

    /**
     * Toggle the installation status for a server.
     */
    public function toggleInstall(Server $server): JsonResponse
    {
        if ($server->status === Server::STATUS_INSTALL_FAILED) {
            throw new DisplayException(trans('admin/server.exceptions.marked_as_failed'));
        }

        $this->repository->update($server->id, [
            'status' => $server->isInstalled() ? Server::STATUS_INSTALLING : null,
        ], true, true);

        return response()->json(['data' => $this->transform($server->fresh())]);
    }

    /**
     * Suspend or unsuspend a server.
     */
    public function suspension(Request $request, Server $server): JsonResponse
    {
        $data = $request->validate([
            'action' => 'required|in:suspend,unsuspend',
        ]);

        $this->suspensionService->toggle($server, $data['action']);

        return response()->json(['data' => $this->transform($server->fresh())]);
    }

    /**
     * Reinstall a server.
     */
    public function reinstall(Server $server): JsonResponse
    {
        $this->reinstallService->handle($server);

        return response()->json(['data' => $this->transform($server->fresh())]);
    }

    /**
     * Start a transfer of a server to another node.
     */
    public function transfer(Request $request, Server $server): JsonResponse
    {
        $validated = $request->validate([
            'node_id' => 'required|exists:nodes,id',
            'allocation_id' => 'required|bail|unique:servers|exists:allocations,id',
            'allocation_additional' => 'nullable|array',
        ]);

        $nodeId = (int) $validated['node_id'];
        $allocationId = (int) $validated['allocation_id'];
        $additional = array_map('intval', $validated['allocation_additional'] ?? []);

        $node = $this->nodeRepository->getNodeWithResourceUsage($nodeId);
        if (!$node->isViable($server->memory, $server->disk)) {
            throw new DisplayException(trans('admin/server.alerts.transfer_not_viable'));
        }

        $server->validateTransferState();

        $this->connection->transaction(function () use ($server, $nodeId, $allocationId, $additional) {
            $transfer = new ServerTransfer();
            $transfer->server_id = $server->id;
            $transfer->old_node = $server->node_id;
            $transfer->new_node = $nodeId;
            $transfer->old_allocation = $server->allocation_id;
            $transfer->new_allocation = $allocationId;
            $transfer->old_additional_allocations = $server->allocations->where('id', '!=', $server->allocation_id)->pluck('id');
            $transfer->new_additional_allocations = $additional;
            $transfer->save();

            $this->assignAllocationsToServer($server, $nodeId, $allocationId, $additional);

            $token = $this->nodeJWTService
                ->setExpiresAt(CarbonImmutable::now()->addMinutes(15))
                ->setSubject($server->uuid)
                ->setScopes(JwtScope::ServerTransfer)
                ->handle($transfer->newNode, $server->uuid, 'sha256');

            $this->daemonTransferRepository->setServer($server)->notify($transfer->newNode, $token);

            return $transfer;
        });

        return response()->json(['data' => $this->transform($server->fresh())]);
    }

    /**
     * Delete a server from the system.
     */
    public function destroy(Request $request, Server $server): JsonResponse
    {
        $this->deletionService->withForce($request->boolean('force_delete'))->handle($server);

        return response()->json([], JsonResponse::HTTP_NO_CONTENT);
    }

    /**
     * Assign the given allocations to the server.
     */
    private function assignAllocationsToServer(Server $server, int $nodeId, int $allocationId, array $additional): void
    {
        $allocations = $additional;
        $allocations[] = $allocationId;

        $ids = $this->allocationRepository->getUnassignedAllocationIds($nodeId, $allocations);

        if (!empty($ids)) {
            $this->allocationRepository->updateWhereIn('id', $ids, ['server_id' => $server->id]);
        }
    }

    /**
     * Map a server model into the shape consumed by the admin interface.
     */
    private function transform(Server $server): array
    {
        return [
            'id' => $server->id,
            'uuid' => $server->uuid,
            'uuid_short' => $server->uuidShort,
            'name' => $server->name,
            'description' => $server->description,
            'external_id' => $server->external_id,
            'status' => $server->status,
            'is_installed' => $server->isInstalled(),
            'is_suspended' => $server->isSuspended(),
            'exclude_from_resource_calculation' => (bool) $server->exclude_from_resource_calculation,
            'owner' => $server->relationLoaded('user') && $server->user ? [
                'id' => $server->user->id,
                'username' => $server->user->username,
                'email' => $server->user->email,
                'name_first' => $server->user->name_first,
                'name_last' => $server->user->name_last,
            ] : null,
            'node' => $server->relationLoaded('node') && $server->node ? [
                'id' => $server->node->id,
                'name' => $server->node->name,
            ] : null,
            'nest' => $server->relationLoaded('nest') && $server->nest ? [
                'id' => $server->nest->id,
                'name' => $server->nest->name,
            ] : null,
            'egg' => $server->relationLoaded('egg') && $server->egg ? [
                'id' => $server->egg->id,
                'name' => $server->egg->name,
            ] : null,
            'allocation' => $server->relationLoaded('allocation') && $server->allocation ? [
                'id' => $server->allocation->id,
                'ip' => $server->allocation->ip,
                'port' => $server->allocation->port,
                'alias' => $server->allocation->alias,
            ] : null,
            'cpu' => (int) $server->cpu,
            'threads' => $server->threads,
            'memory' => (int) $server->memory,
            'swap' => (int) $server->swap,
            'disk' => (int) $server->disk,
            'io' => (int) $server->io,
            'database_limit' => (int) $server->database_limit,
            'allocation_limit' => (int) $server->allocation_limit,
            'backup_limit' => (int) $server->backup_limit,
            'oom_disabled' => (bool) $server->oom_disabled,
            'docker_image' => $server->image,
            'startup' => $server->startup,
        ];
    }
}
