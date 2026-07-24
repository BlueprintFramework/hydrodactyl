import http, {
    type FractalResponseData,
    getPaginationSet,
    type PaginatedResult,
    type QueryBuilderParams,
    withQueryBuilderParams,
} from '@/api/http';

export interface ApiKeyPermissions {
    [key: string]: number;
}

export interface AdminApiKey {
    id: number;
    userId: number;
    keyType: number;
    identifier: string;
    memo: string;
    allowedIps: string[] | null;
    lastUsedAt: string | null;
    expiresAt: string | null;
    permissions: ApiKeyPermissions;
    createdAt: string;
    updatedAt: string;
}

const rawToApiKey = (data: FractalResponseData): AdminApiKey => {
    const attrs = data.attributes;
    return {
        id: attrs.id as number,
        userId: attrs.user_id as number,
        keyType: attrs.key_type as number,
        identifier: attrs.identifier as string,
        memo: attrs.memo as string,
        allowedIps: attrs.allowed_ips as string[] | null,
        lastUsedAt: attrs.last_used_at as string | null,
        expiresAt: attrs.expires_at as string | null,
        permissions: (attrs.permissions as ApiKeyPermissions) || {},
        createdAt: attrs.created_at as string,
        updatedAt: attrs.updated_at as string,
    };
};

export const getApiKeys = (params?: QueryBuilderParams): Promise<PaginatedResult<AdminApiKey>> =>
    new Promise((resolve, reject) => {
        http.get('/api/application/api-keys', {
            params: withQueryBuilderParams(params),
        })
            .then(({ data }) =>
                resolve({
                    items: (data.data || []).map(rawToApiKey),
                    pagination: getPaginationSet(data.meta.pagination),
                }),
            )
            .catch(reject);
    });

export const getApiKey = (id: number): Promise<AdminApiKey> =>
    new Promise((resolve, reject) => {
        http.get(`/api/application/api-keys/${id}`)
            .then(({ data }) => resolve(rawToApiKey(data)))
            .catch(reject);
    });

export interface CreateApiKeyData {
    memo: string;
    allowed_ips?: string[];
    expires_at?: string;
    [key: string]: unknown;
}

export const createApiKey = (data: CreateApiKeyData): Promise<{ key: AdminApiKey; token: string }> =>
    new Promise((resolve, reject) => {
        http.post('/api/application/api-keys', data)
            .then(({ data: resp }) =>
                resolve({
                    key: rawToApiKey(resp),
                    token: resp.meta?.token as string,
                }),
            )
            .catch(reject);
    });

export const updateApiKey = (id: number, data: Partial<CreateApiKeyData>): Promise<AdminApiKey> =>
    new Promise((resolve, reject) => {
        http.patch(`/api/application/api-keys/${id}`, data)
            .then(({ data: resp }) => resolve(rawToApiKey(resp)))
            .catch(reject);
    });

export const deleteApiKey = (id: number): Promise<void> => http.delete(`/api/application/api-keys/${id}`);
