/**
 * Maps panel egg names to MCJars software icons.
 * Icons are served from public/icons/mcjars (copied from https://s3.mcjars.app/icons).
 */

const MCJARS_ICON_BASE = '/icons/mcjars';

/** Exact / normalized egg name → icon slug */
const EGG_NAME_TO_ICON: Record<string, string> = {
    vanilla: 'vanilla',
    'vanilla minecraft': 'vanilla',
    paper: 'paper',
    purpur: 'purpur',
    folia: 'folia',
    spigot: 'spigot',
    pufferfish: 'pufferfish',
    velocity: 'velocity',
    waterfall: 'waterfall',
    bungeecord: 'bungeecord',
    fabric: 'fabric',
    quilt: 'quilt',
    forge: 'forge',
    'forge minecraft': 'forge',
    'forge enhanced': 'forge',
    neoforge: 'neoforge',
    mohist: 'mohist',
    mohistmc: 'mohist',
    arclight: 'arclight',
    sponge: 'sponge',
    'sponge (spongeneo)': 'sponge',
    'sponge (spongeforge)': 'sponge',
    'sponge (spongevanilla)': 'sponge',
    leaves: 'leaves',
    canvas: 'canvas',
    canvasmc: 'canvas',
};

export function getMcjarsIconUrl(eggName: string | undefined | null): string | null {
    if (!eggName) return null;

    const normalized = eggName.trim().toLowerCase();
    const direct = EGG_NAME_TO_ICON[normalized];
    if (direct) {
        return `${MCJARS_ICON_BASE}/${direct}.png`;
    }

    for (const [key, slug] of Object.entries(EGG_NAME_TO_ICON)) {
        if (normalized.includes(key)) {
            return `${MCJARS_ICON_BASE}/${slug}.png`;
        }
    }

    return null;
}
