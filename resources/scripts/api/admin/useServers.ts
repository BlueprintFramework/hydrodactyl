import useSWR from 'swr';
import { getServer, getServerManage, getServers } from '@/api/admin/servers';

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
