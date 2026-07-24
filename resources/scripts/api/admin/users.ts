import http, {
    type FractalResponseData,
    getPaginationSet,
    type PaginatedResult,
    type QueryBuilderParams,
    withQueryBuilderParams,
} from '@/api/http';

export interface AdminServerSummary {
    id: number;
    name: string;
    uuid: string;
    identifier: string;
    nodeId: number;
    status: string[];
    suspended: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface AdminUser {
    id: number;
    uuid: string;
    externalId: string | null;
    username: string;
    email: string;
    nameFirst: string;
    nameLast: string;
    language: string;
    rootAdmin: boolean;
    useTotp: boolean;
    serversCount: number;
    createdAt: string;
    updatedAt: string;
    servers?: AdminServerSummary[];
}

const rawToServer = (data: FractalResponseData): AdminServerSummary => {
    const attrs = data.attributes;
    return {
        id: attrs.id as number,
        name: attrs.name as string,
        uuid: attrs.uuid as string,
        identifier: attrs.identifier as string,
        nodeId: attrs.node as number,
        status: (attrs.status as string[]) || [],
        suspended: attrs.suspended as boolean,
        createdAt: attrs.created_at as string,
        updatedAt: attrs.updated_at as string,
    };
};

const rawToUser = (data: FractalResponseData): AdminUser => {
    const attrs = data.attributes;
    const relationships = data.relationships as Record<string, unknown> | undefined;

    const user: AdminUser = {
        id: attrs.id as number,
        uuid: attrs.uuid as string,
        externalId: (attrs.external_id as string) || null,
        username: attrs.username as string,
        email: attrs.email as string,
        nameFirst: attrs.first_name as string,
        nameLast: attrs.last_name as string,
        language: attrs.language as string,
        rootAdmin: attrs.root_admin as boolean,
        useTotp: attrs['2fa'] as boolean,
        serversCount: (attrs.servers_count as number) || 0,
        createdAt: attrs.created_at as string,
        updatedAt: attrs.updated_at as string,
    };

    if (relationships?.server) {
        const serverList = relationships.server as { data: FractalResponseData[] };
        if (Array.isArray(serverList.data)) {
            user.servers = serverList.data.map(rawToServer);
        }
    }

    return user;
};

export const getUsers = (params?: QueryBuilderParams): Promise<PaginatedResult<AdminUser>> =>
    new Promise((resolve, reject) => {
        http.get('/api/application/users', {
            params: withQueryBuilderParams(params),
        })
            .then(({ data }) =>
                resolve({
                    items: (data.data || []).map(rawToUser),
                    pagination: getPaginationSet(data.meta.pagination),
                }),
            )
            .catch(reject);
    });

export const getUser = (id: number, include?: string): Promise<AdminUser> =>
    new Promise((resolve, reject) => {
        http.get(`/api/application/users/${id}`, {
            params: include ? { include } : undefined,
        })
            .then(({ data }) => resolve(rawToUser(data)))
            .catch(reject);
    });

export const deleteUser = (id: number): Promise<void> => http.delete(`/api/application/users/${id}`);

export interface CreateUserData {
    username: string;
    email: string;
    name_first: string;
    name_last: string;
    password?: string;
    root_admin?: boolean;
    language?: string;
}

export const createUser = (data: CreateUserData): Promise<AdminUser> =>
    new Promise((resolve, reject) => {
        http.post('/api/application/users', data)
            .then(({ data: resp }) => resolve(rawToUser(resp)))
            .catch(reject);
    });

export const updateUser = (id: number, data: Partial<CreateUserData>): Promise<AdminUser> =>
    new Promise((resolve, reject) => {
        http.patch(`/api/application/users/${id}`, data)
            .then(({ data: resp }) => resolve(rawToUser(resp)))
            .catch(reject);
    });
