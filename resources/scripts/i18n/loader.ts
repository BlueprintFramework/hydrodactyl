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
import type { DeepPartial, LocaleDefinition, Translations } from '@/i18n/types';

/**
 * Locale used when nothing else has a preference. Also the dictionary every
 * other locale falls back to, so it is always bundled.
 */
export const DEFAULT_LOCALE = 'en-US';

interface LocaleModule {
    default: DeepPartial<Translations>;
}

/**
 * Every `ui.json` dictionary inside a locale folder is discovered
 * automatically by Vite, so adding a language is just a matter of copying
 * `resources/lang/en-US` to `resources/lang/<code>` and translating it. The
 * backend scans the same folders for its PHP dictionaries.
 *
 * The canonical locale is excluded from the glob (keep both constants in
 * sync!) because it is imported statically above; that keeps its dictionary
 * from being shipped twice.
 */
const discovered = import.meta.glob<LocaleModule>(['/resources/lang/*/ui.json', '!/resources/lang/en-US/ui.json']);

const codeFromPath = (path: string): string => path.replace(/^\/resources\/lang\//, '').replace(/\/ui\.json$/, '');

export const loaders: Record<string, () => Promise<LocaleModule>> = Object.fromEntries(
    Object.entries(discovered).map(([path, loader]) => [codeFromPath(path), loader]),
);

export const localeCodes: string[] = [DEFAULT_LOCALE, ...Object.keys(loaders)].sort((a, b) => a.localeCompare(b));

function localeLabel(code: string): string {
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

export const localeDefinitions: LocaleDefinition[] = localeCodes.map((code) => ({ code, label: localeLabel(code) }));

export function isLocaleCode(value: unknown): boolean {
    return typeof value === 'string' && localeCodes.includes(value);
}

/**
 * Match an arbitrary locale-ish value ("fr-FR", "fr", "FR-fr") against the
 * discovered dictionaries: exact first, then case-insensitive, then by the
 * language part alone so a "fr-CA" browser still lands on "fr-FR".
 */
export function matchLocale(value: string | null | undefined): string | undefined {
    if (typeof value !== 'string' || value.length === 0) {
        return undefined;
    }

    if (isLocaleCode(value)) {
        return value;
    }

    const lower = value.toLowerCase();
    const exact = localeCodes.find((code) => code.toLowerCase() === lower);

    if (exact) {
        return exact;
    }

    const language = lower.split('-')[0];

    return localeCodes.find((code) => code.toLowerCase().split('-')[0] === language);
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
 */
export async function loadLocale(code: string): Promise<Translations> {
    const loader = loaders[code];

    if (code === DEFAULT_LOCALE || !loader) {
        return enUSDictionary;
    }

    const overrides = await loader();

    return deepmerge(enUSDictionary, overrides.default) as Translations;
}
