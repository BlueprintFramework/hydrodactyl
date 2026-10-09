<?php

namespace Pterodactyl\Http\Controllers\Admin\Api;

use Pterodactyl\Models\Node;
use Illuminate\Http\Request;
use Pterodactyl\Models\Allocation;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Services\Allocations\AssignmentService;
use Pterodactyl\Services\Allocations\AllocationDeletionService;
use Pterodactyl\Http\Requests\Admin\Node\AllocationFormRequest;
use Pterodactyl\Contracts\Repository\AllocationRepositoryInterface;

class NodeAllocationController extends Controller
{
    /**
     * NodeAllocationController constructor.
     */
    public function __construct(
        private AssignmentService $assignmentService,
        private AllocationDeletionService $deletionService,
        private AllocationRepositoryInterface $allocationRepository,
    ) {
    }

    /**
     * Return a paginated listing of allocations for a node.
     */
    public function index(Node $node): JsonResponse
    {
        $allocations = $node->allocations()
            ->orderByRaw('server_id IS NOT NULL DESC, server_id IS NULL')
            ->orderByRaw($this->ipOrder())
            ->orderBy('port')
            ->with('server:id,name')
            ->paginate(50);

        $ips = Allocation::query()
            ->where('node_id', $node->id)
            ->groupBy('ip')
            ->orderByRaw($this->ipOrder())
            ->get(['ip']);

        return response()->json([
            'data' => collect($allocations->items())
                ->map(fn (Allocation $allocation) => [
                    'id' => $allocation->id,
                    'ip' => $allocation->ip,
                    'ip_alias' => $allocation->ip_alias,
                    'port' => $allocation->port,
                    'server_id' => $allocation->server_id,
                    'server' => $allocation->server ? [
                        'id' => $allocation->server->id,
                        'name' => $allocation->server->name,
                    ] : null,
                ])
                ->values(),
            'ips' => $ips->pluck('ip')->values(),
            'meta' => [
                'pagination' => [
                    'total' => $allocations->total(),
                    'count' => $allocations->count(),
                    'per_page' => $allocations->perPage(),
                    'current_page' => $allocations->currentPage(),
                    'total_pages' => $allocations->lastPage(),
                ],
            ],
        ]);
    }

    /**
     * Assign new allocations to a node.
     */
    public function store(AllocationFormRequest $request, Node $node): JsonResponse
    {
        $this->assignmentService->handle($node, $request->normalize());

        return response()->json([], JsonResponse::HTTP_CREATED);
    }

    /**
     * Update the alias for a single allocation.
     */
    public function setAlias(Request $request, Node $node, Allocation $allocation): JsonResponse
    {
        $data = $request->validate([
            'alias' => 'present|nullable|string|max:191',
        ]);

        $this->allocationRepository->update($allocation->id, [
            'ip_alias' => empty($data['alias']) ? null : $data['alias'],
        ], false);

        return response()->json([]);
    }

    /**
     * Update the alias for every allocation on an IP, or for the whole node.
     */
    public function updateAlias(Request $request, Node $node): JsonResponse
    {
        $data = $request->validate([
            'ip' => 'nullable|string',
            'alias' => 'present|nullable|string|max:191',
        ]);

        $where = ['node_id' => $node->id];
        if (!empty($data['ip'])) {
            $where['ip'] = $data['ip'];
        }

        $updated = $this->allocationRepository->updateWhere($where, [
            'ip_alias' => empty($data['alias']) ? null : $data['alias'],
        ]);

        return response()->json(['updated' => $updated]);
    }

    /**
     * Remove a single allocation from a node.
     */
    public function destroy(Node $node, Allocation $allocation): JsonResponse
    {
        $this->deletionService->handle($allocation);

        return response()->json([], JsonResponse::HTTP_NO_CONTENT);
    }

    /**
     * Remove multiple individual allocations from a node.
     */
    public function destroyMultiple(Request $request, Node $node): JsonResponse
    {
        $ids = collect($request->input('allocations', []))
            ->map(fn ($allocation) => is_array($allocation) ? ($allocation['id'] ?? null) : $allocation)
            ->filter()
            ->map(fn ($id) => (int) $id)
            ->all();

        foreach ($this->allocationRepository->getUnassignedAllocationIds($node->id, $ids) as $id) {
            $this->allocationRepository->delete($id);
        }

        return response()->json([], JsonResponse::HTTP_NO_CONTENT);
    }

    /**
     * Remove every unassigned allocation for a specific IP on a node.
     */
    public function destroyBlock(Request $request, Node $node): JsonResponse
    {
        $data = $request->validate([
            'ip' => 'required|string',
        ]);

        $this->allocationRepository->deleteWhere([
            ['node_id', '=', $node->id],
            ['server_id', '=', null],
            ['ip', '=', $data['ip']],
        ]);

        return response()->json([], JsonResponse::HTTP_NO_CONTENT);
    }

    /**
     * Return the driver-specific SQL fragment used to sort IP addresses.
     */
    private function ipOrder(): string
    {
        return DB::getPdo()->getAttribute(DB::getPdo()::ATTR_DRIVER_NAME) === 'pgsql'
            ? 'ip::inet ASC'
            : 'INET_ATON(ip) ASC';
    }
}
