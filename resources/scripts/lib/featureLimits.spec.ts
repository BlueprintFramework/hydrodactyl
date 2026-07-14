import { isFeatureLimitEnabled, isNetworkFeatureEnabled } from '@/lib/featureLimits';

describe('@/lib/featureLimits.ts', () => {
    describe('isFeatureLimitEnabled()', () => {
        it('treats a null limit as unlimited', () => {
            expect(isFeatureLimitEnabled(null)).toBe(true);
        });

        it('only enables finite limits greater than zero', () => {
            expect(isFeatureLimitEnabled(10)).toBe(true);
            expect(isFeatureLimitEnabled(0)).toBe(false);
            expect(isFeatureLimitEnabled(undefined)).toBe(false);
        });
    });

    describe('isNetworkFeatureEnabled()', () => {
        it('enables networking for unlimited allocations', () => {
            expect(isNetworkFeatureEnabled(null, false)).toBe(true);
        });

        it('enables networking when subdomains are supported without allocations', () => {
            expect(isNetworkFeatureEnabled(0, true)).toBe(true);
        });

        it('disables networking when neither feature is available', () => {
            expect(isNetworkFeatureEnabled(0, false)).toBe(false);
        });
    });
});
