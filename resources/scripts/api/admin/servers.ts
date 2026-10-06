import http, { getPaginationSet, type PaginatedResult } from '@/api/http';

export interface AdminServerOwner {
    id: number;
    username: string;
    email: string;
    name_first: string | null;
    name_last: string | null;
}

export interface AdminServer {
    id: number;
    uuid: string;
    uuid_short: string;
    name: string;
    description: string | null;
    external_id: string | null;
    status: string | null;
    is_installed: boolean;
    is_suspended: boolean;
    exclude_from_resource_calculation: boolean;
    owner: AdminServerOwner | null;
    node: { id: number; name: string } | null;
    nest: { id: number; name: string } | null;
    egg: { id: number; name: string } | null;
    allocation: { id: number; ip: string; port: number; alias: string } | null;
    cpu: number;
    threads: string | null;
    memory: number;
    swap: number;
    disk: number;
    io: number;
    database_limit: number;
    allocation_limit: number;
    backup_limit: number;
    oom_disabled: boolean;
    docker_image: string;
    startup: string;
}

export interface ServerManageData {
    can_transfer: boolean;
    transfer: { created_at: string } | null;
    locations: {
        id: number;
        short: string;
        long: string | null;
        nodes: { id: number; name: string }[];
    }[];
}

export interface TransferAllocation {
    id: number;
    ip: string;
    port: number;
    alias: string;
}

export interface UserSearchResult {
    id: number;
    email: string;
    username: string;
    name_first: string | null;
    name_last: string | null;
    md5: string;
}

export const getServers = (query: { page?: number; search?: string } = {}): Promise<PaginatedResult<AdminServer>> => {
    const params: Record<string, unknown> = {};
    if (query.page) params.page = query.page;
    if (query.search) params['filter[*]'] = query.search;

    return http.get('/admin/api/servers', { params }).then(({ data }) => ({
        items: data.data,
        pagination: getPaginationSet(data.meta.pagination),
    }));
};

export const getServer = (id: number | string): Promise<AdminServer> =>
    http.get(`/admin/api/servers/${id}`).then(({ data }) => data.data);

export const updateServerDetails = (
    id: number | string,
    values: { name: string; external_id: string; owner_id: number; description: string },
): Promise<AdminServer> => http.patch(`/admin/api/servers/${id}/details`, values).then(({ data }) => data.data);

export const getServerManage = (id: number | string): Promise<ServerManageData> =>
    http.get(`/admin/api/servers/${id}/manage`).then(({ data }) => data);

export const getTransferAllocations = (id: number | string, nodeId: number): Promise<TransferAllocation[]> =>
    http
        .get(`/admin/api/servers/${id}/transfer/allocations`, { params: { node_id: nodeId } })
        .then(({ data }) => data.data);

export const toggleServerInstall = (id: number | string): Promise<AdminServer> =>
    http.post(`/admin/api/servers/${id}/manage/toggle`).then(({ data }) => data.data);

export const setServerSuspension = (id: number | string, action: 'suspend' | 'unsuspend'): Promise<AdminServer> =>
    http.post(`/admin/api/servers/${id}/manage/suspension`, { action }).then(({ data }) => data.data);

export const reinstallServer = (id: number | string): Promise<AdminServer> =>
    http.post(`/admin/api/servers/${id}/manage/reinstall`).then(({ data }) => data.data);

export const transferServer = (
    id: number | string,
    values: { node_id: number; allocation_id: number; allocation_additional: number[] },
): Promise<AdminServer> => http.post(`/admin/api/servers/${id}/manage/transfer`, values).then(({ data }) => data.data);

export const deleteServer = (id: number | string, force = false): Promise<void> =>
    http.delete(`/admin/api/servers/${id}`, { data: { force_delete: force } }).then(() => undefined);

export const searchUsers = (term: string): Promise<UserSearchResult[]> =>
    http.get('/admin/users/accounts.json', { params: { 'filter[email]': term, page: 1 } }).then(({ data }) => data);

export interface ServerAllocationOption {
    id: number;
    ip: string;
    port: number;
    alias: string;
}

export interface ServerBuildData {
    cpu: number;
    threads: string | null;
    memory: number;
    overhead_memory: number;
    swap: number;
    disk: number;
    io: number;
    oom_disabled: boolean;
    exclude_from_resource_calculation: boolean;
    database_limit: number | null;
    allocation_limit: number | null;
    backup_limit: number | null;
    backup_storage_limit: number | null;
    allocation_id: number;
}

export interface ServerBuildResponse {
    data: ServerBuildData;
    assigned: ServerAllocationOption[];
    unassigned: ServerAllocationOption[];
}

export interface ServerBuildValues {
    allocation_id: number;
    add_allocations: number[];
    remove_allocations: number[];
    cpu: string;
    threads: string;
    memory: string;
    overhead_memory: string;
    swap: string;
    disk: string;
    io: string;
    database_limit: string;
    allocation_limit: string;
    backup_limit: string;
    backup_storage_limit: string;
    oom_disabled: boolean;
    exclude_from_resource_calculation: boolean;
}

export const getServerBuild = (id: number | string): Promise<ServerBuildResponse> =>
    http.get(`/admin/api/servers/${id}/build`).then(({ data }) => data);

export const updateServerBuild = (id: number | string, values: ServerBuildValues): Promise<AdminServer> =>
    http.patch(`/admin/api/servers/${id}/build`, values).then(({ data }) => data.data);
