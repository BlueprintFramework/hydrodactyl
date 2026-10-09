import useSWR from 'swr';
import { getLanguages } from '@/api/admin/users';

export const useLanguages = () =>
    useSWR('admin:user-languages', getLanguages, {
        revalidateOnFocus: false,
        revalidateIfStale: false,
    });
