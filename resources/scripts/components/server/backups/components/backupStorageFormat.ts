// The API's *_mb values are calculated by dividing byte counts by 1024², so
// they are mebibytes (MiB), despite the legacy field names.
export const formatBackupStorage = (mebibytes: number | undefined | null, decimals = 1, locale = 'en-US'): string => {
    if (mebibytes === null || mebibytes === undefined) {
        return '0 MiB';
    }

    const format = (value: number) =>
        new Intl.NumberFormat(locale, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
            useGrouping: false,
        }).format(value);

    if (mebibytes >= 1024) {
        return `${format(mebibytes / 1024)} GiB`;
    }

    return `${format(mebibytes)} MiB`;
};
