import useSWR from 'swr';
import { getSettings } from '@/api/admin/settings';

export const useSettings = () =>
    useSWR('admin:settings', getSettings, {
        revalidateOnFocus: false,
    });
