import enUSDictionary from '@lang/en-US/ui.json';
import type { Locale } from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
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

/**
 * Every locale shipped with date-fns, resolved on demand. A language folder
 * dropped into `resources/lang` therefore localizes dates without any code
 * change, and the locale bundles are only downloaded when they are used.
 *
 * The CDN bundles (`locale/cdn.js`, `locale/cdn.min.js`) are explicitly
 * excluded: they are side-effectful polyfills that log a migration warning
 * when bundled and would otherwise run on every panel load.
 */
const dateFnsModules = import.meta.glob<{ default: Locale }>([
    '/node_modules/date-fns/locale/*.js',
    '!/node_modules/date-fns/locale/cdn*.js',
]);

const dateFnsCache = new Map<string, Locale>();

/**
 * Load the date-fns locale for a code, preferring the regional variant when
 * the package ships one ("pt-BR") and falling back to the bare language
 * ("es") or en-US. Unknown languages still get translated panel copy, only
 * dates stay English.
 */
export async function loadDateFnsLocale(code: string): Promise<Locale> {
    if (code === DEFAULT_LOCALE) {
        return enUS;
    }

    const cached = dateFnsCache.get(code);

    if (cached) {
        return cached;
    }

    const [language = '', region] = code.toLowerCase().split('-');
    const candidates = [region ? `${language}-${region.toUpperCase()}` : null, language];

    for (const candidate of candidates) {
        const loader = candidate ? dateFnsModules[`/node_modules/date-fns/locale/${candidate}.js`] : undefined;

        if (loader) {
            const { default: locale } = await loader();
            dateFnsCache.set(code, locale);

            return locale;
        }
    }

    dateFnsCache.set(code, enUS);

    return enUS;
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
