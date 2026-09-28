const _CONVERSION_UNIT = 1024;

/**
 * Given a value in megabytes converts it back down into bytes.
 */
function mbToBytes(megabytes: number): number {
    return Math.floor(megabytes * _CONVERSION_UNIT * _CONVERSION_UNIT);
}

/**
 * Format a number for display using the given locale. Grouping separators are
 * disabled so byte counts and compact counters keep their current shape and
 * only the decimal separator follows the locale.
 */
function formatNumber(value: number, locale = 'en-US', options: Intl.NumberFormatOptions = {}): string {
    return new Intl.NumberFormat(locale, { useGrouping: false, ...options }).format(value);
}

/**
 * Given an amount of bytes, converts them into a human readable string format
 * using "1024" as the divisor.
 */
function bytesToString(bytes: number, decimals = 2, locale = 'en-US'): string {
    const k = _CONVERSION_UNIT;

    if (bytes < 1) return '0 Bytes';

    decimals = Math.floor(Math.max(0, decimals));
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const value = formatNumber(bytes / k ** i, locale, { maximumFractionDigits: decimals });

    return `${value} ${['Bytes', 'KiB', 'MiB', 'GiB', 'TiB'][i]}`;
}

/**
 * Formats an IPv4 or IPv6 address.
 */
function ip(value: string): string {
    // noinspection RegExpSimplifiable
    return /([a-f0-9:]+:+)+[a-f0-9]+/.test(value) ? `[${value}]` : value;
}

export { bytesToString, formatNumber, ip, mbToBytes };
