import useSWR from 'swr';
import {
    getServer,
    getServerBuild,
    getServerCreateOptions,
    getServerDatabases,
    getServerManage,
    getServerMounts,
    getServerStartup,
    getServers,
} from '@/api/admin/servers';

export const useServers = (query: { page?: number; search?: string }) =>
    useSWR(['admin:servers', query], () => getServers(query), {
        revalidateOnFocus: false,
        keepPreviousData: true,
    });

export const useServer = (id?: number | string) =>
    useSWR(id ? ['admin:server', id] : null, () => getServer(id as number | string), {
        revalidateOnFocus: false,
    });

export const useServerManage = (id?: number | string) =>
    useSWR(id ? ['admin:server-manage', id] : null, () => getServerManage(id as number | string), {
        revalidateOnFocus: false,
    });

export const useServerBuild = (id?: number | string) =>
    useSWR(id ? ['admin:server-build', id] : null, () => getServerBuild(id as number | string), {
        revalidateOnFocus: false,
        revalidateIfStale: false,
    });

export const useServerStartup = (id?: number | string) =>
    useSWR(id ? ['admin:server-startup', id] : null, () => getServerStartup(id as number | string), {
        revalidateOnFocus: false,
        revalidateIfStale: false,
    });

export const useServerDatabases = (id?: number | string) =>
    useSWR(id ? ['admin:server-databases', id] : null, () => getServerDatabases(id as number | string), {
        revalidateOnFocus: false,
        revalidateIfStale: false,
    });

export const useServerMounts = (id?: number | string) =>
    useSWR(id ? ['admin:server-mounts', id] : null, () => getServerMounts(id as number | string), {
        revalidateOnFocus: false,
        revalidateIfStale: false,
    });

export const useServerCreateOptions = () =>
    useSWR('admin:server-create-options', getServerCreateOptions, {
        revalidateOnFocus: false,
        revalidateIfStale: false,
    });
