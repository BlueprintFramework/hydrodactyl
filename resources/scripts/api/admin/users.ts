import http, { getPaginationSet, type PaginatedResult } from '@/api/http';

export interface AdminUser {
    id: number;
    uuid: string;
    username: string;
    email: string;
    name_first: string | null;
    name_last: string | null;
    root_admin: boolean;
    use_totp: boolean;
    language: string;
    servers_count: number;
    subuser_of_count: number;
    created_at: string | null;
}

export interface UserValues {
    email: string;
    username: string;
    name_first: string;
    name_last: string;
    password: string;
    language: string;
    root_admin: boolean;
}

export interface UserQuery {
    page?: number;
    search?: string;
    sort?: string;
}

export const getUsers = (query: UserQuery = {}): Promise<PaginatedResult<AdminUser>> => {
    const params: Record<string, unknown> = {};
    if (query.page) params.page = query.page;
    if (query.search) params['filter[search]'] = query.search;
    if (query.sort) params.sort = query.sort;

    return http.get('/admin/api/users', { params }).then(({ data }) => ({
        items: data.data,
        pagination: getPaginationSet(data.meta.pagination),
    }));
};

export const getUser = (id: number | string): Promise<AdminUser> =>
    http.get(`/admin/api/users/${id}`).then(({ data }) => data);

export const getLanguages = (): Promise<Record<string, string>> =>
    http.get('/admin/api/users/languages').then(({ data }) => data.data);

export const createUser = (values: UserValues): Promise<AdminUser> =>
    http.post('/admin/api/users', values).then(({ data }) => data);

export const updateUser = (id: number | string, values: UserValues): Promise<AdminUser> =>
    http.patch(`/admin/api/users/${id}`, values).then(({ data }) => data);

export const deleteUser = (id: number | string): Promise<void> =>
    http.delete(`/admin/api/users/${id}`).then(() => undefined);
