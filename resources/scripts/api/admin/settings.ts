import http from '@/api/http';

export interface GeneralSettings {
    'app:name': string;
    'app:locale': string;
    'pterodactyl:auth:2fa_required': number;
    available_languages: Record<string, string>;
}

export interface MailSettings {
    disabled: boolean;
    'mail:mailers:smtp:host': string;
    'mail:mailers:smtp:port': number;
    'mail:mailers:smtp:encryption': string;
    'mail:mailers:smtp:username': string;
    'mail:from:address': string;
    'mail:from:name': string;
}

export interface CaptchaSettings {
    providers: Record<string, string>;
    'pterodactyl:captcha:provider': string;
    'pterodactyl:captcha:turnstile:site_key': string;
    'pterodactyl:captcha:hcaptcha:site_key': string;
    'pterodactyl:captcha:recaptcha:site_key': string;
}

export interface BrandingSettings {
    logoType: string | null;
    logoUrl: string | null;
    logoValue: string | null;
    history: BrandingHistoryEntry[];
}

export interface BrandingHistoryEntry {
    type: 'upload' | 'link';
    value: string;
    timestamp: string;
}

export interface AdvancedSettings {
    'pterodactyl:guzzle:connect_timeout': number;
    'pterodactyl:guzzle:timeout': number;
    'pterodactyl:client_features:allocations:enabled': string;
    'pterodactyl:client_features:allocations:range_start': number | null;
    'pterodactyl:client_features:allocations:range_end': number | null;
}

export interface DomainData {
    id: number;
    name: string;
    dns_provider: string;
    dns_config: Record<string, string>;
    is_active: boolean;
    is_default: boolean;
    server_subdomains_count?: number;
    created_at: string;
    updated_at: string;
}

export interface DomainsResponse {
    domains: DomainData[];
    providers: Record<string, { name: string; description: string }>;
}

export const getGeneralSettings = (): Promise<GeneralSettings> =>
    http.get('/api/application/settings/general').then(({ data }) => data);

export const updateGeneralSettings = (settings: Partial<GeneralSettings>): Promise<void> =>
    http.patch('/api/application/settings/general', settings);

export const getMailSettings = (): Promise<MailSettings> =>
    http.get('/api/application/settings/mail').then(({ data }) => data);

export const updateMailSettings = (settings: Partial<MailSettings>): Promise<void> =>
    http.patch('/api/application/settings/mail', settings);

export const testMailSettings = (): Promise<void> =>
    http.post('/api/application/settings/mail/test');

export const getCaptchaSettings = (): Promise<CaptchaSettings> =>
    http.get('/api/application/settings/captcha').then(({ data }) => data);

export const updateCaptchaSettings = (settings: Record<string, unknown>): Promise<void> =>
    http.patch('/api/application/settings/captcha', settings);

export const getBrandingSettings = (): Promise<BrandingSettings> =>
    http.get('/api/application/settings/branding').then(({ data }) => data);

export const updateBrandingSettings = (formData: FormData): Promise<void> =>
    http.post('/api/application/settings/branding', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });

export const getAdvancedSettings = (): Promise<AdvancedSettings> =>
    http.get('/api/application/settings/advanced').then(({ data }) => data);

export const updateAdvancedSettings = (settings: Partial<AdvancedSettings>): Promise<void> =>
    http.patch('/api/application/settings/advanced', settings);

export const getDomains = (): Promise<DomainsResponse> =>
    http.get('/api/application/settings/domains').then(({ data }) => data);

export const createDomain = (data: Record<string, unknown>): Promise<void> =>
    http.post('/api/application/settings/domains', data);

export const updateDomain = (id: number, data: Record<string, unknown>): Promise<void> =>
    http.patch(`/api/application/settings/domains/${id}`, data);

export const deleteDomain = (id: number): Promise<void> =>
    http.delete(`/api/application/settings/domains/${id}`);

export const testDnsConnection = (data: { dns_provider: string; dns_config: Record<string, string> }): Promise<{ success: boolean; message: string }> =>
    http.post('/api/application/settings/domains/test-connection', data).then(({ data: resp }) => resp);

export const getProviderSchema = (provider: string): Promise<{ success: boolean; schema: Record<string, { description: string; required: boolean; sensitive: boolean }> }> =>
    http.get(`/api/application/settings/domains/provider-schema/${provider}`).then(({ data: resp }) => resp);
