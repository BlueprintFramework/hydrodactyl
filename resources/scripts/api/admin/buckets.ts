import http, {
    type FractalResponseData,
    getPaginationSet,
    type PaginatedResult,
    type QueryBuilderParams,
    withQueryBuilderParams,
} from '@/api/http';

export interface AdminBucket {
    id: number;
    name: string;
    description: string | null;
    bucketName: string;
    endpoint: string | null;
    usePathStyleEndpoint: boolean;
    isLocal: boolean;
    enabled: boolean;
    minioInstanceUrl: string | null;
    createdAt: string;
    updatedAt: string;
}

const rawToBucket = (data: FractalResponseData): AdminBucket => {
    const attrs = data.attributes;
    return {
        id: attrs.id as number,
        name: attrs.name as string,
        description: attrs.description as string | null,
        bucketName: attrs.bucket_name as string,
        endpoint: attrs.endpoint as string | null,
        usePathStyleEndpoint: attrs.use_path_style_endpoint as boolean,
        isLocal: attrs.is_local as boolean,
        enabled: attrs.enabled as boolean,
        minioInstanceUrl: attrs.minio_instance_url as string | null,
        createdAt: attrs.created_at as string,
        updatedAt: attrs.updated_at as string,
    };
};

export const getBuckets = (params?: QueryBuilderParams): Promise<PaginatedResult<AdminBucket>> =>
    new Promise((resolve, reject) => {
        http.get('/api/application/buckets', {
            params: withQueryBuilderParams(params),
        })
            .then(({ data }) =>
                resolve({
                    items: (data.data || []).map(rawToBucket),
                    pagination: getPaginationSet(data.meta.pagination),
                }),
            )
            .catch(reject);
    });

export const getBucket = (id: number): Promise<AdminBucket> =>
    new Promise((resolve, reject) => {
        http.get(`/api/application/buckets/${id}`)
            .then(({ data }) => resolve(rawToBucket(data)))
            .catch(reject);
    });

export interface CreateBucketData {
    name: string;
    description?: string | null;
    access_key: string;
    secret_key: string;
    endpoint?: string | null;
    bucket_name: string;
    use_path_style_endpoint?: boolean;
    enabled?: boolean;
    is_local?: boolean;
    minio_instance_url?: string | null;
}

export const createBucket = (data: CreateBucketData): Promise<AdminBucket> =>
    new Promise((resolve, reject) => {
        http.post('/api/application/buckets', data)
            .then(({ data: resp }) => resolve(rawToBucket(resp)))
            .catch(reject);
    });

export const updateBucket = (id: number, data: Partial<CreateBucketData>): Promise<AdminBucket> =>
    new Promise((resolve, reject) => {
        http.patch(`/api/application/buckets/${id}`, data)
            .then(({ data: resp }) => resolve(rawToBucket(resp)))
            .catch(reject);
    });

export const deleteBucket = (id: number): Promise<void> => http.delete(`/api/application/buckets/${id}`);
