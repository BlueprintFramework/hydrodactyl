<?php

namespace Pterodactyl\Services\Marketplace;

use Pterodactyl\Services\Marketplace\Sources\HangarSource;
use Pterodactyl\Services\Marketplace\Sources\ModrinthSource;
use Pterodactyl\Services\Marketplace\Sources\SpigetSource;

/**
 * Resolves which marketplace sources are enabled for this installation. Sources
 * are keyed by their stable identifier; disabled sources are hidden entirely
 * from the controller.
 */
class SourceRegistry
{
    /** @var array<string, MarketplaceSource> */
    private array $cache = [];

    /**
     * @return MarketplaceSource[]
     */
    public function all(): array
    {
        return array_values(array_filter([
            $this->get('modrinth'),
            $this->get('hangar'),
            $this->get('spiget'),
        ]));
    }

    public function get(string $key): ?MarketplaceSource
    {
        if (isset($this->cache[$key])) {
            return $this->cache[$key];
        }

        $source = match ($key) {
            'modrinth' => $this->makeModrinth(),
            'hangar' => $this->makeHangar(),
            'spiget' => $this->makeSpiget(),
            default => null,
        };

        return $this->cache[$key] = $source;
    }

    /**
     * Find an enabled source or throw a meaningful error.
     *
     * @throws MarketplaceException
     */
    public function resolve(string $key): MarketplaceSource
    {
        $source = $this->get($key);
        if ($source === null) {
            throw MarketplaceException::upstream($key, 'This marketplace source is not enabled.');
        }

        return $source;
    }

    protected function makeModrinth(): ?MarketplaceSource
    {
        if (!config('hydrodactyl.marketplace.sources.modrinth.enabled', true)) {
            return null;
        }

        return new ModrinthSource();
    }

    protected function makeHangar(): ?MarketplaceSource
    {
        if (!config('hydrodactyl.marketplace.sources.hangar.enabled', true)) {
            return null;
        }

        return new HangarSource();
    }

    protected function makeSpiget(): ?MarketplaceSource
    {
        if (!config('hydrodactyl.marketplace.sources.spiget.enabled', true)) {
            return null;
        }

        return new SpigetSource();
    }
}
