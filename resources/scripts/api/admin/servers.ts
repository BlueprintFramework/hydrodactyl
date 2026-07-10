import http, {
    type FractalResponseData,
    getPaginationSet,
    type PaginatedResult,
    type QueryBuilderParams,
    withQueryBuilderParams,
} from '@/api/http';

export interface AdminServer {
    id: number;
    uuid: string;
    shortUuid: string;
    name: string;
    description: string;
    node: number;
    nodeName?: string;
    egg: number;
    eggName?: string;
    user: number;
    userName?: string;
    memory: number;
    swap: number;
    disk: number;
    cpu: number;
    io: number;
    threads: string | null;
    databases: number;
    backups: number;
    allocations: number;
    status: string | null;
    suspended: boolean;
    installed: boolean;
    createdAt: string;
    updatedAt: string;
}

const rawToServer = (data: FractalResponseData): AdminServer => {
    const attrs = data.attributes;
    return {
        id: attrs.id as number,
        uuid: attrs.uuid as string,
        shortUuid: attrs.short_uuid as string,
        name: attrs.name as string,
        description: (attrs.description as string) || '',
        node: attrs.node as number,
        egg: attrs.egg as number,
        user: attrs.user as number,
        memory: (attrs.limits?.memory as number) || 0,
        swap: (attrs.limits?.swap as number) || 0,
        disk: (attrs.limits?.disk as number) || 0,
        cpu: (attrs.limits?.cpu as number) || 0,
        io: (attrs.limits?.io as number) || 500,
        threads: (attrs.limits?.threads as string) || null,
        databases: attrs.relationships?.databases?.data?.length || 0,
        backups: attrs.relationships?.backups?.data?.length || 0,
        allocations: attrs.relationships?.allocations?.data?.length || 0,
        status: attrs.status as string | null,
        suspended: attrs.suspended as boolean,
        installed: attrs.installed as boolean,
        createdAt: attrs.created_at as string,
        updatedAt: attrs.updated_at as string,
    };
};

export const getServers = (params?: QueryBuilderParams): Promise<PaginatedResult<AdminServer>> =>
    new Promise((resolve, reject) => {
        http.get('/api/application/servers', {
            params: withQueryBuilderParams(params),
        })
            .then(({ data }) =>
                resolve({
                    items: (data.data || []).map(rawToServer),
                    pagination: getPaginationSet(data.meta.pagination),
                }),
            )
            .catch(reject);
    });

export const getServer = (id: number): Promise<AdminServer> =>
    new Promise((resolve, reject) => {
        http.get(`/api/application/servers/${id}`)
            .then(({ data }) => resolve(rawToServer(data)))
            .catch(reject);
    });

export const deleteServer = (id: number): Promise<void> => http.delete(`/api/application/servers/${id}`);

export const suspendServer = (id: number): Promise<void> => http.post(`/api/application/servers/${id}/suspend`);

export const unsuspendServer = (id: number): Promise<void> => http.post(`/api/application/servers/${id}/unsuspend`);

export const reinstallServer = (id: number): Promise<void> => http.post(`/api/application/servers/${id}/reinstall`);

export interface ServerDetails {
    id: number;
    uuid: string;
    name: string;
    description: string;
    userId: number;
    nodeId: number;
    eggId: number;
    nestId: number;
    allocationId: number;
    image: string;
    createdAt: string;
    updatedAt: string;
    user?: { id: number; username: string; email: string };
    node?: { id: number; name: string };
    egg?: { id: number; name: string };
    allocatons?: { id: number; ip: string; port: number }[];
}

const rawToServerDetails = (data: FractalResponseData): ServerDetails => {
    const attrs = data.attributes;
    return {
        id: attrs.id as number,
        uuid: attrs.uuid as string,
        name: attrs.name as string,
        description: (attrs.description as string) || '',
        userId: attrs.user as number,
        nodeId: attrs.node as number,
        eggId: attrs.egg as number,
        nestId: attrs.nest as number,
        allocationId: attrs.allocation as number,
        image: (attrs.docker_image as string) || '',
        createdAt: attrs.created_at as string,
        updatedAt: attrs.updated_at as string,
        user: attrs.relationships?.user as ServerDetails['user'],
        node: attrs.relationships?.node as ServerDetails['node'],
        egg: attrs.relationships?.egg as ServerDetails['egg'],
    };
};

export const getServerDetails = (id: number): Promise<ServerDetails> =>
    new Promise((resolve, reject) => {
        http.get(`/api/application/servers/${id}`)
            .then(({ data }) => resolve(rawToServerDetails(data)))
            .catch(reject);
    });

export interface UpdateServerDetailsData {
    name?: string;
    description?: string;
    user?: number;
    allocation_id?: number;
    docker_image?: string;
    startup?: string;
    environment?: Record<string, string>;
    egg_id?: number;
    swap?: number;
    io?: number;
    threads?: string | null;
    oom_kill?: boolean;
    databases?: number;
    backups?: number;
}

export const updateServerDetails = (id: number, data: UpdateServerDetailsData): Promise<void> =>
    http.patch(`/api/application/servers/${id}/details`, data);

export interface UpdateServerBuildData {
    memory?: number;
    swap?: number;
    disk?: number;
    io?: number;
    cpu?: number;
    threads?: string | null;
    oom_kill?: boolean;
}

export const updateServerBuild = (id: number, data: UpdateServerBuildData): Promise<void> =>
    http.patch(`/api/application/servers/${id}/build`, data);

export interface UpdateServerStartupData {
    startup?: string | null;
    env?: Record<string, string>;
    image?: string;
    egg_id?: number;
}

export const updateServerStartup = (id: number, data: UpdateServerStartupData): Promise<void> =>
    http.patch(`/api/application/servers/${id}/startup`, data);

export interface ServerDatabase {
    id: number;
    serverId: number;
    hostId: number;
    database: string;
    username: string;
    createdAt: string;
    updatedAt: string;
}

const rawToServerDatabase = (data: FractalResponseData): ServerDatabase => {
    const attrs = data.attributes;
    return {
        id: attrs.id as number,
        serverId: attrs.server_id as number,
        hostId: attrs.host_id as number,
        database: attrs.database as string,
        username: attrs.username as string,
        createdAt: attrs.created_at as string,
        updatedAt: attrs.updated_at as string,
    };
};

export const getServerDatabases = (id: number): Promise<ServerDatabase[]> =>
    new Promise((resolve, reject) => {
        http.get(`/api/application/servers/${id}/databases`)
            .then(({ data }) => resolve((data.data || []).map(rawToServerDatabase)))
            .catch(reject);
    });

export interface CreateServerDatabaseData {
    database_host_id: number;
    database?: string;
    username?: string;
}

export const createServerDatabase = (id: number, data: CreateServerDatabaseData): Promise<ServerDatabase> =>
    new Promise((resolve, reject) => {
        http.post(`/api/application/servers/${id}/databases`, data)
            .then(({ data: resp }) => resolve(rawToServerDatabase(resp)))
            .catch(reject);
    });

export const deleteServerDatabase = (id: number, databaseId: number): Promise<void> =>
    http.delete(`/api/application/servers/${id}/databases/${databaseId}`);

export interface CreateServerData {
    name: string;
    user: number;
    egg: number;
    docker_image?: string;
    startup_command?: string;
    environment?: Record<string, string>;
    allocation_id?: number;
    allocation_ids?: number[];
    memory?: number;
    swap?: number;
    disk?: number;
    io?: number;
    cpu?: number;
    threads?: string | null;
    feature_limits?: {
        databases?: number;
        allocations?: number;
        backups?: number;
    };
    skip_scripts?: boolean;
    start_on_completion?: boolean;
}

export const createServer = (data: CreateServerData): Promise<AdminServer> =>
    new Promise((resolve, reject) => {
        http.post('/api/application/servers', data)
            .then(({ data: resp }) => resolve(rawToServer(resp)))
            .catch(reject);
    });
