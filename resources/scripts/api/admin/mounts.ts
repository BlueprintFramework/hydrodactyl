import http from '@/api/http';

export interface AdminMount {
    id: number;
    uuid: string;
    name: string;
    description: string | null;
    source: string;
    target: string;
    read_only: boolean;
    user_mountable: boolean;
    eggs_count: number;
    nodes_count: number;
    servers_count: number;
}

export interface MountEgg {
    id: number;
    name: string;
}

export interface MountNode {
    id: number;
    name: string;
    fqdn: string;
}

export interface AdminMountDetail {
    id: number;
    uuid: string;
    name: string;
    description: string | null;
    source: string;
    target: string;
    read_only: boolean;
    user_mountable: boolean;
    eggs: MountEgg[];
    nodes: MountNode[];
}

export interface MountOptions {
    nests: { id: number; name: string; eggs: MountEgg[] }[];
    locations: { id: number; short: string; long: string | null; nodes: { id: number; name: string }[] }[];
}

export interface MountResponse extends MountOptions {
    data: AdminMountDetail;
}

export interface MountValues {
    name: string;
    description: string;
    source: string;
    target: string;
    read_only: boolean;
    user_mountable: boolean;
}

export const getMounts = (): Promise<AdminMount[]> => http.get('/admin/api/mounts').then(({ data }) => data.data);

export const getMount = (id: number | string): Promise<MountResponse> =>
    http.get(`/admin/api/mounts/${id}`).then(({ data }) => data);

export const createMount = (values: MountValues): Promise<{ id: number }> =>
    http.post('/admin/api/mounts', values).then(({ data }) => data.data);

export const updateMount = (id: number | string, values: MountValues): Promise<void> =>
    http.patch(`/admin/api/mounts/${id}`, values).then(() => undefined);

export const deleteMount = (id: number | string): Promise<void> =>
    http.delete(`/admin/api/mounts/${id}`).then(() => undefined);

export const addMountEggs = (id: number | string, eggs: number[]): Promise<void> =>
    http.post(`/admin/api/mounts/${id}/eggs`, { eggs }).then(() => undefined);

export const addMountNodes = (id: number | string, nodes: number[]): Promise<void> =>
    http.post(`/admin/api/mounts/${id}/nodes`, { nodes }).then(() => undefined);

export const deleteMountEgg = (id: number | string, eggId: number): Promise<void> =>
    http.delete(`/admin/api/mounts/${id}/eggs/${eggId}`).then(() => undefined);

export const deleteMountNode = (id: number | string, nodeId: number): Promise<void> =>
    http.delete(`/admin/api/mounts/${id}/nodes/${nodeId}`).then(() => undefined);
