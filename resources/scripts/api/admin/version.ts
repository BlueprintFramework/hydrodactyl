import http from '@/api/http';

export interface VersionCheck {
    current: string;
    latest: string | null;
    up_to_date: boolean | null;
}

export const getVersionCheck = (): Promise<VersionCheck> =>
    http.get('/admin/api/version-check').then(({ data }) => data.data);
