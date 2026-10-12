import http from '@/api/http';

export interface ResourceSample {
    cpu: number;
    memory: number;
    rx: number;
    tx: number;
    uptime: number;
    recordedAt: string;
}

interface RawSample {
    attributes: {
        cpu_absolute: number;
        memory_bytes: number;
        network_rx_bytes: number;
        network_tx_bytes: number;
        uptime: number;
        recorded_at: string;
    };
}

export default (server: string): Promise<ResourceSample[]> => {
    return new Promise((resolve, reject) => {
        http.get(`/api/client/servers/${server}/resources/history`)
            .then(({ data }) =>
                resolve(
                    ((data.data ?? []) as RawSample[]).map(({ attributes }) => ({
                        cpu: attributes.cpu_absolute,
                        memory: Math.floor(attributes.memory_bytes / 1024 / 1024),
                        rx: attributes.network_rx_bytes,
                        tx: attributes.network_tx_bytes,
                        uptime: attributes.uptime,
                        recordedAt: attributes.recorded_at,
                    })),
                ),
            )
            .catch(reject);
    });
};
