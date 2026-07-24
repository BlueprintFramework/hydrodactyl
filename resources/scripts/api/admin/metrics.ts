import http from '@/api/http';

export interface MetricsSample {
    timestamp: string;
    cpu: number;
    memory_used: number;
    memory_total: number;
    disk_used: number;
    disk_total: number;
}

export interface MetricsHistoryResponse {
    data: MetricsSample[];
}

export const getMetricsHistory = (): Promise<MetricsSample[]> =>
    http.get('/api/application/panel/metrics/history').then(({ data }) => (data as MetricsHistoryResponse).data ?? []);
