import type { Egg } from './types';

/**
 * Ordering inspired by https://mcjars.app sidebar categories.
 * Favorites = first 5 from Recommended (excluding Velocity proxy).
 */

export const FAVORITE_SOFTWARE = [
    'vanilla minecraft',
    'vanilla',
    'paper',
    'fabric',
    'forge minecraft',
    'forge',
    'neoforge',
] as const;

/** Display order for the Favoritos section (exact preferred names first). */
export const FAVORITE_DISPLAY_ORDER = ['Vanilla Minecraft', 'Paper', 'Fabric', 'Forge Minecraft', 'Neoforge'] as const;

/** Full priority list after favorites (MCJars Established → Experimental → Misc → Limbos). */
const PRIORITY_ORDER: string[] = [
    // Established
    'purpur',
    'pufferfish',
    'folia',
    'sponge (spongeneo)',
    'sponge (spongeforge)',
    'sponge (spongevanilla)',
    'sponge',
    'spigot',
    'bungeecord',
    'waterfall',
    'velocity',
    // Experimental
    'quilt',
    // Miscellaneous
    'canvasmc',
    'canvas',
    'arclight',
    'mohistmc',
    'mohist',
    'magma',
    'leaves',
    'leaf',
    // Limbos
    'nanolimbo',
    'limbo',
    // Bedrock / other common
    'vanilla bedrock',
    'vanilla bedrock arm64',
    'liteloader bedrock dedicated server',
    'nukkit',
    'powernukkitx',
    'pocketminemp',
    'waterdog pe',
    'purpur-geyser-floodgate',
    'vanillacord',
    'travertine',
    'krypton',
    'glowstone',
    'gomint',
    'cuberite',
    'viaaas',
    'forge enhanced',
    'curseforge generic',
    'levilamina',
    'veloren',
];

export type SoftwareSectionId = 'favorites' | 'established' | 'experimental' | 'miscellaneous' | 'limbos' | 'other';

export interface SoftwareSection {
    id: SoftwareSectionId;
    eggs: Egg[];
}

const ESTABLISHED = new Set([
    'purpur',
    'pufferfish',
    'folia',
    'sponge (spongeneo)',
    'sponge (spongeforge)',
    'sponge (spongevanilla)',
    'sponge',
    'spigot',
    'bungeecord',
    'waterfall',
    'velocity',
]);

const EXPERIMENTAL = new Set(['quilt']);

const MISCELLANEOUS = new Set(['canvasmc', 'canvas', 'arclight', 'mohistmc', 'mohist', 'magma', 'leaves', 'leaf']);

const LIMBOS = new Set(['nanolimbo', 'limbo']);

function normalizeName(name: string): string {
    return name.trim().toLowerCase();
}

function priorityIndex(name: string): number {
    const n = normalizeName(name);
    const idx = PRIORITY_ORDER.indexOf(n);
    if (idx >= 0) return idx;
    // Fuzzy contains match for variants
    const fuzzy = PRIORITY_ORDER.findIndex((p) => n.includes(p) || p.includes(n));
    return fuzzy >= 0 ? fuzzy : 10_000;
}

function sortEggs(eggs: Egg[]): Egg[] {
    return [...eggs].sort((a, b) => {
        const pa = priorityIndex(a.attributes.name);
        const pb = priorityIndex(b.attributes.name);
        if (pa !== pb) return pa - pb;
        return a.attributes.name.localeCompare(b.attributes.name);
    });
}

function isFavoriteName(name: string): boolean {
    const n = normalizeName(name);
    return FAVORITE_SOFTWARE.some((f) => n === f || n.startsWith(`${f} `));
}

/**
 * Pick up to 5 favorite eggs, preferring the canonical display names / types
 * and avoiding duplicates (e.g. two Fabric eggs).
 */
export function pickFavoriteEggs(eggs: Egg[]): Egg[] {
    const picked: Egg[] = [];
    const usedTypes = new Set<string>();

    const typeKey = (name: string): string => {
        const n = normalizeName(name);
        if (n.includes('vanilla') && !n.includes('bedrock') && !n.includes('cord')) return 'vanilla';
        if (n === 'paper' || n.startsWith('paper ')) return 'paper';
        if (n.includes('fabric')) return 'fabric';
        if (n.includes('neoforge')) return 'neoforge';
        if (n.includes('forge')) return 'forge';
        return n;
    };

    for (const preferred of FAVORITE_DISPLAY_ORDER) {
        const preferredNorm = normalizeName(preferred);
        const match =
            eggs.find((e) => normalizeName(e.attributes.name) === preferredNorm) ||
            eggs.find((e) => {
                const key = typeKey(e.attributes.name);
                return key === typeKey(preferred) && isFavoriteName(e.attributes.name);
            });

        if (!match) continue;
        const key = typeKey(match.attributes.name);
        if (usedTypes.has(key)) continue;
        usedTypes.add(key);
        picked.push(match);
        if (picked.length >= 5) break;
    }

    return picked;
}

function sectionForEgg(egg: Egg, favoriteIds: Set<string>): SoftwareSectionId {
    if (favoriteIds.has(egg.attributes.uuid)) return 'favorites';
    const n = normalizeName(egg.attributes.name);
    if (ESTABLISHED.has(n) || [...ESTABLISHED].some((x) => n.includes(x))) return 'established';
    if (EXPERIMENTAL.has(n)) return 'experimental';
    if (MISCELLANEOUS.has(n) || [...MISCELLANEOUS].some((x) => n.includes(x))) return 'miscellaneous';
    if (LIMBOS.has(n) || [...LIMBOS].some((x) => n.includes(x))) return 'limbos';
    return 'other';
}

/** Group + sort eggs into MCJars-inspired sections. Favorites first. */
export function groupEggsByPriority(eggs: Egg[]): SoftwareSection[] {
    const favorites = pickFavoriteEggs(eggs);
    const favoriteIds = new Set(favorites.map((e) => e.attributes.uuid));
    const rest = eggs.filter((e) => !favoriteIds.has(e.attributes.uuid));

    const buckets: Record<Exclude<SoftwareSectionId, 'favorites'>, Egg[]> = {
        established: [],
        experimental: [],
        miscellaneous: [],
        limbos: [],
        other: [],
    };

    for (const egg of rest) {
        const section = sectionForEgg(egg, favoriteIds);
        if (section === 'favorites') continue;
        buckets[section].push(egg);
    }

    const sections: SoftwareSection[] = [];
    if (favorites.length > 0) {
        sections.push({ id: 'favorites', eggs: favorites });
    }

    (['established', 'experimental', 'miscellaneous', 'limbos', 'other'] as const).forEach((id) => {
        const sorted = sortEggs(buckets[id]);
        if (sorted.length > 0) {
            sections.push({ id, eggs: sorted });
        }
    });

    return sections;
}
