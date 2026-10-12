import useSWR from 'swr';
import getSystemStatus, { type SystemStatus } from '@/api/admin/getSystemStatus';

export const useSystemStatus = () =>
    useSWR<SystemStatus>('admin:system-status', getSystemStatus, {
        refreshInterval: 30000,
        revalidateOnFocus: false,
    });
