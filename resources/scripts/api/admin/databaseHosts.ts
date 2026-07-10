import http, {
    type FractalResponseData,
    getPaginationSet,
    type PaginatedResult,
    withQueryBuilderParams,
    type QueryBuilderParams,
} from '@/api/http';

export interface AdminDatabaseHost {
    id: number;
    name: string;
    host: string;
    port: number;
    username: string;
    node: number | null;
    createdAt: string;
    updatedAt: string;
}

const rawToDatabaseHost = (data: FractalResponseData): AdminDatabaseHost => {
    const attrs = data.attributes;
    return {
        id: attrs.id as number,
        name: attrs.name as string,
        host: attrs.host as string,
        port: attrs.port as number,
        username: attrs.username as string,
        node: attrs.node as number | null,
        createdAt: attrs.created_at as string,
        updatedAt: attrs.updated_at as string,
    };
};

export const getDatabaseHosts = (params?: QueryBuilderParams): Promise<PaginatedResult<AdminDatabaseHost>> =>
    new Promise((resolve, reject) => {
        http.get('/api/application/database-hosts', {
            params: withQueryBuilderParams(params),
        })
            .then(({ data }) =>
                resolve({
                    items: (data.data || []).map(rawToDatabaseHost),
                    pagination: getPaginationSet(data.meta.pagination),
                }),
            )
            .catch(reject);
    });

export const getDatabaseHost = (id: number): Promise<AdminDatabaseHost> =>
    new Promise((resolve, reject) => {
        http.get(`/api/application/database-hosts/${id}`)
            .then(({ data }) => resolve(rawToDatabaseHost(data)))
            .catch(reject);
    });

export interface CreateDatabaseHostData {
    name: string;
    host: string;
    port: number;
    username: string;
    password: string;
    node_id?: number | null;
}

export const createDatabaseHost = (data: CreateDatabaseHostData): Promise<AdminDatabaseHost> =>
    new Promise((resolve, reject) => {
        http.post('/api/application/database-hosts', data)
            .then(({ data: resp }) => resolve(rawToDatabaseHost(resp)))
            .catch(reject);
    });

export const updateDatabaseHost = (id: number, data: Partial<CreateDatabaseHostData>): Promise<AdminDatabaseHost> =>
    new Promise((resolve, reject) => {
        http.patch(`/api/application/database-hosts/${id}`, data)
            .then(({ data: resp }) => resolve(rawToDatabaseHost(resp)))
            .catch(reject);
    });

export const deleteDatabaseHost = (id: number): Promise<void> =>
    http.delete(`/api/application/database-hosts/${id}`);
