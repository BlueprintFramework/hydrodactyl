import http from '@/api/http';

export interface LogoHistoryEntry {
    type: string;
    value: string;
    url: string;
    current: boolean;
}

export interface LogoResponse {
    type: string | null;
    value: string | null;
    url: string | null;
    history: LogoHistoryEntry[];
}

export interface LogoValues {
    logo_file?: File;
    logo_url?: string;
    remove?: boolean;
    rewind?: number;
}

export const getLogo = (): Promise<LogoResponse> => http.get('/admin/api/settings/logo').then(({ data }) => data);

export const updateLogo = (values: LogoValues): Promise<LogoResponse> => {
    if (values.logo_file) {
        const form = new FormData();
        form.append('logo_file', values.logo_file);

        return http.post('/admin/api/settings/logo', form).then(({ data }) => data);
    }

    return http.post('/admin/api/settings/logo', values).then(({ data }) => data);
};
