import { createContext, type ReactNode, useContext, useEffect, useState } from 'react';
import {
    type Appearance,
    appearanceStorageKey,
    applyAppearance,
    parseAppearance,
    readAppearance,
    resolveTheme,
    saveAppearance,
} from '@/lib/appearance';

const AppearanceContext = createContext<{
    preferences: Appearance;
    theme: 'light' | 'dark';
    persistent: boolean;
    updateAppearance: (change: Partial<Appearance>) => void;
} | null>(null);

export function AppearanceProvider({ children }: { children: ReactNode }) {
    const [preferences, setPreferences] = useState(readAppearance);
    const [systemDark, setSystemDark] = useState(
        () => window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? true,
    );
    const [persistent, setPersistent] = useState(true);
    const theme = resolveTheme(preferences.mode, systemDark);

    useEffect(() => {
        const media = window.matchMedia?.('(prefers-color-scheme: dark)');
        const sync = () => setSystemDark(media?.matches ?? true);
        sync();
        media?.addEventListener('change', sync);
        return () => media?.removeEventListener('change', sync);
    }, []);

    useEffect(() => {
        applyAppearance(preferences, systemDark);
        document
            .querySelector('meta[name="theme-color"]')
            ?.setAttribute('content', theme === 'light' ? '#f8f6f3' : '#0c0a09');
    }, [preferences, systemDark, theme]);

    useEffect(() => {
        const sync = (event: StorageEvent) => {
            if (event.storageArea && event.storageArea !== window.localStorage) return;
            if (event.key === appearanceStorageKey || event.key === null) {
                setPreferences(parseAppearance(event.newValue));
                setPersistent(true);
            }
        };
        window.addEventListener('storage', sync);
        return () => window.removeEventListener('storage', sync);
    }, []);

    const updateAppearance = (change: Partial<Appearance>) => {
        const next = { ...preferences, ...change };
        setPreferences(next);
        setPersistent(saveAppearance(next));
    };

    return (
        <AppearanceContext.Provider value={{ preferences, theme, persistent, updateAppearance }}>
            {children}
        </AppearanceContext.Provider>
    );
}

export function useAppearance() {
    const context = useContext(AppearanceContext);
    if (!context) throw new Error('useAppearance requires AppearanceProvider');
    return context;
}
