import type { MarketplaceType } from '@/api/server/marketplace';

const normalize = (value: string): string =>
    value
        .toLowerCase()
        .trim()
        .replace(/[-_\s]/g, '');

/**
 * Normalize raw loader identifiers from egg features onto the canonical names
 * used by marketplace providers (e.g. "neo_forge" -> "neoforge").
 */
const normalizeLoader = (raw: string): string => {
    const n = normalize(raw);
    if (n === 'neoforge' || n === 'neofrge') return 'neoforge';
    return n;
};

/**
 * Extract the loaders a server supports for the given content type from its egg
 * features. When `knownLoaders` (the live Modrinth tag list) is supplied, each
 * extracted loader is validated against it so the installer only offers loaders
 * the marketplace actually recognizes; when it is absent (fetch pending/failed)
 * the egg feature is trusted as-is.
 *
 * @param features     e.g. ["eula", "java_version", "mod/fabric", "mclogs"]
 * @param type         "mod" | "plugin"
 * @param knownLoaders live Modrinth loader-tag names (optional)
 */
export const loadersFor = (features: string[], type: MarketplaceType, knownLoaders?: string[]): string[] => {
    const known = knownLoaders && knownLoaders.length > 0 ? new Set(knownLoaders.map(normalize)) : null;
    const found: string[] = [];

    for (const feature of features) {
        const normalized = normalize(feature);
        const prefix = `${type}/`;
        if (!normalized.startsWith(prefix)) continue;

        const loader = normalizeLoader(normalized.slice(prefix.length));
        if (known && !known.has(loader)) continue;
        if (!found.includes(loader)) {
            found.push(loader);
        }
    }

    return found;
};

/**
 * Whether the server's egg can install the given content type.
 */
export const supportsType = (features: string[], type: MarketplaceType): boolean => {
    const prefix = `${type}/`;
    return features.some((feature) => normalize(feature).startsWith(prefix));
};

/**
 * Whether this looks like any Minecraft server capable of using mods/plugins.
 */
export const isMinecraftCapable = (features: string[]): boolean =>
    supportsType(features, 'mod') || supportsType(features, 'plugin');

/**
 * Container-relative folder a content type installs into.
 */
export const destinationFolder = (type: MarketplaceType): string => (type === 'plugin' ? 'plugins' : 'mods');
