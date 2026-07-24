import http from '@/api/http';

export interface PanelStatus {
    status: string;
    timestamp: string;
    metrics: {
        uptime: number;
        memory: { total: number; used: number; free: number };
        cpu: number;
        disk: { total: number; free: number; used: number };
    };
    system: {
        php_version: string;
        os: string;
        hostname: string;
        load_average: number[];
    };
}

export const getPanelStatus = (): Promise<PanelStatus> =>
    http.get('/api/application/panel/status').then(({ data }) => data);

export interface Counts {
    servers: number;
    nodes: number;
    users: number;
    locations: number;
    nests: number;
    buckets: number;
}

export const getAdminCounts = (): Promise<Counts> => http.get('/api/application/panel/counts').then(({ data }) => data);
