import http from '@/api/http';

export interface CustomDomain {
    id: number;
    hostname: string;
    zone_name: string;
    allocation_id: number;
    ip: string;
    port: number;
}

export interface CustomDomainInfo {
    enabled: boolean;
    data: CustomDomain[];
}

const getCustomDomains = async (uuid: string): Promise<CustomDomainInfo> => {
    const { data } = await http.get(`/api/client/servers/${uuid}/custom-domains`);

    return data;
};

const createCustomDomain = async (
    uuid: string,
    hostname: string,
    apiToken: string,
    allocationId: number | null,
): Promise<CustomDomain> => {
    const { data } = await http.post(`/api/client/servers/${uuid}/custom-domains`, {
        hostname,
        api_token: apiToken,
        allocation_id: allocationId,
    });

    return data.data;
};

const updateCustomDomain = async (
    uuid: string,
    id: number,
    subdomain: string,
    allocationId: number | null,
): Promise<CustomDomain> => {
    const { data } = await http.patch(`/api/client/servers/${uuid}/custom-domains/${id}`, {
        subdomain,
        allocation_id: allocationId,
    });

    return data.data;
};

const deleteCustomDomain = async (uuid: string, id: number): Promise<void> =>
    await http.delete(`/api/client/servers/${uuid}/custom-domains/${id}`);

export { createCustomDomain, deleteCustomDomain, getCustomDomains, updateCustomDomain };
