import type { TranslationParams } from '@/i18n/types';

const PLACEHOLDER = /\{\{\s*([\w.]+)\s*\}\}/g;

/**
 * Replace `{{name}}` placeholders with the matching parameter. Unknown
 * placeholders are left untouched so a translation never renders an empty hole.
 */
export function interpolate(template: string, params?: TranslationParams): string {
    if (!params) {
        return template;
    }

    return template.replace(PLACEHOLDER, (placeholder, key: string) => {
        const value = params[key];

        return value === undefined || value === null ? placeholder : String(value);
    });
}
