import http from '@/api/http';

export interface GeneralSettings {
    'app:name': string;
    'app:locale': string;
    'pterodactyl:auth:2fa_required': number;
}

export interface AdvancedSettings {
    'pterodactyl:guzzle:timeout': number;
    'pterodactyl:guzzle:connect_timeout': number;
    'pterodactyl:client_features:allocations:enabled': boolean;
    'pterodactyl:client_features:allocations:range_start': number | null;
    'pterodactyl:client_features:allocations:range_end': number | null;
    'pterodactyl:client_features:groups:enabled': boolean;
    'pterodactyl:client_features:schedules:per_schedule_task_limit': number;
    'pterodactyl:client_features:schedules:stuck_timeout': number;
}

export interface MailSettings {
    enabled: boolean;
    'mail:mailers:smtp:host': string;
    'mail:mailers:smtp:port': number;
    'mail:mailers:smtp:encryption': string | null;
    'mail:mailers:smtp:username': string | null;
    'mail:from:address': string;
    'mail:from:name': string | null;
}

export interface CaptchaSettings {
    providers: Record<string, string>;
    'pterodactyl:captcha:provider': string;
    'pterodactyl:captcha:turnstile:site_key': string;
    'pterodactyl:captcha:turnstile:secret_key': string;
    'pterodactyl:captcha:hcaptcha:site_key': string;
    'pterodactyl:captcha:hcaptcha:secret_key': string;
    'pterodactyl:captcha:recaptcha:site_key': string;
    'pterodactyl:captcha:recaptcha:secret_key': string;
    'pterodactyl:captcha:cap:site_key': string;
    'pterodactyl:captcha:cap:secret_key': string;
    'pterodactyl:captcha:cap:server_url': string;
}

export interface CustomNavigationSettings {
    items: { label: string; url: string; icon: string }[];
}

export interface SettingsResponse {
    general: GeneralSettings;
    advanced: AdvancedSettings;
    mail: MailSettings;
    captcha: CaptchaSettings;
    custom_navigation: CustomNavigationSettings;
    languages: Record<string, string>;
}

export const getSettings = (): Promise<SettingsResponse> => http.get('/admin/api/settings').then(({ data }) => data);

export const updateSettings = (group: string, values: Record<string, unknown>): Promise<void> =>
    http.patch(`/admin/api/settings/${group}`, values).then(() => undefined);
