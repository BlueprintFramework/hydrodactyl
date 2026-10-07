import useSWR from 'swr';
import { getMount, getMounts } from '@/api/admin/mounts';

export const useMounts = () =>
    useSWR('admin:mounts', getMounts, {
        revalidateOnFocus: false,
    });

export const useMount = (id?: number | string) =>
    useSWR(id ? ['admin:mount', id] : null, () => getMount(id as number | string), {
        revalidateOnFocus: false,
        revalidateIfStale: false,
    });
