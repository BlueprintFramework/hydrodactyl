import useSWR from 'swr';
import { getVersionCheck, type VersionCheck } from '@/api/admin/version';

/**
 * The panel's up-to-date status. The backend caches the CDN response for an
 * hour, so the client can cache it for about as long.
 */
export const useVersionCheck = () =>
    useSWR<VersionCheck>('admin:version-check', getVersionCheck, {
        revalidateOnFocus: false,
        revalidateIfStale: false,
        refreshInterval: 3600000,
    });
