<?php

namespace Pterodactyl\Services\Marketplace;

/**
 * Normalized representation of a marketplace project (a mod or plugin) returned
 * to the frontend. Every source adapter converts its native response shape into
 * this object so the UI can render all sources uniformly.
 */
final class MarketplaceProject
{
    /**
     * @param string[] $categories
     */
    public function __construct(
        public string $source,
        public string $id,
        public string $title,
        public string $slug,
        public string $description,
        public string $author,
        public ?string $icon = null,
        public int $downloads = 0,
        public array $categories = [],
        public ?string $url = null,
        public ?string $updatedAt = null,
    ) {
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'source' => $this->source,
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'description' => $this->description,
            'author' => $this->author,
            'icon' => $this->icon,
            'downloads' => $this->downloads,
            'categories' => $this->categories,
            'url' => $this->url,
            'updated_at' => $this->updatedAt,
        ];
    }
}
