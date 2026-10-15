import useSWR from 'swr';
import {
    getNode,
    getNodeAllocations,
    getNodeConfiguration,
    getNodeOptions,
    getNodeServers,
    getNodeStatus,
    getNodes,
} from '@/api/admin/nodes';

export const useNodes = (query: { page?: number; search?: string }) =>
    useSWR(['admin:nodes', query], () => getNodes(query), {
        revalidateOnFocus: false,
        keepPreviousData: true,
    });

export const useNode = (id?: number | string) =>
    useSWR(id ? ['admin:node', id] : null, () => getNode(id as number | string), {
        revalidateOnFocus: false,
    });

export const useNodeStatus = (id?: number | string) =>
    useSWR(id ? ['admin:node-status', id] : null, () => getNodeStatus(id as number | string), {
        revalidateOnFocus: false,
        refreshInterval: 15000,
    });

export const useNodeOptions = () =>
    useSWR('admin:node-options', getNodeOptions, {
        revalidateOnFocus: false,
        revalidateIfStale: false,
    });

export const useNodeConfiguration = (id?: number | string) =>
    useSWR(id ? ['admin:node-configuration', id] : null, () => getNodeConfiguration(id as number | string), {
        revalidateOnFocus: false,
        revalidateIfStale: false,
    });

export const useNodeAllocations = (id?: number | string, page = 1) =>
    useSWR(id ? ['admin:node-allocations', id, page] : null, () => getNodeAllocations(id as number | string, page), {
        revalidateOnFocus: false,
        keepPreviousData: true,
    });

export const useNodeServers = (id?: number | string, page = 1) =>
    useSWR(id ? ['admin:node-servers', id, page] : null, () => getNodeServers(id as number | string, page), {
        revalidateOnFocus: false,
        keepPreviousData: true,
    });
