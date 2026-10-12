import useSWR from 'swr';
import { getDatabaseHost, getDatabaseHostOptions, getDatabaseHosts } from '@/api/admin/databaseHosts';

export const useDatabaseHosts = () =>
    useSWR('admin:database-hosts', getDatabaseHosts, {
        revalidateOnFocus: false,
    });

export const useDatabaseHost = (id?: number | string, page = 1) =>
    useSWR(id ? ['admin:database-host', id, page] : null, () => getDatabaseHost(id as number | string, page), {
        revalidateOnFocus: false,
        keepPreviousData: true,
    });

export const useDatabaseHostOptions = () =>
    useSWR('admin:database-host-options', getDatabaseHostOptions, {
        revalidateOnFocus: false,
        revalidateIfStale: false,
    });
