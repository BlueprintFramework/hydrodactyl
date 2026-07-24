import http, {
    type FractalResponseData,
    getPaginationSet,
    type PaginatedResult,
    type QueryBuilderParams,
    withQueryBuilderParams,
} from '@/api/http';

export interface AdminMount {
    id: number;
    uuid: string;
    name: string;
    description: string | null;
    source: string;
    target: string;
    readOnly: boolean;
    userMountable: boolean;
}

const rawToMount = (data: FractalResponseData): AdminMount => {
    return {
        id: data.attributes.id as number,
        uuid: data.attributes.uuid as string,
        name: data.attributes.name as string,
        description: data.attributes.description as string | null,
        source: data.attributes.source as string,
        target: data.attributes.target as string,
        readOnly: data.attributes.read_only as boolean,
        userMountable: data.attributes.user_mountable as boolean,
    };
};

export const getMounts = (params?: QueryBuilderParams): Promise<PaginatedResult<AdminMount>> =>
    new Promise((resolve, reject) => {
        http.get('/api/application/mounts', {
            params: withQueryBuilderParams(params),
        })
            .then(({ data }) =>
                resolve({
                    items: (data.data || []).map(rawToMount),
                    pagination: getPaginationSet(data.meta.pagination),
                }),
            )
            .catch(reject);
    });

export const getMount = (id: number): Promise<AdminMount> =>
    new Promise((resolve, reject) => {
        http.get(`/api/application/mounts/${id}`)
            .then(({ data }) => resolve(rawToMount(data)))
            .catch(reject);
    });

export interface CreateMountData {
    name: string;
    description?: string | null;
    source: string;
    target: string;
    read_only?: boolean;
    user_mountable?: boolean;
}

export const createMount = (data: CreateMountData): Promise<AdminMount> =>
    new Promise((resolve, reject) => {
        http.post('/api/application/mounts', data)
            .then(({ data: resp }) => resolve(rawToMount(resp)))
            .catch(reject);
    });

export const updateMount = (id: number, data: Partial<CreateMountData>): Promise<AdminMount> =>
    new Promise((resolve, reject) => {
        http.patch(`/api/application/mounts/${id}`, data)
            .then(({ data: resp }) => resolve(rawToMount(resp)))
            .catch(reject);
    });

export const deleteMount = (id: number): Promise<void> => http.delete(`/api/application/mounts/${id}`);
