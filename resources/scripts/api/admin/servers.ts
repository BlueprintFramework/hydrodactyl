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
    node_daemon_type: string | null;
    software_enabled: boolean;
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
    software_enabled: boolean;
}

export const getServerBuild = (id: number | string): Promise<ServerBuildResponse> =>
    http.get(`/admin/api/servers/${id}/build`).then(({ data }) => data);

export const updateServerBuild = (id: number | string, values: ServerBuildValues): Promise<AdminServer> =>
    http.patch(`/admin/api/servers/${id}/build`, values).then(({ data }) => data.data);

export interface EggVariableDef {
    env_variable: string;
    name: string;
    description: string;
    default_value: string;
    required: boolean;
    rules: string;
}

export interface EggSummary {
    id: number;
    name: string;
    startup: string | null;
    docker_images: Record<string, string>;
    variables: EggVariableDef[];
}

export interface NestSummary {
    id: number;
    name: string;
    eggs: EggSummary[];
}

export interface ServerStartupData {
    server: {
        startup: string;
        image: string;
        skip_scripts: boolean;
        nest_id: number;
        egg_id: number;
    };
    nests: NestSummary[];
    variables: Record<string, string | null>;
}

export interface ServerStartupValues {
    startup: string;
    nest_id: number;
    egg_id: number;
    skip_scripts: boolean;
    docker_image: string;
    environment: Record<string, string>;
}

export const getServerStartup = (id: number | string): Promise<ServerStartupData> =>
    http.get(`/admin/api/servers/${id}/startup`).then(({ data }) => data);

export const updateServerStartup = (id: number | string, values: ServerStartupValues): Promise<AdminServer> =>
    http.patch(`/admin/api/servers/${id}/startup`, values).then(({ data }) => data.data);

export interface DatabaseHostOption {
    id: number;
    name: string;
}

export interface ServerDatabase {
    id: number;
    database: string;
    username: string;
    remote: string;
    max_connections: number | null;
    host: { id: number; name: string; host: string; port: number } | null;
}

export interface ServerDatabasesResponse {
    data: ServerDatabase[];
    hosts: DatabaseHostOption[];
}

export interface ServerDatabaseValues {
    database: string;
    remote: string;
    max_connections: string;
    database_host_id: number;
}

export const getServerDatabases = (id: number | string): Promise<ServerDatabasesResponse> =>
    http.get(`/admin/api/servers/${id}/database`).then(({ data }) => data);

export const createServerDatabase = (id: number | string, values: ServerDatabaseValues): Promise<void> =>
    http.post(`/admin/api/servers/${id}/database`, values).then(() => undefined);

export const resetServerDatabasePassword = (id: number | string, databaseId: number): Promise<void> =>
    http.patch(`/admin/api/servers/${id}/database/${databaseId}`).then(() => undefined);

export const deleteServerDatabase = (id: number | string, databaseId: number): Promise<void> =>
    http.delete(`/admin/api/servers/${id}/database/${databaseId}`).then(() => undefined);

export interface ServerMount {
    id: number;
    name: string;
    source: string;
    target: string;
    is_mounted: boolean;
}

export const getServerMounts = (id: number | string): Promise<ServerMount[]> =>
    http.get(`/admin/api/servers/${id}/mounts`).then(({ data }) => data.data);

export const addServerMount = (id: number | string, mountId: number): Promise<void> =>
    http.post(`/admin/api/servers/${id}/mounts`, { mount_id: mountId }).then(() => undefined);

export const removeServerMount = (id: number | string, mountId: number): Promise<void> =>
    http.delete(`/admin/api/servers/${id}/mounts/${mountId}`).then(() => undefined);

export interface NodeOption {
    id: number;
    name: string;
    daemonType: string;
}

export interface LocationOption {
    id: number;
    short: string;
    long: string | null;
    nodes: NodeOption[];
}

export interface ServerTemplate {
    id: string;
    name: string;
    description: string | null;
    memory: number;
    overhead_memory: number;
    swap: number;
    disk: number;
    cpu: number;
    threads: string | null;
    io: number;
    database_limit: number;
    allocation_limit: number;
    backup_limit: number;
    backup_storage_limit: number;
    oom_disabled: boolean;
    exclude_from_resource_calculation: boolean;
    skip_scripts: boolean;
    start_on_completion: boolean;
}

export interface ServerCreateOptions {
    locations: LocationOption[];
    nests: NestSummary[];
    templates: ServerTemplate[];
}

export interface ServerCreateValues {
    name: string;
    owner_id: number;
    description: string;
    start_on_completion: boolean;
    node_id: number;
    allocation_id: number;
    allocation_additional: number[];
    database_limit: string;
    allocation_limit: string;
    backup_limit: string;
    backup_storage_limit: string;
    cpu: string;
    threads: string;
    memory: string;
    overhead_memory: string;
    swap: string;
    disk: string;
    io: string;
    oom_disabled: boolean;
    exclude_from_resource_calculation: boolean;
    nest_id: number;
    egg_id: number;
    skip_scripts: boolean;
    image: string;
    startup: string;
    environment: Record<string, string>;
}

export const getServerCreateOptions = (): Promise<ServerCreateOptions> =>
    http.get('/admin/api/servers/create').then(({ data }) => data);

export const getCreateAllocations = (nodeId: number | string): Promise<TransferAllocation[]> =>
    http.get('/admin/api/servers/create/allocations', { params: { node_id: nodeId } }).then(({ data }) => data.data);

export const createServer = (values: ServerCreateValues): Promise<AdminServer> =>
    http.post('/admin/api/servers', values).then(({ data }) => data.data);
