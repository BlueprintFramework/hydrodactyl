import http from '@/api/http';

export interface SystemStatus {
    status: string;
    timestamp: string;
    metrics: {
        uptime: number;
        memory: { total: number; used: number; free: number };
        cpu: number;
        cpu_cores: number;
        disk: { total: number; free: number; used: number };
    };
    system: {
        php_version: string;
        os: string;
        hostname: string;
        load_average: number[];
    };
}

export default (): Promise<SystemStatus> => http.get('/admin/api/system-status').then(({ data }) => data);
