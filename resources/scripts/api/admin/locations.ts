import http from '@/api/http';

export interface AdminLocation {
    id: number;
    short: string;
    long: string | null;
}

export interface AdminLocationListItem extends AdminLocation {
    nodes_count: number;
    servers_count: number;
    memory_percent: number;
    allocated_memory: number;
    total_memory: number;
    disk_percent: number;
    allocated_disk: number;
    total_disk: number;
}

export interface LocationUsage {
    percent: number;
    allocated: number;
    total: number;
}

export interface LocationNode {
    id: number;
    name: string;
    fqdn: string;
    memory_percent: number;
    disk_percent: number;
    servers_count: number;
}

export interface AdminLocationDetail extends AdminLocation {
    memory: LocationUsage;
    disk: LocationUsage;
    nodes: LocationNode[];
}

export const getLocations = (): Promise<AdminLocationListItem[]> =>
    http.get('/admin/api/locations').then(({ data }) => data.data);

export const getLocation = (id: number | string): Promise<AdminLocationDetail> =>
    http.get(`/admin/api/locations/${id}`).then(({ data }) => data.data);

export const createLocation = (values: { short: string; long: string }): Promise<AdminLocation> =>
    http.post('/admin/api/locations', values).then(({ data }) => data.data);

export const updateLocation = (id: number | string, values: { short: string; long: string }): Promise<AdminLocation> =>
    http.patch(`/admin/api/locations/${id}`, values).then(({ data }) => data.data);

export const deleteLocation = (id: number | string): Promise<void> =>
    http.delete(`/admin/api/locations/${id}`).then(() => undefined);
