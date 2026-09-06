<?php

namespace Pterodactyl\Http\Controllers\Api\Client;

use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Pterodactyl\Models\Server;
use Pterodactyl\Models\ServerGroup;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class ServerGroupController extends ClientApiController
{
    private function ensureGroupsEnabled(): void
    {
        if (!config('pterodactyl.client_features.groups.enabled', true)) {
            throw new NotFoundHttpException('Server groups are not enabled on this panel.');
        }
    }

    /**
     * List all groups for the authenticated user.
     */
    public function index(Request $request): array
    {
        $this->ensureGroupsEnabled();
        $user = $request->user();

        $groups = ServerGroup::where('user_id', $user->id)
            ->withCount('servers')
            ->orderBy('sort_order')
            ->get();

        return [
            'object' => 'list',
            'data' => $groups->map(fn (ServerGroup $group) => [
                'id' => $group->id,
                'name' => $group->name,
                'description' => $group->description,
                'sort_order' => $group->sort_order,
                'is_collapsed' => $group->is_collapsed,
                'server_count' => $group->servers_count,
                'created_at' => $group->created_at?->toIso8601String(),
                'updated_at' => $group->updated_at?->toIso8601String(),
            ])->toArray(),
        ];
    }

    /**
     * Create a new server group.
     */
    public function store(Request $request): JsonResponse
    {
        $this->ensureGroupsEnabled();
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'required|string|min:1|max:191',
            'description' => 'sometimes|nullable|string|max:1000',
            'server_ids' => 'sometimes|array',
            'server_ids.*' => 'integer|exists:servers,id',
        ]);

        $group = DB::transaction(function () use ($user, $validated) {
            $maxOrder = ServerGroup::where('user_id', $user->id)->max('sort_order') ?? 0;

            $group = ServerGroup::create([
                'user_id' => $user->id,
                'name' => $validated['name'],
                'description' => $validated['description'] ?? null,
                'sort_order' => $maxOrder + 1,
            ]);

            if (!empty($validated['server_ids'])) {
                $serverIds = array_unique($validated['server_ids']);
                $this->validateServerAccess($user, $serverIds);

                Server::whereIn('id', $serverIds)->update(['group_id' => $group->id]);
            }

            return $group;
        });

        $group->loadCount('servers');

        return new JsonResponse([
            'object' => 'server_group',
            'attributes' => [
                'id' => $group->id,
                'name' => $group->name,
                'description' => $group->description,
                'sort_order' => $group->sort_order,
                'is_collapsed' => $group->is_collapsed,
                'server_count' => $group->servers_count,
                'created_at' => $group->created_at?->toIso8601String(),
                'updated_at' => $group->updated_at?->toIso8601String(),
            ],
        ], Response::HTTP_CREATED);
    }

    /**
     * Update a server group.
     */
    public function update(Request $request, int $serverGroup): JsonResponse
    {
        $this->ensureGroupsEnabled();
        $user = $request->user();
        $group = $this->getGroupOrFail($user, $serverGroup);

        $validated = $request->validate([
            'name' => 'sometimes|string|min:1|max:191',
            'description' => 'sometimes|nullable|string|max:1000',
            'sort_order' => 'sometimes|integer|min:0',
            'is_collapsed' => 'sometimes|boolean',
        ]);

        if (isset($validated['name']) && $validated['name'] !== $group->name) {
            $exists = ServerGroup::where('user_id', $user->id)
                ->where('name', $validated['name'])
                ->where('id', '!=', $group->id)
                ->exists();

            if ($exists) {
                throw ValidationException::withMessages([
                    'name' => ['A group with this name already exists.'],
                ]);
            }
        }

        $group->update($validated);
        $group->loadCount('servers');

        return new JsonResponse([
            'object' => 'server_group',
            'attributes' => [
                'id' => $group->id,
                'name' => $group->name,
                'description' => $group->description,
                'sort_order' => $group->sort_order,
                'is_collapsed' => $group->is_collapsed,
                'server_count' => $group->servers_count,
                'created_at' => $group->created_at?->toIso8601String(),
                'updated_at' => $group->updated_at?->toIso8601String(),
            ],
        ]);
    }

    /**
     * Delete a server group. Servers are ungrouped, not deleted.
     */
    public function destroy(Request $request, int $serverGroup): Response
    {
        $this->ensureGroupsEnabled();
        $user = $request->user();
        $group = $this->getGroupOrFail($user, $serverGroup);

        Server::where('group_id', $group->id)->update(['group_id' => null]);
        $group->delete();

        return $this->returnNoContent();
    }

    /**
     * Add servers to a group. Servers are moved from any previous group.
     */
    public function addServers(Request $request, int $serverGroup): JsonResponse
    {
        $this->ensureGroupsEnabled();
        $user = $request->user();
        $group = $this->getGroupOrFail($user, $serverGroup);

        $validated = $request->validate([
            'server_ids' => 'required|array|min:1',
            'server_ids.*' => 'integer|exists:servers,id',
        ]);

        $serverIds = array_unique($validated['server_ids']);
        $this->validateServerAccess($user, $serverIds);

        Server::whereIn('id', $serverIds)->update(['group_id' => $group->id]);
        $group->loadCount('servers');

        return new JsonResponse([
            'object' => 'server_group',
            'attributes' => [
                'id' => $group->id,
                'name' => $group->name,
                'server_count' => $group->servers_count,
            ],
        ]);
    }

    /**
     * Remove servers from a group.
     */
    public function removeServers(Request $request, int $serverGroup): JsonResponse
    {
        $this->ensureGroupsEnabled();
        $user = $request->user();
        $group = $this->getGroupOrFail($user, $serverGroup);

        $validated = $request->validate([
            'server_ids' => 'required|array|min:1',
            'server_ids.*' => 'integer|exists:servers,id',
        ]);

        Server::whereIn('id', $validated['server_ids'])
            ->where('group_id', $group->id)
            ->update(['group_id' => null]);

        $group->loadCount('servers');

        return new JsonResponse([
            'object' => 'server_group',
            'attributes' => [
                'id' => $group->id,
                'name' => $group->name,
                'server_count' => $group->servers_count,
            ],
        ]);
    }

    /**
     * Reorder groups (update sort_order for multiple groups at once).
     */
    public function reorder(Request $request): JsonResponse
    {
        $this->ensureGroupsEnabled();
        $user = $request->user();

        $validated = $request->validate([
            'group_ids' => 'required|array',
            'group_ids.*' => 'integer|exists:server_groups,id',
        ]);

        DB::transaction(function () use ($user, $validated) {
            foreach ($validated['group_ids'] as $index => $groupId) {
                ServerGroup::where('user_id', $user->id)
                    ->where('id', $groupId)
                    ->update(['sort_order' => $index]);
            }
        });

        return new JsonResponse(['status' => 'ok']);
    }

    /**
     * Ensure the server belongs to the authenticated user.
     *
     * @param  int[]  $serverIds
     */
    private function validateServerAccess($user, array $serverIds): void
    {
        $accessible = $user->accessibleServers()->pluck('servers.id')->toArray();
        $unauthorized = array_diff($serverIds, $accessible);

        if (!empty($unauthorized)) {
            throw ValidationException::withMessages([
                'server_ids' => ['You do not have access to one or more of the specified servers.'],
            ]);
        }
    }

    /**
     * Get a server group or fail with 404.
     */
    private function getGroupOrFail($user, int $id): ServerGroup
    {
        return ServerGroup::where('user_id', $user->id)
            ->where('id', $id)
            ->firstOrFail();
    }
}
