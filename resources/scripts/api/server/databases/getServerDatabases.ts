import http from '@/api/http';
import { getGlobalDaemonType } from '@/api/server/getServer';

export interface ServerDatabase {
    id: string;
    type: string;
    name: string;
    username: string;
    connectionString: string;
    allowConnectionsFrom: string;
    connectionDetails?: Record<string, string>;
    password?: string;
}

export interface AvailableDatabaseType {
    value: string;
    label: string;
    supportsRemoteConnections: boolean;
}

export interface ServerDatabasesResponse {
    databases: ServerDatabase[];
    availableTypes: AvailableDatabaseType[];
}

export const rawDataToServerDatabase = (data: Record<string, unknown>): ServerDatabase => ({
    id: data.id,
    type: data.type,
    name: data.name,
    username: data.username,
    connectionString: `${data.host.address}:${data.host.port}`,
    allowConnectionsFrom: data.connections_from,
    connectionDetails: (data.connection_details || undefined) as Record<string, string> | undefined,
    password: data.relationships.password?.attributes?.password,
});

export default (uuid: string, includePassword = true): Promise<ServerDatabasesResponse> => {
    const daemonType = getGlobalDaemonType();

    return new Promise((resolve, reject) => {
        http.get(`/api/client/servers/${daemonType}/${uuid}/databases`, {
            params: includePassword ? { include: 'password' } : undefined,
        })
            .then((response) =>
                resolve({
                    databases: (response.data.data || []).map((item: Record<string, unknown>) =>
                        rawDataToServerDatabase(item.attributes as Record<string, unknown>),
                    ),
                    availableTypes: (response.data.meta?.available_database_types || []).map(
                        (type: Record<string, unknown>) => ({
                            value: type.value as string,
                            label: type.label as string,
                            supportsRemoteConnections: Boolean(type.supports_remote_connections),
                        }),
                    ),
                }),
            )
            .catch(reject);
    });
};
