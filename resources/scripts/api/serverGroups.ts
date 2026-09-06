import http from '@/api/http';

export interface ServerGroup {
    id: number;
    name: string;
    description?: string | null;
    sort_order: number;
    is_collapsed: boolean;
    server_count: number;
    created_at: string | null;
    updated_at: string | null;
}

export interface ServerGroupListResponse {
    object: 'list';
    data: ServerGroup[];
}

export default async (): Promise<ServerGroup[]> => {
    return http.get('/api/client/server-groups').then(({ data }) => {
        return (data.data || []).map((item: ServerGroup) => ({
            ...item,
        }));
    });
};

export const createServerGroup = async (
    name: string,
    serverIds?: number[],
    description?: string,
): Promise<ServerGroup> => {
    return http
        .post('/api/client/server-groups', { name, server_ids: serverIds, description: description ?? null })
        .then(({ data }) => ({
            ...data.attributes,
        }));
};

export const updateServerGroup = async (
    id: number,
    data: { name?: string; description?: string | null; sort_order?: number; is_collapsed?: boolean },
): Promise<ServerGroup> => {
    return http.put(`/api/client/server-groups/${id}`, data).then(({ data }) => ({
        ...data.attributes,
    }));
};

export const deleteServerGroup = async (id: number): Promise<void> => {
    await http.delete(`/api/client/server-groups/${id}`);
};

export const addServersToGroup = async (groupId: number, serverIds: number[]): Promise<void> => {
    await http.post(`/api/client/server-groups/${groupId}/servers`, { server_ids: serverIds });
};

export const removeServersFromGroup = async (groupId: number, serverIds: number[]): Promise<void> => {
    await http.delete(`/api/client/server-groups/${groupId}/servers`, { data: { server_ids: serverIds } });
};

export const reorderServerGroups = async (groupIds: number[]): Promise<void> => {
    await http.put('/api/client/server-groups/reorder', { group_ids: groupIds });
};
