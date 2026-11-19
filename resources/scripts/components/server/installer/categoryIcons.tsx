import {
    Book,
    Briefcase,
    Brush,
    Bug,
    Code,
    Compass,
    Cube,
    Database,
    Display,
    Flame,
    Folder,
    Globe,
    Hammer,
    Heart,
    House,
    Layers,
    Lock,
    MapPin,
    Palette,
    Person,
    Puzzle,
    Rocket,
    Shield,
    ShoppingBasket,
    Sliders,
    Star,
    Tag,
    Terminal,
    Thunderbolt,
    Wrench,
} from '@gravity-ui/icons';
import type { ComponentType, SVGProps } from 'react';

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

type CategoryVisual = {
    Icon: IconComponent;
    /** Tailwind text-* class applied to the icon (fill follows currentColor). */
    colorClass: string;
};

/**
 * Best-effort icon + color map for Modrinth / Hangar / Spigot category ids or labels.
 * Unknown categories fall back to a generic tag icon.
 */
const BY_KEY: Record<string, CategoryVisual> = {
    // Modrinth
    adventure: { Icon: Compass, colorClass: 'text-emerald-400' },
    cursed: { Icon: Bug, colorClass: 'text-rose-400' },
    decoration: { Icon: Palette, colorClass: 'text-fuchsia-400' },
    economy: { Icon: ShoppingBasket, colorClass: 'text-amber-400' },
    equipment: { Icon: Hammer, colorClass: 'text-orange-400' },
    food: { Icon: Heart, colorClass: 'text-red-400' },
    'game-mechanics': { Icon: House, colorClass: 'text-sky-400' },
    gamemechanics: { Icon: House, colorClass: 'text-sky-400' },
    library: { Icon: Book, colorClass: 'text-violet-400' },
    magic: { Icon: Flame, colorClass: 'text-orange-500' },
    management: { Icon: Briefcase, colorClass: 'text-slate-300' },
    minigame: { Icon: Star, colorClass: 'text-yellow-400' },
    mobs: { Icon: Bug, colorClass: 'text-lime-400' },
    optimization: { Icon: Sliders, colorClass: 'text-cyan-400' },
    social: { Icon: Person, colorClass: 'text-pink-400' },
    storage: { Icon: Database, colorClass: 'text-blue-400' },
    technology: { Icon: Cube, colorClass: 'text-indigo-400' },
    transportation: { Icon: Rocket, colorClass: 'text-teal-400' },
    utility: { Icon: Wrench, colorClass: 'text-brand-300' },
    worldgen: { Icon: Globe, colorClass: 'text-green-400' },
    // Hangar
    admin_tools: { Icon: Lock, colorClass: 'text-red-400' },
    chat: { Icon: Person, colorClass: 'text-sky-300' },
    dev_tools: { Icon: Code, colorClass: 'text-violet-300' },
    gameplay: { Icon: Puzzle, colorClass: 'text-emerald-300' },
    games: { Icon: Star, colorClass: 'text-yellow-300' },
    protection: { Icon: Shield, colorClass: 'text-blue-300' },
    role_playing: { Icon: Compass, colorClass: 'text-amber-300' },
    world_management: { Icon: Layers, colorClass: 'text-teal-300' },
    misc: { Icon: Cube, colorClass: 'text-cream-400/80' },
    // Spigot / Spiget (by normalized label)
    toolsandutilities: { Icon: Wrench, colorClass: 'text-brand-300' },
    'tools and utilities': { Icon: Wrench, colorClass: 'text-brand-300' },
    librariesapis: { Icon: Book, colorClass: 'text-violet-400' },
    'libraries / apis': { Icon: Book, colorClass: 'text-violet-400' },
    fun: { Icon: Star, colorClass: 'text-yellow-400' },
    worldmanagement: { Icon: Layers, colorClass: 'text-teal-400' },
    mechanics: { Icon: Thunderbolt, colorClass: 'text-amber-400' },
    gamemode: { Icon: Display, colorClass: 'text-indigo-300' },
    skript: { Icon: Terminal, colorClass: 'text-green-300' },
    web: { Icon: Globe, colorClass: 'text-cyan-300' },
    datapack: { Icon: Folder, colorClass: 'text-orange-300' },
};

const FALLBACK: CategoryVisual = { Icon: Tag, colorClass: 'text-cream-400/70' };

const normalize = (value: string): string =>
    value
        .toLowerCase()
        .trim()
        .replace(/[·#].*$/, '')
        .replace(/[-_\s/]+/g, '');

const resolveVisual = (id: string, label?: string): CategoryVisual => {
    const candidates = [id, label ?? '', normalize(id), normalize(label ?? '')].filter(Boolean);
    for (const key of candidates) {
        const direct = BY_KEY[key.toLowerCase()] ?? BY_KEY[normalize(key)];
        if (direct) return direct;
    }

    const hay = normalize(`${id} ${label ?? ''}`);
    if (hay.includes('chat')) return { Icon: Person, colorClass: 'text-sky-300' };
    if (hay.includes('econom')) return { Icon: ShoppingBasket, colorClass: 'text-amber-400' };
    if (hay.includes('protect') || hay.includes('secur')) return { Icon: Shield, colorClass: 'text-blue-300' };
    if (hay.includes('world')) return { Icon: Layers, colorClass: 'text-teal-400' };
    if (hay.includes('tool') || hay.includes('util')) return { Icon: Wrench, colorClass: 'text-brand-300' };
    if (hay.includes('lib') || hay.includes('api')) return { Icon: Book, colorClass: 'text-violet-400' };
    if (hay.includes('admin')) return { Icon: Lock, colorClass: 'text-red-400' };
    if (hay.includes('dev')) return { Icon: Code, colorClass: 'text-violet-300' };
    if (hay.includes('transport')) return { Icon: Rocket, colorClass: 'text-teal-400' };
    if (hay.includes('map') || hay.includes('teleport')) return { Icon: MapPin, colorClass: 'text-rose-300' };
    if (hay.includes('paint') || hay.includes('decor')) return { Icon: Brush, colorClass: 'text-fuchsia-400' };

    return FALLBACK;
};

/** @deprecated Prefer categoryVisual — kept for any leftover call sites. */
export const categoryIcon = (id: string, label?: string): IconComponent => resolveVisual(id, label).Icon;

export const categoryVisual = (id: string, label?: string): CategoryVisual => resolveVisual(id, label);
