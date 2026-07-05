<?php

namespace Pterodactyl\Services\Marketplace;

/**
 * Normalized representation of a single downloadable version of a marketplace
 * project. The frontend uses this to render a version picker; the chosen id is
 * sent back to the resolve endpoint to obtain a direct download URL.
 */
final class MarketplaceVersion
{
    /**
     * @param string[] $loaders
     * @param string[] $gameVersions
     */
    public function __construct(
        public string $id,
        public string $name,
        public array $loaders = [],
        public array $gameVersions = [],
        public ?int $size = null,
        public ?string $date = null,
        public string $type = 'release',
    ) {
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'loaders' => $this->loaders,
            'game_versions' => $this->gameVersions,
            'size' => $this->size,
            'date' => $this->date,
            'type' => $this->type,
        ];
    }
}
