/**
 * Extra marketplace loaders for hybrid MCJars types that run both mods and
 * plugins. Used when the egg's DB `features` are missing/outdated.
 *
 * Keys are normalized egg names (lowercase). Values are feature tags merged
 * onto the egg's existing features (deduped by the caller).
 *
 * Compatibility source: https://versions.mcjars.app/api/v2/types
 */

const HYBRID_FEATURES: Record<string, string[]> = {
    // Bukkit + Mixins — Fabric / Forge / NeoForge mods + Spigot/Paper plugins
    arclight: ['plugin/paper', 'plugin/spigot', 'mod/neoforge', 'mod/forge', 'mod/fabric'],

    // Forge/NeoForge + Spigot plugins
    mohistmc: ['plugin/paper', 'plugin/spigot', 'mod/neoforge', 'mod/forge'],
    mohist: ['plugin/paper', 'plugin/spigot', 'mod/neoforge', 'mod/forge'],

    // NeoForge + Bukkit/Spigot plugins
    magma: ['plugin/paper', 'plugin/spigot', 'mod/neoforge'],

    // NeoForge hybrid with Paper/Purpur API
    youer: ['plugin/paper', 'plugin/purpur', 'plugin/spigot', 'mod/neoforge'],

    // Folia fork — plugins only, but both folia + paper tags help marketplace hits
    canvasmc: ['plugin/folia', 'plugin/paper'],
    canvas: ['plugin/folia', 'plugin/paper'],
};

export function hybridFeaturesForEggName(name: string | undefined | null): string[] {
    if (!name) return [];
    const n = name.trim().toLowerCase();
    if (HYBRID_FEATURES[n]) return HYBRID_FEATURES[n];
    for (const [key, features] of Object.entries(HYBRID_FEATURES)) {
        if (n === key || n.startsWith(`${key} `) || n.includes(key)) {
            return features;
        }
    }
    return [];
}

/** Merge egg features with hybrid defaults (egg features win on order). */
export function mergeEggMarketplaceFeatures(features: string[] | undefined | null, eggName?: string | null): string[] {
    const base = [...(features || [])];
    const extras = hybridFeaturesForEggName(eggName);
    for (const feature of extras) {
        const exists = base.some((f) => f.toLowerCase() === feature.toLowerCase());
        if (!exists) base.push(feature);
    }
    return base;
}
