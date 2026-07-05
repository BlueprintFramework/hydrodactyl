<?php

namespace Pterodactyl\Services\Marketplace;

/**
 * Contract implemented by each marketplace adapter (Modrinth, Hangar, ...).
 *
 * The installer works in two content types — "mod" and "plugin" — and each
 * adapter declares which types it can serve. The flow is:
 *
 *   1. search()     — browse projects by query + filters
 *   2. versions()   — list downloadable versions for a project
 *   3. resolve()    — turn a chosen version into a direct download URL + filename
 */
interface MarketplaceSource
{
    /** Stable machine identifier ("modrinth", "hangar"). */
    public function key(): string;

    /** Human readable name for badges / selectors. */
    public function label(): string;

    /** Whether this source can serve the given content type ("mod"|"plugin"). */
    public function supports(string $type): bool;

    /**
     * Search the source.
     *
     * @param array{query?: string, loader?: ?string, game_version?: ?string, limit?: int, offset?: int} $filters
     *
     * @return MarketplaceProject[]
     */
    public function search(string $type, array $filters): array;

    /**
     * List downloadable versions for a project, optionally filtered.
     *
     * @param array{loader?: ?string, game_version?: ?string} $filters
     *
     * @return MarketplaceVersion[]
     */
    public function versions(string $type, string $projectId, array $filters): array;

    /**
     * Resolve a specific version to a direct download.
     *
     * @return array{url: string, filename: string, size: ?int}
     */
    public function resolve(string $type, string $projectId, string $versionId): array;

    /**
     * Loader tags this source recognizes, used to validate the loader extracted
     * from a server's egg features (e.g. "mod/fabric"). The authoritative list
     * is Modrinth's GET /tag/loader; other sources return an empty array.
     *
     * @return string[]
     */
    public function loaders(): array;
}
