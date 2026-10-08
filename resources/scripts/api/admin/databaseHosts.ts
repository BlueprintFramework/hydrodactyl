import http, { getPaginationSet, type PaginatedResult } from '@/api/http';

export interface DatabaseHostNode {
    id: number;
    name: string;
}

export interface AdminDatabaseHost {
    id: number;
    name: string;
    host: string;
    port: number;
    username: string;
    max_databases: number | null;
    node_id: number | null;
    node: DatabaseHostNode | null;
    databases_count: number;
}

export interface DatabaseHostValues {
    name: string;
    host: string;
    port: string;
    username: string;
    password: string;
    node_id: string;
}

export interface HostDatabase {
    id: number;
    database: string;
    username: string;
    remote: string;
    max_connections: number | null;
    server: { id: number; name: string } | null;
}

export interface AdminDatabaseHostDetail extends Omit<AdminDatabaseHost, 'databases_count'> {
    databases: PaginatedResult<HostDatabase>;
}

export interface DatabaseHostNodeOption {
    id: number;
    name: string;
    location: string;
}

export interface DatabaseHostOptions {
    nodes: DatabaseHostNodeOption[];
}

export interface ConnectionTestResult {
    success: boolean;
    message: string;
    version?: string;
    has_grant_option?: boolean;
}

export const getDatabaseHosts = (): Promise<AdminDatabaseHost[]> =>
    http.get('/admin/api/database-hosts').then(({ data }) => data.data);

export const getDatabaseHost = (id: number | string, page = 1): Promise<AdminDatabaseHostDetail> =>
    http.get(`/admin/api/database-hosts/${id}`, { params: { page } }).then(({ data }) => ({
        ...data.data,
        databases: {
            items: data.data.databases.items,
            pagination: getPaginationSet(data.data.databases.pagination),
        },
    }));

export const getDatabaseHostOptions = (): Promise<DatabaseHostOptions> =>
    http.get('/admin/api/database-hosts/options').then(({ data }) => data);

export const createDatabaseHost = (values: DatabaseHostValues): Promise<AdminDatabaseHost> =>
    http.post('/admin/api/database-hosts', values).then(({ data }) => data.data);

export const updateDatabaseHost = (id: number | string, values: DatabaseHostValues): Promise<AdminDatabaseHost> =>
    http.patch(`/admin/api/database-hosts/${id}`, values).then(({ data }) => data.data);

export const deleteDatabaseHost = (id: number | string): Promise<void> =>
    http.delete(`/admin/api/database-hosts/${id}`).then(() => undefined);

export const testDatabaseConnection = (
    values: Pick<DatabaseHostValues, 'host' | 'port' | 'username' | 'password'>,
): Promise<ConnectionTestResult> => http.post('/admin/api/database-hosts/test', values).then(({ data }) => data);
