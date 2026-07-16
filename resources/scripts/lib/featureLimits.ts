export type FeatureLimit = number | null | undefined;

export const isFeatureLimitEnabled = (limit: FeatureLimit): boolean => limit === null || (limit ?? 0) > 0;

export const isNetworkFeatureEnabled = (allocationLimit: FeatureLimit, subdomainSupported: boolean): boolean =>
    isFeatureLimitEnabled(allocationLimit) || subdomainSupported;
