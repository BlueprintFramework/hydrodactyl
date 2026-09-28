import enUSDictionary from '@lang/en-US/ui.json';
import type { Locale } from 'date-fns';
import { de } from 'date-fns/locale/de';
import { enGB } from 'date-fns/locale/en-GB';
import { enUS } from 'date-fns/locale/en-US';
import { es } from 'date-fns/locale/es';
import { fr } from 'date-fns/locale/fr';
import { it } from 'date-fns/locale/it';
import { ja } from 'date-fns/locale/ja';
import { ko } from 'date-fns/locale/ko';
import { nl } from 'date-fns/locale/nl';
import { pl } from 'date-fns/locale/pl';
import { pt } from 'date-fns/locale/pt';
import { ptBR } from 'date-fns/locale/pt-BR';
import { ru } from 'date-fns/locale/ru';
import { tr } from 'date-fns/locale/tr';
import { uk } from 'date-fns/locale/uk';
import { zhCN } from 'date-fns/locale/zh-CN';
import { zhTW } from 'date-fns/locale/zh-TW';
import { deepmerge } from 'deepmerge-ts';
import type { DeepPartial, Translations } from '@/i18n/types';

/**
 * Locale used when nothing else has a preference. Also the dictionary every
 * other locale falls back to, so it is always bundled.
 */
export const DEFAULT_LOCALE = 'en-US';

const cache = new Map<string, Translations>();

/**
 * Human label for a locale code. The backend ships intl-resolved names for
 * every discovered language; this is the fallback for anything else.
 */
export function localeLabel(code: string): string {
    try {
        const display = new Intl.DisplayNames([code], { type: 'language' }).of(code);

        if (display) {
            return display.charAt(0).toUpperCase() + display.slice(1);
        }
    } catch {
        // Unsupported codes simply show the raw code below.
    }

    return code;
}

/**
 * Match an arbitrary locale-ish value ("fr-FR", "fr", "FR-fr") against the
 * available codes: exact first, then case-insensitive, then by the language
 * part alone so a "fr-CA" browser still lands on "fr-FR".
 */
export function matchLocale(value: string | null | undefined, codes: string[]): string | undefined {
    if (typeof value !== 'string' || value.length === 0) {
        return undefined;
    }

    if (codes.includes(value)) {
        return value;
    }

    const lower = value.toLowerCase();
    const exact = codes.find((code) => code.toLowerCase() === lower);

    if (exact) {
        return exact;
    }

    const language = lower.split('-')[0];

    return codes.find((code) => code.toLowerCase().split('-')[0] === language);
}

const dateFnsLocales: Record<string, Locale> = {
    de: de,
    'de-de': de,
    en: enUS,
    'en-gb': enGB,
    'en-us': enUS,
    es: es,
    'es-es': es,
    fr: fr,
    'fr-fr': fr,
    it: it,
    ja: ja,
    ko: ko,
    nl: nl,
    pl: pl,
    pt: pt,
    'pt-br': ptBR,
    ru: ru,
    tr: tr,
    uk: uk,
    'zh-cn': zhCN,
    'zh-tw': zhTW,
};

/**
 * Best-effort date-fns locale lookup based on the language part of the code.
 * Unknown languages still get translated panel copy, only dates stay English.
 */
export function getDateFnsLocale(code: string): Locale {
    const lower = code.toLowerCase();
    const language = lower.split('-')[0] ?? lower;

    return dateFnsLocales[lower] ?? dateFnsLocales[language] ?? enUS;
}

/** cronstrue ships per-language bundles keyed by the language part ("es"). */
export function getCronstrueLocale(code: string): string {
    return (code.split('-')[0] ?? code).toLowerCase();
}

/**
 * Load a locale dictionary merged over the canonical English dictionary, so
 * partially translated locales fall back per key instead of rendering blanks.
 *
 * Dictionaries are served straight from `resources/lang` by the panel (see
 * `LocaleDictionaryController`), so a translated folder dropped on the server
 * shows up on the next page load without rebuilding the frontend.
 */
export async function loadLocale(code: string): Promise<Translations> {
    if (code === DEFAULT_LOCALE) {
        return enUSDictionary;
    }

    const cached = cache.get(code);

    if (cached) {
        return cached;
    }

    try {
        const response = await fetch(`/locales/${encodeURIComponent(code)}/ui.json`, {
            headers: { Accept: 'application/json' },
        });

        if (!response.ok) {
            return enUSDictionary;
        }

        const overrides = (await response.json()) as DeepPartial<Translations>;
        const translations = deepmerge(enUSDictionary, overrides) as Translations;

        cache.set(code, translations);

        return translations;
    } catch {
        return enUSDictionary;
    }
}
