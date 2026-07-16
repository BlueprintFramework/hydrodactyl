// The API's *_mb values are calculated by dividing byte counts by 1024², so
// they are mebibytes (MiB), despite the legacy field names.
export const formatBackupStorage = (mebibytes: number | undefined | null, decimals = 1): string => {
    if (mebibytes === null || mebibytes === undefined) {
        return '0 MiB';
    }

    if (mebibytes >= 1024) {
        return `${(mebibytes / 1024).toFixed(decimals)} GiB`;
    }

    return `${mebibytes.toFixed(decimals)} MiB`;
};
