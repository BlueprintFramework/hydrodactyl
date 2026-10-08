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
    brandColor: string;
    canProcessImages: boolean;
}

export interface LogoValues {
    logo_file?: File;
    logo_url?: string;
    remove?: boolean;
    rewind?: number;
    brand_color?: string | null;
}

export const getLogo = (): Promise<LogoResponse> => http.get('/admin/api/settings/logo').then(({ data }) => data);

export const updateLogo = (values: LogoValues): Promise<LogoResponse> => {
    const { brand_color: brandColor, ...rest } = values;

    if (rest.logo_file) {
        const form = new FormData();
        form.append('logo_file', rest.logo_file);

        if (brandColor !== undefined) {
            // An explicit reset sends an empty string, which the framework's
            // ConvertEmptyStringsToNull middleware turns into null.
            form.append('app:brand_color', brandColor ?? '');
        }

        return http.post('/admin/api/settings/logo', form).then(({ data }) => data);
    }

    const payload = { ...rest, ...(brandColor !== undefined ? { 'app:brand_color': brandColor } : {}) };

    return http.post('/admin/api/settings/logo', payload).then(({ data }) => data);
};
