import http from '@/api/http';

export interface ServerCounts {
    owned: number;
    shared: number;
}

interface ServerCountsResponse {
    object: 'server_counts';
    attributes: ServerCounts;
}

/**
 * Owned and shared server totals for the signed-in user, fetched in one request
 * instead of paginating `/api/client` twice.
 */
export default async (): Promise<ServerCounts> => {
    const { data } = await http.get<ServerCountsResponse>('/api/client/server-counts');

    return data.attributes;
};
