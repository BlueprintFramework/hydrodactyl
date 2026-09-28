import type enUS from '@/i18n/locales/en-US.json';

/**
 * The canonical dictionary shape. Every locale must be assignable to a deep
 * partial of this type; missing keys fall back to English at runtime.
 */
export type Translations = typeof enUS;

/**
 * Locale codes are plain BCP-47-ish strings ("en-US", "es-ES", "fr-FR", ...).
 * The concrete set is discovered at runtime from the JSON dictionaries in
 * `i18n/locales`, so adding a language never requires touching this type.
 */
export type LocaleCode = string;

export type TranslationParams = Record<string, string | number>;

export type DeepPartial<T> = {
    [K in keyof T]?: T[K] extends string ? T[K] : DeepPartial<T[K]>;
};

type Join<K extends string, P extends string> = `${K}.${P}`;

type Paths<T> = {
    [K in keyof T & string]: T[K] extends string ? K : Join<K, Paths<T[K]>>;
}[keyof T & string];

/**
 * Every dot-separated path that terminates in a string in the canonical
 * dictionary. Using an unknown key is a compile-time error.
 */
export type TranslationKey = Paths<Translations>;

export type Translate = (key: TranslationKey, params?: TranslationParams) => string;

export interface LocaleDefinition {
    code: LocaleCode;
    label: string;
}

export interface I18nContextValue {
    locale: LocaleCode;
    locales: LocaleDefinition[];
    ready: boolean;
    dateFnsLocale: import('date-fns').Locale;
    setLocale: (code: LocaleCode) => void;
    t: Translate;
}
