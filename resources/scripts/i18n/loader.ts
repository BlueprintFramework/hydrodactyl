import { deepmerge } from 'deepmerge-ts';
import type { Locale } from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';

import en from '@/i18n/locales/en.json';
import type { DeepPartial, LocaleCode, LocaleDefinition, Translations } from '@/i18n/types';

interface LocaleModule {
    default: DeepPartial<Translations>;
}

/**
 * Locales exposed in the UI. Codes must be two-letter ISO 639-1 values, which
 * is all the backend (`AvailableLanguages`, `LocaleRequest`) accepts.
 */
export const localeDefinitions: LocaleDefinition[] = [
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Español (España)' },
];

/**
 * Static loader map. Vite requires literal specifiers to code-split chunks;
 * never build these paths dynamically.
 */
export const loaders: Record<LocaleCode, () => Promise<LocaleModule>> = {
    en: () => Promise.resolve({ default: en }),
    es: () => import('@/i18n/locales/es.json'),
};

export const dateFnsLoaders: Record<LocaleCode, () => Promise<Locale>> = {
    en: () => Promise.resolve(enUS),
    es: async () => (await import('date-fns/locale/es')).es,
};

/** Locale identifiers understood by `cronstrue/i18n`. */
export const cronstrueLocales: Record<LocaleCode, string> = {
    en: 'en',
    es: 'es',
};

export function isLocaleCode(value: unknown): value is LocaleCode {
    return typeof value === 'string' && value in loaders;
}

/**
 * Load a locale dictionary merged over the canonical English dictionary, so
 * partially translated locales fall back per key instead of rendering blanks.
 */
export async function loadLocale(code: LocaleCode): Promise<Translations> {
    const overrides = await loaders[code]();

    return deepmerge(en, overrides.default) as Translations;
}

export function loadDateFnsLocale(code: LocaleCode): Promise<Locale> {
    return dateFnsLoaders[code]();
}
