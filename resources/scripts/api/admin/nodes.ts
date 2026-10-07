import http, { getPaginationSet, type PaginatedResult } from '@/api/http';

export interface NodeLocation {
    id: number;
    short: string;
    long: string | null;
}

export interface AdminNode {
    id: number;
    uuid: string;
    name: string;
    description: string | null;
    location_id: number;
    location: NodeLocation | null;
    fqdn: string;
    internal_fqdn: string | null;
    scheme: string;
    behind_proxy: boolean;
    public: boolean;
    trust_alias: boolean;
    maintenance_mode: boolean;
    memory: number;
    memory_overallocate: number;
    disk: number;
    disk_overallocate: number;
    upload_size: number;
    daemonListen: number;
    daemonSFTP: number;
    daemonBase: string;
    daemonType: string;
    backupDisk: string;
    bucket: number | null;
    servers_count: number;
    allocated_memory: number;
    total_memory: number;
    memory_percent: number;
    allocated_disk: number;
    total_disk: number;
    disk_percent: number;
}

export interface NodeOptions {
    locations: NodeLocation[];
    daemonTypes: string[];
    backupDisks: Record<string, string[]>;
    s3Buckets: { id: number; name: string; bucket_name: string }[];
    s3Required: string[];
}

export interface NodeValues {
    name: string;
    description: string;
    location_id: string;
    daemonType: string;
    public: boolean;
    trust_alias: boolean;
    fqdn: string;
    internal_fqdn: string;
    scheme: string;
    behind_proxy: boolean;
    maintenance_mode: boolean;
    memory: string;
    memory_overallocate: string;
    disk: string;
    disk_overallocate: string;
    upload_size: string;
    daemonListen: string;
    daemonSFTP: string;
    backupDisk: string;
    bucket: string;
}

export const getNodes = (query: { page?: number; search?: string } = {}): Promise<PaginatedResult<AdminNode>> => {
    const params: Record<string, unknown> = {};
    if (query.page) params.page = query.page;
    if (query.search) params['filter[name]'] = query.search;

    return http.get('/admin/api/nodes', { params }).then(({ data }) => ({
        items: data.data,
        pagination: getPaginationSet(data.meta.pagination),
    }));
};

export const getNode = (id: number | string): Promise<AdminNode> =>
    http.get(`/admin/api/nodes/${id}`).then(({ data }) => data.data);

export interface NodeStatus {
    up: boolean;
    version: string | null;
    error: string | null;
}

export const getNodeStatus = (id: number | string): Promise<NodeStatus> =>
    http.get(`/admin/api/nodes/${id}/status`).then(({ data }) => data.data);

export const getNodeOptions = (): Promise<NodeOptions> => http.get('/admin/api/nodes/options').then(({ data }) => data);

export const createNode = (values: NodeValues & { reset_secret?: boolean }): Promise<AdminNode> =>
    http.post('/admin/api/nodes', values).then(({ data }) => data.data);

export const updateNode = (id: number | string, values: NodeValues & { reset_secret?: boolean }): Promise<AdminNode> =>
    http.patch(`/admin/api/nodes/${id}`, values).then(({ data }) => data.data);

export const deleteNode = (id: number | string): Promise<void> =>
    http.delete(`/admin/api/nodes/${id}`).then(() => undefined);

export interface NodeConfiguration {
    yaml: string;
    auto_deploy: string;
}

export interface NodeAllocation {
    id: number;
    ip: string;
    ip_alias: string | null;
    port: number;
    server_id: number | null;
    server: { id: number; name: string } | null;
}

export interface NodeAllocations extends PaginatedResult<NodeAllocation> {
    ips: string[];
}

export interface NodeServer {
    id: number;
    uuid: string;
    uuidShort: string;
    name: string;
    owner: { id: number; username: string; email: string } | null;
    nest: string | null;
    egg: string | null;
}

export interface AllocationValues {
    allocation_ip: string;
    allocation_alias: string;
    allocation_ports: string[];
}

export const getNodeConfiguration = (id: number | string): Promise<NodeConfiguration> =>
    http.get(`/admin/api/nodes/${id}/configuration`).then(({ data }) => data);

export const createDeployToken = (id: number | string): Promise<string> =>
    http.post(`/admin/api/nodes/${id}/configuration/token`).then(({ data }) => data.token);

export const getNodeAllocations = (id: number | string, page = 1): Promise<NodeAllocations> =>
    http.get(`/admin/api/nodes/${id}/allocations`, { params: { page } }).then(({ data }) => ({
        items: data.data,
        ips: data.ips,
        pagination: getPaginationSet(data.meta.pagination),
    }));

export const createNodeAllocations = (id: number | string, values: AllocationValues): Promise<void> =>
    http.post(`/admin/api/nodes/${id}/allocations`, values).then(() => undefined);

export const setAllocationAlias = (id: number | string, allocationId: number, alias: string): Promise<void> =>
    http.patch(`/admin/api/nodes/${id}/allocations/${allocationId}`, { alias }).then(() => undefined);

export const updateAllocationAliases = (id: number | string, ip: string | null, alias: string): Promise<number> =>
    http.post(`/admin/api/nodes/${id}/allocations/alias`, { ip, alias }).then(({ data }) => data.updated);

export const deleteAllocation = (id: number | string, allocationId: number): Promise<void> =>
    http.delete(`/admin/api/nodes/${id}/allocations/${allocationId}`).then(() => undefined);

export const deleteAllocations = (id: number | string, allocationIds: number[]): Promise<void> =>
    http
        .delete(`/admin/api/nodes/${id}/allocations`, {
            data: { allocations: allocationIds.map((allocationId) => ({ id: allocationId })) },
        })
        .then(() => undefined);

export const deleteAllocationBlock = (id: number | string, ip: string): Promise<void> =>
    http.post(`/admin/api/nodes/${id}/allocations/remove-block`, { ip }).then(() => undefined);

export const getNodeServers = (id: number | string, page = 1): Promise<PaginatedResult<NodeServer>> =>
    http.get(`/admin/api/nodes/${id}/servers`, { params: { page } }).then(({ data }) => ({
        items: data.data,
        pagination: getPaginationSet(data.meta.pagination),
    }));
