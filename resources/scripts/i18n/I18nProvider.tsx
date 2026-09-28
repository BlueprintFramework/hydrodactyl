import type { Locale } from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import { useStoreState } from 'easy-peasy';
import { type ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { interpolate } from '@/i18n/interpolate';
import { isLocaleCode, loadDateFnsLocale, loadLocale, localeDefinitions } from '@/i18n/loader';
import en from '@/i18n/locales/en.json';
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

function resolveLocale(...candidates: (string | null | undefined)[]): LocaleCode {
    for (const candidate of candidates) {
        if (isLocaleCode(candidate)) {
            return candidate;
        }
    }

    return 'en';
}

interface I18nProviderProps {
    children: ReactNode;
}

const I18nProvider = ({ children }: I18nProviderProps) => {
    const userLanguage = useStoreState((state) => state.user.data?.language);
    const siteLocale = useStoreState((state) => state.settings.data?.locale);
    const [persistedLocale, setPersistedLocale] = usePersistedState<LocaleCode | null>(STORAGE_KEY, null);
    const [locale, setLocaleState] = useState<LocaleCode>(() => resolveLocale(persistedLocale, userLanguage, siteLocale));

    const [dictionary, setDictionary] = useState<Translations>(en);
    const [ready, setReady] = useState(locale === 'en');
    const [dateFnsLocale, setDateFnsLocale] = useState<Locale>(enUS);

    useEffect(() => {
        let cancelled = false;

        if (locale === 'en') {
            setDictionary(en);
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

        loadDateFnsLocale(locale).then((loaded) => {
            if (!cancelled) {
                setDateFnsLocale(loaded);
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
        (key, params) => interpolate(lookup(dictionary, key) ?? lookup(en, key) ?? key, params),
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
