import http from '@/api/http';

export interface ApplicationApiKey {
    identifier: string;
    key: string;
    memo: string | null;
    last_used_at: string | null;
    created_at: string | null;
}

export interface ApplicationApiResponse {
    data: ApplicationApiKey[];
    resources: string[];
    permissions: {
        read: number;
        read_write: number;
        none: number;
    };
}

export const getApplicationApiKeys = (): Promise<ApplicationApiResponse> =>
    http.get('/admin/api/application-keys').then(({ data }) => data);

export const createApplicationApiKey = (
    values: Record<string, string | number>,
): Promise<{ identifier: string; key: string }> =>
    http.post('/admin/api/application-keys', values).then(({ data }) => data.data);

export const revokeApplicationApiKey = (identifier: string): Promise<void> =>
    http.delete(`/admin/api/application-keys/${identifier}`).then(() => undefined);
