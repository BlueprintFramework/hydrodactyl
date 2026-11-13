import http from '@/api/http';

export interface McjarsVersion {
    id: string;
    type: string;
    supported: boolean;
    java: number | null;
    builds: number;
    created: string | null;
    latest_build: number | null;
    latest_name: string | null;
    jar_size: number | null;
    experimental: boolean;
}

export interface McjarsBuild {
    id: number | null;
    name: string;
    build_number: number | null;
    version_id: string;
    java: number | null;
    jar_size: number | null;
    created: string | null;
    experimental: boolean;
    changes: string[];
}

export async function getMcjarsVersions(uuid: string, type: string): Promise<McjarsVersion[]> {
    const { data } = await http.get(`/api/client/servers/${uuid}/mcjars/versions`, {
        params: { type },
    });

    return (data?.versions || []) as McjarsVersion[];
}

export async function getMcjarsBuilds(uuid: string, type: string, version: string): Promise<McjarsBuild[]> {
    const { data } = await http.get(`/api/client/servers/${uuid}/mcjars/builds`, {
        params: { type, version },
    });

    return (data?.builds || []) as McjarsBuild[];
}
