import http from '@/api/http';

export interface Domain {
    id: number;
    name: string;
    dns_provider: string;
    dns_config: Record<string, string>;
    is_active: boolean;
    is_default: boolean;
    subdomains_count: number;
    active_subdomains_count: number;
    created_at: string | null;
}

export interface DomainProvider {
    name: string;
    description: string;
}

export interface ProviderSchemaField {
    type: string;
    required: boolean;
    description: string;
    sensitive?: boolean;
    default?: string | null;
}

export type ProviderSchema = Record<string, ProviderSchemaField>;

export interface DomainValues {
    name: string;
    dns_provider: string;
    dns_config: Record<string, string>;
    is_active: boolean;
    is_default: boolean;
}

export interface DomainsResponse {
    data: Domain[];
    providers: Record<string, DomainProvider>;
}

export const getDomains = (): Promise<DomainsResponse> =>
    http.get('/admin/api/settings/domains').then(({ data }) => data);

export const getProviderSchema = (provider: string): Promise<ProviderSchema> =>
    http.get(`/admin/api/settings/domains/providers/${provider}/schema`).then(({ data }) => data.data);

export const createDomain = (values: DomainValues): Promise<Domain> =>
    http.post('/admin/api/settings/domains', values).then(({ data }) => data.data);

export const updateDomain = (id: number, values: DomainValues): Promise<Domain> =>
    http.patch(`/admin/api/settings/domains/${id}`, values).then(({ data }) => data.data);

export const deleteDomain = (id: number): Promise<void> =>
    http.delete(`/admin/api/settings/domains/${id}`).then(() => undefined);

export const testDomainConnection = (values: Pick<DomainValues, 'dns_provider' | 'dns_config'>): Promise<void> =>
    http.post('/admin/api/settings/domains/test-connection', values).then(() => undefined);
