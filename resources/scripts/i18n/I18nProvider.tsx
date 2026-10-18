import enUSDictionary from '@lang/en-US/ui.json';
import type { Locale } from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import { useStoreState } from 'easy-peasy';
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { interpolate } from '@/i18n/interpolate';
import { DEFAULT_LOCALE, loadDateFnsLocale, loadLocale, localeLabel, matchLocale } from '@/i18n/loader';
import type {
    DeepPartial,
    I18nContextValue,
    LocaleCode,
    LocaleDefinition,
    Translate,
    Translations,
} from '@/i18n/types';
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

function resolveLocale(codes: string[], ...candidates: (string | null | undefined)[]): LocaleCode {
    for (const candidate of candidates) {
        const match = matchLocale(candidate, codes);

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
    const configuredLocales = useStoreState((state) => state.settings.data?.locales);
    const [persistedLocale, setPersistedLocale] = usePersistedState<LocaleCode | null>(STORAGE_KEY, null);

    // Languages are discovered by the backend and injected into the page, so a
    // folder dropped into resources/lang shows up on the next page load.
    const locales = useMemo<LocaleDefinition[]>(() => {
        const definitions = (configuredLocales ?? []).map((entry) => ({
            code: entry.code,
            label: entry.name || localeLabel(entry.code),
        }));

        if (!definitions.some((entry) => entry.code === DEFAULT_LOCALE)) {
            definitions.unshift({ code: DEFAULT_LOCALE, label: localeLabel(DEFAULT_LOCALE) });
        }

        return definitions;
    }, [configuredLocales]);
    const codes = useMemo(() => locales.map((entry) => entry.code), [locales]);

    // The account language wins: it is the server-side source of truth, so a
    // change made by an administrator is picked up on the next page load. The
    // local override is only a fallback for guests (setup wizard, login) and an
    // instant boot cache. The default locale is treated as "no opinion" so the
    // browser can pick one of the shipped languages instead.
    const [locale, setLocaleState] = useState<LocaleCode>(() =>
        resolveLocale(
            codes,
            userLanguage,
            persistedLocale,
            siteLocale === DEFAULT_LOCALE ? undefined : siteLocale,
            ...browserLocales(),
        ),
    );

    // Keep the local cache in sync with the account preference and follow it
    // when the data changes at runtime (e.g. a fresh account fetch).
    useEffect(() => {
        const match = matchLocale(userLanguage, codes);

        if (match) {
            setLocaleState((current) => (current === match ? current : match));
            setPersistedLocale(match);
        }
    }, [userLanguage, codes, setPersistedLocale]);

    const [dictionary, setDictionary] = useState<Translations>(enUSDictionary);
    const [ready, setReady] = useState(locale === DEFAULT_LOCALE);

    const [dateFnsLocale, setDateFnsLocale] = useState<Locale>(enUS);

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

        void loadDateFnsLocale(locale).then((value) => {
            if (!cancelled) {
                setDateFnsLocale(value);
            }
        });

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
            locales,
            ready,
            dateFnsLocale,
            setLocale,
            t,
        }),
        [locale, locales, ready, dateFnsLocale, setLocale, t],
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
