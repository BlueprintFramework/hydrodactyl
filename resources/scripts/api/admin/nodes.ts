import http, {
    type FractalResponseData,
    getPaginationSet,
    type PaginatedResult,
    type QueryBuilderParams,
    withQueryBuilderParams,
} from '@/api/http';

export interface AdminNode {
    id: number;
    uuid: string;
    name: string;
    description: string;
    locationId: number;
    locationName?: string;
    public: boolean;
    fqdn: string;
    scheme: string;
    behindProxy: boolean;
    maintenanceMode: boolean;
    memory: number;
    memoryOverallocate: number;
    disk: number;
    diskOverallocate: number;
    daemonBase: string;
    daemonListen: number;
    daemonSftp: number;
    serversCount: number;
    createdAt: string;
    updatedAt: string;
}

const rawToNode = (data: FractalResponseData): AdminNode => {
    const attrs = data.attributes;
    return {
        id: attrs.id as number,
        uuid: attrs.uuid as string,
        name: attrs.name as string,
        description: (attrs.description as string) || '',
        locationId: attrs.location_id as number,
        public: attrs.public as boolean,
        fqdn: attrs.fqdn as string,
        scheme: attrs.scheme as string,
        behindProxy: attrs.behind_proxy as boolean,
        maintenanceMode: attrs.maintenance_mode as boolean,
        memory: attrs.memory as number,
        memoryOverallocate: attrs.memory_overallocate as number,
        disk: attrs.disk as number,
        diskOverallocate: attrs.disk_overallocate as number,
        daemonBase: attrs.daemon_base as string,
        daemonListen: attrs.daemon_listen as number,
        daemonSftp: attrs.daemon_sftp as number,
        serversCount: 0,
        createdAt: attrs.created_at as string,
        updatedAt: attrs.updated_at as string,
    };
};

export const getNodes = (params?: QueryBuilderParams): Promise<PaginatedResult<AdminNode>> =>
    new Promise((resolve, reject) => {
        http.get('/api/application/nodes', {
            params: withQueryBuilderParams(params),
        })
            .then(({ data }) =>
                resolve({
                    items: (data.data || []).map(rawToNode),
                    pagination: getPaginationSet(data.meta.pagination),
                }),
            )
            .catch(reject);
    });

export const getNode = (id: number): Promise<AdminNode> =>
    new Promise((resolve, reject) => {
        http.get(`/api/application/nodes/${id}`)
            .then(({ data }) => resolve(rawToNode(data)))
            .catch(reject);
    });

export const deleteNode = (id: number): Promise<void> => http.delete(`/api/application/nodes/${id}`);

export interface CreateNodeData {
    name: string;
    location_id: number;
    fqdn: string;
    scheme?: string;
    behind_proxy?: boolean;
    memory?: number;
    memory_overallocate?: number;
    disk?: number;
    disk_overallocate?: number;
    daemon_base?: string;
    daemon_listen?: number;
    daemon_sftp?: number;
    public?: boolean;
    description?: string;
}

export const createNode = (data: CreateNodeData): Promise<AdminNode> =>
    new Promise((resolve, reject) => {
        http.post('/api/application/nodes', data)
            .then(({ data: resp }) => resolve(rawToNode(resp)))
            .catch(reject);
    });

export interface UpdateNodeData extends Partial<CreateNodeData> {
    maintenance_mode?: boolean;
}

export const updateNode = (id: number, data: UpdateNodeData): Promise<AdminNode> =>
    new Promise((resolve, reject) => {
        http.patch(`/api/application/nodes/${id}`, data)
            .then(({ data: resp }) => resolve(rawToNode(resp)))
            .catch(reject);
    });

export interface AdminAllocation {
    id: number;
    nodeId: number;
    ip: string;
    port: number;
    alias: string | null;
    serverId: number | null;
    createdAt: string;
    updatedAt: string;
}

const rawToAllocation = (data: FractalResponseData): AdminAllocation => {
    const attrs = data.attributes;
    return {
        id: attrs.id as number,
        nodeId: attrs.node_id as number,
        ip: attrs.ip as string,
        port: attrs.port as number,
        alias: (attrs.alias as string) || null,
        serverId: (attrs.server_id as number) || null,
        createdAt: attrs.created_at as string,
        updatedAt: attrs.updated_at as string,
    };
};

export const getNodeAllocations = (id: number): Promise<AdminAllocation[]> =>
    new Promise((resolve, reject) => {
        http.get(`/api/application/nodes/${id}/allocations`)
            .then(({ data }) => resolve((data.data || []).map(rawToAllocation)))
            .catch(reject);
    });

export interface CreateAllocationData {
    ip: string;
    port: number;
    alias?: string;
}

export const createAllocation = (nodeId: number, data: CreateAllocationData): Promise<AdminAllocation> =>
    new Promise((resolve, reject) => {
        http.post(`/api/application/nodes/${nodeId}/allocations`, data)
            .then(({ data: resp }) => resolve(rawToAllocation(resp)))
            .catch(reject);
    });

export const deleteAllocation = (nodeId: number, allocationId: number): Promise<void> =>
    http.delete(`/api/application/nodes/${nodeId}/allocations/${allocationId}`);

export const setAllocationAlias = (nodeId: number, allocationId: number, alias: string): Promise<void> =>
    http.put(`/api/application/nodes/${nodeId}/allocations/${allocationId}`, { alias });

export const removeAllocationBlock = (nodeId: number, allocationId: number): Promise<void> =>
    http.post(`/api/application/nodes/${nodeId}/allocations/${allocationId}/block`);

export interface NodeConfiguration {
    uuid: string;
    daemonToken: string;
    daemonBase: string;
    config: Record<string, unknown>;
}

export const getNodeConfiguration = (id: number): Promise<NodeConfiguration> =>
    http.get(`/api/application/nodes/${id}/configuration`).then(({ data }) => data);

export interface DeployableNode {
    id: number;
    name: string;
    fqdn: string;
    memory: number;
    disk: number;
    locations: { id: number; short: string; long: string }[];
}

export const getDeployableNodes = (eggId?: number): Promise<DeployableNode[]> =>
    new Promise((resolve, reject) => {
        http.get('/api/application/nodes/deployable', { params: eggId ? { egg_id: eggId } : undefined })
            .then(({ data }) => resolve(data.data || []))
            .catch(reject);
    });
