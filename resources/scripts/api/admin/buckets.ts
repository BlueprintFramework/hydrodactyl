import http, { getPaginationSet, type PaginatedResult } from '@/api/http';

export interface AdminBucket {
    id: number;
    name: string;
    description: string | null;
    endpoint: string | null;
    region: string;
    bucket_name: string;
    use_path_style_endpoint: boolean;
    enabled: boolean;
    server_count: number;
}

export interface AdminBucketDetail extends AdminBucket {
    access_key: string;
    secret_key: string;
    servers_count: number;
    storage_used: number;
    created_at: string | null;
    updated_at: string | null;
}

export interface BucketServer {
    id: number;
    uuid_short: string;
    name: string;
    owner: { id: number; username: string } | null;
    nest: string | null;
    egg: string | null;
}

export interface BucketValues {
    name: string;
    description: string;
    access_key: string;
    secret_key: string;
    endpoint: string;
    region: string;
    bucket_name: string;
    use_path_style_endpoint: boolean;
    enabled: boolean;
}

export interface TestConnectionValues {
    access_key: string;
    secret_key: string;
    bucket_name: string;
    endpoint: string;
    region: string;
    use_path_style_endpoint: boolean;
}

export const getBuckets = (query: { page?: number; search?: string } = {}): Promise<PaginatedResult<AdminBucket>> => {
    const params: Record<string, unknown> = {};
    if (query.page) params.page = query.page;
    if (query.search) params['filter[name]'] = query.search;

    return http.get('/admin/api/buckets', { params }).then(({ data }) => ({
        items: data.data,
        pagination: getPaginationSet(data.meta.pagination),
    }));
};

export const getBucket = (id: number | string): Promise<AdminBucketDetail> =>
    http.get(`/admin/api/buckets/${id}`).then(({ data }) => data.data);

export const getBucketServers = (id: number | string): Promise<BucketServer[]> =>
    http.get(`/admin/api/buckets/${id}/servers`).then(({ data }) => data.data);

export const createBucket = (values: BucketValues): Promise<{ id: number }> =>
    http.post('/admin/api/buckets', values).then(({ data }) => data.data);

export const updateBucket = (id: number | string, values: BucketValues): Promise<void> =>
    http.patch(`/admin/api/buckets/${id}`, values).then(() => undefined);

export const deleteBucket = (id: number | string): Promise<void> =>
    http.delete(`/admin/api/buckets/${id}`).then(() => undefined);

export const testBucketConnection = (values: TestConnectionValues): Promise<string> =>
    http.post('/admin/api/buckets/test-connection', values).then(({ data }) => data.message);
