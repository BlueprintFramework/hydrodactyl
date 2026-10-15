import useSWR from 'swr';
import { getApplicationApiKeys } from '@/api/admin/applicationApi';

export const useApplicationApiKeys = () =>
    useSWR('admin:application-keys', getApplicationApiKeys, {
        revalidateOnFocus: false,
        revalidateIfStale: false,
    });
