import http, {
    type FractalResponseData,
    getPaginationSet,
    type PaginatedResult,
    type QueryBuilderParams,
    withQueryBuilderParams,
} from '@/api/http';

export interface AdminLocation {
    id: number;
    uuid: string;
    short: string;
    long: string;
    nodesCount: number;
    serversCount: number;
    createdAt: string;
    updatedAt: string;
}

const rawToLocation = (data: FractalResponseData): AdminLocation => {
    const attrs = data.attributes;
    return {
        id: attrs.id as number,
        uuid: attrs.uuid as string,
        short: attrs.short as string,
        long: attrs.long as string,
        nodesCount: (attrs.nodes_count as number) || 0,
        serversCount: (attrs.servers_count as number) || 0,
        createdAt: attrs.created_at as string,
        updatedAt: attrs.updated_at as string,
    };
};

export const getLocations = (params?: QueryBuilderParams): Promise<PaginatedResult<AdminLocation>> =>
    new Promise((resolve, reject) => {
        http.get('/api/application/locations', {
            params: withQueryBuilderParams(params),
        })
            .then(({ data }) =>
                resolve({
                    items: (data.data || []).map(rawToLocation),
                    pagination: getPaginationSet(data.meta.pagination),
                }),
            )
            .catch(reject);
    });

export const getLocation = (id: number): Promise<AdminLocation> =>
    new Promise((resolve, reject) => {
        http.get(`/api/application/locations/${id}`)
            .then(({ data }) => resolve(rawToLocation(data)))
            .catch(reject);
    });

export const deleteLocation = (id: number): Promise<void> => http.delete(`/api/application/locations/${id}`);

export interface CreateLocationData {
    short: string;
    long: string;
}

export const createLocation = (data: CreateLocationData): Promise<AdminLocation> =>
    new Promise((resolve, reject) => {
        http.post('/api/application/locations', data)
            .then(({ data: resp }) => resolve(rawToLocation(resp)))
            .catch(reject);
    });

export const updateLocation = (id: number, data: Partial<CreateLocationData>): Promise<AdminLocation> =>
    new Promise((resolve, reject) => {
        http.patch(`/api/application/locations/${id}`, data)
            .then(({ data: resp }) => resolve(rawToLocation(resp)))
            .catch(reject);
    });
