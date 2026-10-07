import useSWR from 'swr';
import { getLogo } from '@/api/admin/logo';

export const useLogo = () =>
    useSWR('admin:settings:logo', getLogo, {
        revalidateOnFocus: false,
    });
