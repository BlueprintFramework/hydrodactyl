import enUSDictionary from '@lang/en-US/ui.json';
import { useStoreState } from 'easy-peasy';
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { interpolate } from '@/i18n/interpolate';
import { DEFAULT_LOCALE, getDateFnsLocale, loadLocale, localeDefinitions, matchLocale } from '@/i18n/loader';
import type { DeepPartial, I18nContextValue, LocaleCode, Translate, Translations } from '@/i18n/types';
import { usePersistedState } from '@/plugins/usePersistedState';

const STORAGE_KEY = 'hydrodactyl:i18n:locale';

const I18nContext = createContext<I18nContextValue | null>(null);

function lookup(dictionary: DeepPartial<Translations>, key: string): string | undefined {
    let node: unknown = dictionary;

    for (const segment of key.split('.')) {
        if (typeof node !== 'object' || node === null) {
            return undefined;
        }

        node = (node as Record<string, unknown>)[segment];
    }

    return typeof node === 'string' ? node : undefined;
}

/**
 * Preferred languages reported by the browser. Used as a last resort so a
 * visitor with no stored preference gets a locale we actually ship, without
 * having to configure anything.
 */
function browserLocales(): string[] {
    if (typeof navigator === 'undefined') {
        return [];
    }

    const languages = navigator.languages?.length ? navigator.languages : [navigator.language];

    return languages.filter((value): value is string => typeof value === 'string' && value.length > 0);
}

function resolveLocale(...candidates: (string | null | undefined)[]): LocaleCode {
    for (const candidate of candidates) {
        const match = matchLocale(candidate);

        if (match) {
            return match;
        }
    }

    return DEFAULT_LOCALE;
}

interface I18nProviderProps {
    children: ReactNode;
}

const I18nProvider = ({ children }: I18nProviderProps) => {
    const userLanguage = useStoreState((state) => state.user.data?.language);
    const siteLocale = useStoreState((state) => state.settings.data?.locale);
    const [persistedLocale, setPersistedLocale] = usePersistedState<LocaleCode | null>(STORAGE_KEY, null);

    // Stored/user/site preferences win. The default locale is treated as "no
    // opinion" so the browser can pick one of the shipped languages instead.
    const [locale, setLocaleState] = useState<LocaleCode>(() =>
        resolveLocale(
            persistedLocale,
            userLanguage,
            siteLocale === DEFAULT_LOCALE ? undefined : siteLocale,
            ...browserLocales(),
        ),
    );

    const [dictionary, setDictionary] = useState<Translations>(enUSDictionary);
    const [ready, setReady] = useState(locale === DEFAULT_LOCALE);

    const dateFnsLocale = useMemo(() => getDateFnsLocale(locale), [locale]);

    useEffect(() => {
        let cancelled = false;

        if (locale === DEFAULT_LOCALE) {
            setDictionary(enUSDictionary);
            setReady(true);
        } else {
            setReady(false);
            loadLocale(locale).then((translations) => {
                if (!cancelled) {
                    setDictionary(translations);
                    setReady(true);
                }
            });
        }

        document.documentElement.lang = locale;

        return () => {
            cancelled = true;
        };
    }, [locale]);

    const setLocale = useCallback(
        (code: LocaleCode) => {
            setPersistedLocale(code);
            setLocaleState(code);
        },
        [setPersistedLocale],
    );

    const t = useCallback<Translate>(
        (key, params) => interpolate(lookup(dictionary, key) ?? lookup(enUSDictionary, key) ?? key, params),
        [dictionary],
    );

    const value = useMemo<I18nContextValue>(
        () => ({
            locale,
            locales: localeDefinitions,
            ready,
            dateFnsLocale,
            setLocale,
            t,
        }),
        [locale, ready, dateFnsLocale, setLocale, t],
    );

    return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export function useTranslation(): I18nContextValue {
    const context = useContext(I18nContext);

    if (context === null) {
        throw new Error('useTranslation() must be used within an I18nProvider.');
    }

    return context;
}

export default I18nProvider;
