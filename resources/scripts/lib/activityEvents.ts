import type { Translate } from '@/i18n/types';

/**
 * Build the dictionary key used for the human readable label of an activity
 * event. Colons, dots and dashes are not valid dictionary key separators, so
 * they are normalized to underscores (e.g. "server:power.start" becomes
 * "activity.events.server_power_start").
 */
export const activityEventKey = (event: string): string => `activity.events.${event.replace(/[:.-]/g, '_')}`;

/**
 * Resolve the translated label for an activity event, falling back to the raw
 * event name when no label exists for it.
 */
export const activityEventLabel = (t: Translate, event: string): string => {
    const key = activityEventKey(event);
    const translated = t(key);

    return translated === key ? event : translated;
};
