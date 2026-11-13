import type { MarketplaceType } from '@/api/server/marketplace';

/**
 * Static metadata for sources the UI knows how to label. The authoritative list
 * of enabled sources for a given type is returned by the backend search
 * endpoint; these labels just keep the display strings in one place.
 */
export const SOURCE_LABELS: Record<string, string> = {
    modrinth: 'Modrinth',
    hangar: 'Hangar',
    spiget: 'Spigot',
};

/**
 * Pretty label for a source key with a safe fallback.
 */
export const sourceLabel = (key: string): string => SOURCE_LABELS[key] ?? key;

/** Default marketplace provider for browse (always Modrinth when available). */
export const DEFAULT_SOURCE = 'modrinth';

/**
 * Default source for a tab when the user hasn't picked one yet. Prefers
 * Modrinth (which serves both mods and plugins) and otherwise falls back to the
 * first available source. The caller passes only sources already filtered for
 * the active content type by the backend.
 */
export const defaultSource = (available: string[]): string | null => {
    if (available.length === 0) return DEFAULT_SOURCE;
    if (available.includes('modrinth')) return 'modrinth';
    return available[0] ?? DEFAULT_SOURCE;
};

export type { MarketplaceType };
