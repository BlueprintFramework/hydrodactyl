/**
 * Map panel egg display names → MCJars TYPE keys used by install scripts
 * and the versions.mcjars.app API.
 *
 * The Software catalog only lists eggs that resolve to a MCJars Java type.
 * Bedrock / PocketMine / Waterdog PE / etc. are never on MCJars.
 */

const EXACT: Record<string, string> = {
    'vanilla minecraft': 'VANILLA',
    vanilla: 'VANILLA',
    paper: 'PAPER',
    folia: 'FOLIA',
    purpur: 'PURPUR',
    pufferfish: 'PUFFERFISH',
    spigot: 'SPIGOT',
    fabric: 'FABRIC',
    quilt: 'QUILT',
    'forge minecraft': 'FORGE',
    forge: 'FORGE',
    neoforge: 'NEOFORGE',
    velocity: 'VELOCITY',
    waterfall: 'WATERFALL',
    bungeecord: 'BUNGEECORD',
    'sponge (spongevanilla)': 'SPONGE',
    limbo: 'NANOLIMBO',
    nanolimbo: 'NANOLIMBO',
    canvasmc: 'CANVAS',
    canvas: 'CANVAS',
    mohistmc: 'MOHIST',
    mohist: 'MOHIST',
    magma: 'MAGMA',
    arclight: 'ARCLIGHT',
    leaves: 'LEAVES',
    leaf: 'LEAF',
};

/** Fragile hybrid installers — not offered in the MCJars catalog. */
const HIDDEN = new Set(['sponge (spongeforge)', 'sponge (spongeneo)']);

const BEDROCK_HINTS = [
    'bedrock',
    'nukkit',
    'powernukkit',
    'pocketmine',
    'waterdog',
    'geyser',
    'floodgate',
    'levilamina',
    'liteloader bedrock',
];

export function isBedrockSoftwareEgg(name: string | undefined | null): boolean {
    if (!name) return false;
    const n = name.trim().toLowerCase();
    return BEDROCK_HINTS.some((hint) => n.includes(hint));
}

export function isHiddenSoftwareEgg(name: string | undefined | null): boolean {
    if (!name) return false;
    const n = name.trim().toLowerCase();
    if (HIDDEN.has(n)) return true;
    if (isBedrockSoftwareEgg(n)) return true;
    return false;
}

/**
 * True when this egg should appear in the flat Minecraft Software catalog:
 * maps to MCJars and is not Bedrock / hidden hybrids.
 */
export function isMcjarsCatalogEgg(name: string | undefined | null): boolean {
    if (!name || isHiddenSoftwareEgg(name)) return false;
    return eggNameToMcjarsType(name) !== null;
}

export function eggNameToMcjarsType(name: string | undefined | null): string | null {
    if (!name) return null;
    const n = name.trim().toLowerCase();
    if (isBedrockSoftwareEgg(n)) return null;
    // Avoid matching plain "forge" inside "forge enhanced" etc. via fuzzy startsWith
    // for names we do not intentionally support on MCJars.
    if (n.includes('enhanced') || n.includes('generic') || n.includes('vanillacord')) {
        return null;
    }
    if (EXACT[n]) return EXACT[n];
    for (const [key, type] of Object.entries(EXACT)) {
        if (n === key || n.startsWith(`${key} `)) return type;
    }
    if (n.includes('sponge') && n.includes('vanilla')) return 'SPONGE';
    return null;
}

/** Pick a docker image display name from egg images given a required Java major. */
export function pickJavaDockerImage(
    dockerImages: Record<string, string> | undefined,
    java: number | null | undefined,
): string {
    const keys = Object.keys(dockerImages || {});
    if (keys.length === 0) return '';

    if (java && java > 0) {
        const exact = keys.find((k) => new RegExp(`\\bjava\\s*${java}\\b`, 'i').test(k) || k.endsWith(`_${java}`));
        if (exact) return exact;

        // Prefer the lowest image whose major >= required.
        const scored = keys
            .map((k) => {
                const m = k.match(/(\d+)\s*$/) || k.match(/java[_\s-]?(\d+)/i);
                return { key: k, major: m ? parseInt(m[1], 10) : 0 };
            })
            .filter((x) => x.major >= java)
            .sort((a, b) => a.major - b.major);
        if (scored[0]) return scored[0].key;
    }

    return keys[0] || '';
}

export function formatBytes(bytes: number | null | undefined): string {
    if (!bytes || bytes <= 0) return '—';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
