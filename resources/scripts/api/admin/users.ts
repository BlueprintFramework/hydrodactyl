import http, {
    type FractalResponseData,
    getPaginationSet,
    type PaginatedResult,
    withQueryBuilderParams,
    type QueryBuilderParams,
} from '@/api/http';

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
}

const rawToUser = (data: FractalResponseData): AdminUser => {
    const attrs = data.attributes;
    return {
        id: attrs.id as number,
        uuid: attrs.uuid as string,
        externalId: (attrs.external_id as string) || null,
        username: attrs.username as string,
        email: attrs.email as string,
        nameFirst: attrs.name_first as string,
        nameLast: attrs.name_last as string,
        language: attrs.language as string,
        rootAdmin: attrs.root_admin as boolean,
        useTotp: attrs.use_totp as boolean,
        serversCount: attrs.servers_count as number || 0,
        createdAt: attrs.created_at as string,
        updatedAt: attrs.updated_at as string,
    };
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

export const getUser = (id: number): Promise<AdminUser> =>
    new Promise((resolve, reject) => {
        http.get(`/api/application/users/${id}`)
            .then(({ data }) => resolve(rawToUser(data)))
            .catch(reject);
    });

export const deleteUser = (id: number): Promise<void> =>
    http.delete(`/api/application/users/${id}`);

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
