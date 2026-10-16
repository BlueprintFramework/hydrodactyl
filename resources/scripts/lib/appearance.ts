export const appearanceStorageKey = 'hydrodactyl:appearance';

export const appearanceAccents = {
    panel: 'Panel default',
    blue: 'Blue',
    green: 'Green',
    violet: 'Violet',
    orange: 'Orange',
    rose: 'Rose',
} as const;

export type AppearanceMode = 'dark' | 'light' | 'system';
export interface Appearance {
    mode: AppearanceMode;
    accent: keyof typeof appearanceAccents;
}

export function parseAppearance(value: string | null): Appearance {
    let saved: Partial<Appearance> | null = null;
    try {
        saved = JSON.parse(value ?? 'null');
    } catch {
        // A corrupt preference must not prevent the panel from loading.
    }
    return {
        mode: saved?.mode === 'light' || saved?.mode === 'system' ? saved.mode : 'dark',
        accent:
            typeof saved?.accent === 'string' && Object.hasOwn(appearanceAccents, saved.accent)
                ? saved.accent
                : 'panel',
    };
}

export function readAppearance(storage?: Pick<Storage, 'getItem'>): Appearance {
    try {
        return parseAppearance((storage ?? window.localStorage).getItem(appearanceStorageKey));
    } catch {
        return parseAppearance(null);
    }
}

export function saveAppearance(preferences: Appearance, storage?: Pick<Storage, 'setItem'>): boolean {
    try {
        (storage ?? window.localStorage).setItem(appearanceStorageKey, JSON.stringify(preferences));
        return true;
    } catch {
        return false;
    }
}

export function resolveTheme(mode: AppearanceMode, systemDark: boolean): 'light' | 'dark' {
    return mode === 'system' ? (systemDark ? 'dark' : 'light') : mode;
}

export function applyAppearance(
    preferences: Appearance,
    systemDark: boolean,
    root = document.documentElement,
): 'light' | 'dark' {
    const theme = resolveTheme(preferences.mode, systemDark);
    root.dataset.theme = theme;
    root.dataset.accent = preferences.accent;
    root.style.colorScheme = theme;
    return theme;
}
