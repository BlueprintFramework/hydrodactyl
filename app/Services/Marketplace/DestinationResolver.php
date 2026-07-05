<?php

namespace Pterodactyl\Services\Marketplace;

/**
 * Resolves where installed content should land and which loaders a server
 * supports, based on the egg features attached to the server.
 *
 * Egg features for Minecraft look like "mod/fabric", "mod/forge", "plugin/paper"
 * or "vanilla". Mods always go in the loader's "mods" directory; plugins in
 * "plugins".
 */
class DestinationResolver
{
    /**
     * Return the container-relative directory a given content type should be
     * installed into.
     */
    public function directory(string $type): string
    {
        return (string) config('hydrodactyl.marketplace.destinations.' . $type, $type === 'plugin' ? 'plugins' : 'mods');
    }

    /**
     * Determine whether the server can install the given content type based on
     * its egg features.
     *
     * @param string[] $eggFeatures
     */
    public function supportsType(array $eggFeatures, string $type): bool
    {
        foreach ($eggFeatures as $feature) {
            if (str_starts_with(strtolower((string) $feature), $type . '/')) {
                return true;
            }
        }

        return false;
    }

    /**
     * Detect the loaders a server supports from its egg features. Returns the
     * marketplace-normalized loader names (e.g. "fabric", "neoforge").
     *
     * @param string[] $eggFeatures
     *
     * @return string[]
     */
    public function loaders(array $eggFeatures, string $type): array
    {
        $loaders = [];
        foreach ($eggFeatures as $feature) {
            $normalized = strtolower((string) $feature);
            $prefix = $type . '/';
            if (!str_starts_with($normalized, $prefix)) {
                continue;
            }
            $loader = $this->normalizeLoader(substr($normalized, strlen($prefix)));
            if ($loader !== null && $loader !== '' && !in_array($loader, $loaders, true)) {
                $loaders[] = $loader;
            }
        }

        return $loaders;
    }

    /**
     * Returns true when the egg features indicate any Minecraft server capable
     * of using mods or plugins.
     *
     * @param string[] $eggFeatures
     */
    public function isMinecraftCapable(array $eggFeatures): bool
    {
        foreach ($eggFeatures as $feature) {
            $normalized = strtolower((string) $feature);
            if (str_starts_with($normalized, 'mod/') || str_starts_with($normalized, 'plugin/')) {
                return true;
            }
        }

        return false;
    }

    protected function normalizeLoader(string $loader): ?string
    {
        $loader = trim($loader);
        if ($loader === '') {
            return null;
        }

        return match ($loader) {
            'neo-forge', 'neo_forge', 'neo forge' => 'neoforge',
            default => $loader,
        };
    }
}
