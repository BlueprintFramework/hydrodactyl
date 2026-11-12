<?php

namespace Pterodactyl\Services\Files;

use Illuminate\Support\Collection;
use Pterodactyl\Models\Server;
use Pterodactyl\Models\ServerFileBlock;
use Pterodactyl\Models\User;

class FileBlockService
{
    /**
     * Normalize a server-root path to a leading-slash form without a trailing slash
     * (except for the root path "/").
     */
    public function normalize(string $path): string
    {
        $path = str_replace('\\', '/', $path);
        $parts = [];

        foreach (explode('/', $path) as $part) {
            if ($part === '' || $part === '.') {
                continue;
            }

            if ($part === '..') {
                array_pop($parts);
                continue;
            }

            $parts[] = $part;
        }

        return '/' . implode('/', $parts);
    }

    public function join(string $directory, string $name): string
    {
        return $this->normalize(rtrim($directory, '/') . '/' . ltrim($name, '/'));
    }

    public function isExempt(Server $server, User $user): bool
    {
        return $user->root_admin || $user->id === $server->owner_id;
    }

    /**
     * Whether the given path is blocked for the user (exact match, or under a blocked directory).
     */
    public function isBlocked(Server $server, User $user, string $path): bool
    {
        if ($this->isExempt($server, $user)) {
            return false;
        }

        $normalized = $this->normalize($path);
        $blockedPaths = $this->blockedPathsFor($server, $user);

        foreach ($blockedPaths as $blocked) {
            if ($normalized === $blocked) {
                return true;
            }

            if (str_starts_with($normalized, $blocked === '/' ? '/' : $blocked . '/')) {
                return true;
            }
        }

        return false;
    }

    /**
     * Filter daemon directory listing entries for a blocked user.
     *
     * @param  array<int, array<string, mixed>>  $items
     * @return array<int, array<string, mixed>>
     */
    public function filterListing(Server $server, User $user, string $directory, array $items): array
    {
        if ($this->isExempt($server, $user)) {
            return $items;
        }

        $directory = $this->normalize($directory);

        return array_values(array_filter($items, function (array $item) use ($server, $user, $directory) {
            $name = $item['name'] ?? null;
            if (!is_string($name) || $name === '') {
                return true;
            }

            return !$this->isBlocked($server, $user, $this->join($directory, $name));
        }));
    }

    /**
     * Replace the set of blocked users for a path with the given user IDs.
     *
     * @param  int[]  $userIds
     * @return Collection<int, ServerFileBlock>
     */
    public function syncPathBlocks(Server $server, string $path, array $userIds): Collection
    {
        $path = $this->normalize($path);
        $userIds = array_values(array_unique(array_map('intval', $userIds)));

        ServerFileBlock::query()
            ->where('server_id', $server->id)
            ->where('path', $path)
            ->whereNotIn('user_id', $userIds)
            ->delete();

        $existing = ServerFileBlock::query()
            ->where('server_id', $server->id)
            ->where('path', $path)
            ->pluck('user_id')
            ->all();

        foreach (array_diff($userIds, $existing) as $userId) {
            ServerFileBlock::query()->create([
                'server_id' => $server->id,
                'user_id' => $userId,
                'path' => $path,
            ]);
        }

        return ServerFileBlock::query()
            ->where('server_id', $server->id)
            ->where('path', $path)
            ->with('user')
            ->get();
    }

    public function deleteBlocks(Server $server, string $path, ?int $userId = null): int
    {
        $path = $this->normalize($path);

        $query = ServerFileBlock::query()
            ->where('server_id', $server->id)
            ->where('path', $path);

        if ($userId !== null) {
            $query->where('user_id', $userId);
        }

        return $query->delete();
    }

    /**
     * @return string[]
     */
    private function blockedPathsFor(Server $server, User $user): array
    {
        return ServerFileBlock::query()
            ->where('server_id', $server->id)
            ->where('user_id', $user->id)
            ->pluck('path')
            ->map(fn (string $path) => $this->normalize($path))
            ->all();
    }
}
