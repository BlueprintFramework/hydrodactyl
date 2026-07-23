import http, {
    type FractalResponseData,
    getPaginationSet,
    type PaginatedResult,
    type QueryBuilderParams,
    withQueryBuilderParams,
} from '@/api/http';

export interface AdminEggVariable {
    id: number;
    name: string;
    description: string;
    envVariable: string;
    defaultValue: string;
    userViewable: boolean;
    userEditable: boolean;
    rules: string;
    createdAt: string;
    updatedAt: string;
}

export interface AdminEggConfig {
    files: Record<string, unknown> | null;
    startup: string | null;
    stop: string | null;
    logs: string | null;
    fileDenylist: string[] | null;
    extends: number | null;
}

export interface AdminEggScript {
    privileged: boolean;
    install: string | null;
    entry: string;
    container: string;
    extends: number | null;
}

export interface AdminEgg {
    id: number;
    uuid: string;
    name: string;
    description: string;
    nest: number;
    author: string;
    dockerImage: string;
    dockerImages: Record<string, string>;
    config: AdminEggConfig;
    startup: string;
    script: AdminEggScript;
    features: string[] | null;
    forceOutgoingIp: boolean;
    fileDenylist: string[] | null;
    createdAt: string;
    updatedAt: string;
    variables?: AdminEggVariable[];
}

export interface AdminNest {
    id: number;
    uuid: string;
    author: string;
    name: string;
    description: string;
    icon: string | null;
    eggsCount: number;
    serversCount: number;
    createdAt: string;
    updatedAt: string;
    eggs?: AdminEgg[];
}

const rawToNest = (data: FractalResponseData): AdminNest => {
    const attrs = data.attributes;
    return {
        id: attrs.id as number,
        uuid: attrs.uuid as string,
        author: attrs.author as string,
        name: attrs.name as string,
        description: (attrs.description as string) || '',
        icon: (attrs.icon as string) || null,
        eggsCount:
            (attrs.eggs_count as number) || (attrs.relationships?.eggs?.data as FractalResponseData[])?.length || 0,
        serversCount: (attrs.servers_count as number) || 0,
        createdAt: attrs.created_at as string,
        updatedAt: attrs.updated_at as string,
    };
};

const rawToEgg = (data: FractalResponseData): AdminEgg => {
    const attrs = data.attributes;
    return {
        id: attrs.id as number,
        uuid: attrs.uuid as string,
        name: attrs.name as string,
        description: (attrs.description as string) || '',
        nest: attrs.nest as number,
        author: attrs.author as string,
        dockerImage: attrs.docker_image as string,
        dockerImages: attrs.docker_images as Record<string, string>,
        config: {
            files: attrs.config?.files as Record<string, unknown> | null,
            startup: attrs.config?.startup as string | null,
            stop: attrs.config?.stop as string | null,
            logs: attrs.config?.logs as string | null,
            fileDenylist: attrs.config?.file_denylist as string[] | null,
            extends: attrs.config?.extends as number | null,
        },
        startup: attrs.startup as string,
        script: {
            privileged: attrs.script?.privileged as boolean,
            install: attrs.script?.install as string | null,
            entry: attrs.script?.entry as string,
            container: attrs.script?.container as string,
            extends: attrs.script?.extends as number | null,
        },
        features: attrs.features as string[] | null,
        forceOutgoingIp: attrs.force_outgoing_ip as boolean,
        fileDenylist: attrs.file_denylist as string[] | null,
        createdAt: attrs.created_at as string,
        updatedAt: attrs.updated_at as string,
        variables: (attrs.relationships?.variables?.data as FractalResponseData[])?.map(rawToEggVariable),
    };
};

const rawToEggVariable = (data: FractalResponseData): AdminEggVariable => {
    const attrs = data.attributes;
    return {
        id: attrs.id as number,
        name: attrs.name as string,
        description: attrs.description as string,
        envVariable: attrs.env_variable as string,
        defaultValue: attrs.default_value as string,
        userViewable: attrs.user_viewable as boolean,
        userEditable: attrs.user_editable as boolean,
        rules: attrs.rules as string,
        createdAt: attrs.created_at as string,
        updatedAt: attrs.updated_at as string,
    };
};

export const getNests = (params?: QueryBuilderParams): Promise<PaginatedResult<AdminNest>> =>
    new Promise((resolve, reject) => {
        http.get('/api/application/nests', {
            params: withQueryBuilderParams(params),
        })
            .then(({ data }) =>
                resolve({
                    items: (data.data || []).map(rawToNest),
                    pagination: getPaginationSet(data.meta.pagination),
                }),
            )
            .catch(reject);
    });

export const getNest = (id: number): Promise<AdminNest> =>
    new Promise((resolve, reject) => {
        http.get(`/api/application/nests/${id}`)
            .then(({ data }) => resolve(rawToNest(data)))
            .catch(reject);
    });

export interface CreateNestData {
    name: string;
    description?: string;
}

export const createNest = (data: CreateNestData): Promise<AdminNest> =>
    new Promise((resolve, reject) => {
        http.post('/api/application/nests', data)
            .then(({ data: resp }) => resolve(rawToNest(resp)))
            .catch(reject);
    });

export const updateNest = (id: number, data: Partial<CreateNestData>): Promise<AdminNest> =>
    new Promise((resolve, reject) => {
        http.patch(`/api/application/nests/${id}`, data)
            .then(({ data: resp }) => resolve(rawToNest(resp)))
            .catch(reject);
    });

export const deleteNest = (id: number): Promise<void> => http.delete(`/api/application/nests/${id}`);

export const updateNestIcon = (id: number, file: File): Promise<string | null> =>
    new Promise((resolve, reject) => {
        const formData = new FormData();
        formData.append('icon_file', file);
        http.post(`/api/application/nests/${id}/icon`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        })
            .then(({ data }) => resolve(data.icon as string | null))
            .catch(reject);
    });

export const removeNestIcon = (id: number): Promise<void> =>
    new Promise((resolve, reject) => {
        http.post(`/api/application/nests/${id}/icon`, { remove: true })
            .then(() => resolve())
            .catch(reject);
    });

export const getNestEggs = (nestId: number, params?: QueryBuilderParams): Promise<PaginatedResult<AdminEgg>> =>
    new Promise((resolve, reject) => {
        http.get(`/api/application/nests/${nestId}/eggs`, {
            params: withQueryBuilderParams(params),
        })
            .then(({ data }) =>
                resolve({
                    items: (data.data || []).map(rawToEgg),
                    pagination: getPaginationSet(data.meta.pagination),
                }),
            )
            .catch(reject);
    });

export const getEgg = (nestId: number, eggId: number): Promise<AdminEgg> =>
    new Promise((resolve, reject) => {
        http.get(`/api/application/nests/${nestId}/eggs/${eggId}`)
            .then(({ data }) => resolve(rawToEgg(data)))
            .catch(reject);
    });

export interface CreateEggData {
    name: string;
    description?: string | null;
    features?: string[] | null;
    docker_images: Record<string, string>;
    startup: string;
    config_from?: number | null;
    config_stop?: string | null;
    config_startup?: string | null;
    config_logs?: string | null;
    config_files?: string | null;
    update_url?: string | null;
    force_outgoing_ip?: boolean;
    file_denylist?: string[] | null;
}

export const createEgg = (nestId: number, data: CreateEggData): Promise<AdminEgg> =>
    new Promise((resolve, reject) => {
        http.post(`/api/application/nests/${nestId}/eggs`, data)
            .then(({ data: resp }) => resolve(rawToEgg(resp)))
            .catch(reject);
    });

export const updateEgg = (nestId: number, eggId: number, data: Partial<CreateEggData>): Promise<AdminEgg> =>
    new Promise((resolve, reject) => {
        http.patch(`/api/application/nests/${nestId}/eggs/${eggId}`, data)
            .then(({ data: resp }) => resolve(rawToEgg(resp)))
            .catch(reject);
    });

export const deleteEgg = (nestId: number, eggId: number): Promise<void> =>
    http.delete(`/api/application/nests/${nestId}/eggs/${eggId}`);

export interface CreateEggVariableData {
    name: string;
    description?: string;
    env_variable: string;
    default_value?: string;
    user_viewable?: boolean;
    user_editable?: boolean;
    rules?: string;
}

export const getEggVariables = (nestId: number, eggId: number): Promise<AdminEggVariable[]> =>
    new Promise((resolve, reject) => {
        http.get(`/api/application/nests/${nestId}/eggs/${eggId}/variables`)
            .then(({ data }) => resolve((data.data || []).map(rawToEggVariable)))
            .catch(reject);
    });

export const getEggVariable = (nestId: number, eggId: number, variableId: number): Promise<AdminEggVariable> =>
    new Promise((resolve, reject) => {
        http.get(`/api/application/nests/${nestId}/eggs/${eggId}/variables/${variableId}`)
            .then(({ data }) => resolve(rawToEggVariable(data)))
            .catch(reject);
    });

export const createEggVariable = (
    nestId: number,
    eggId: number,
    data: CreateEggVariableData,
): Promise<AdminEggVariable> =>
    new Promise((resolve, reject) => {
        http.post(`/api/application/nests/${nestId}/eggs/${eggId}/variables`, data)
            .then(({ data: resp }) => resolve(rawToEggVariable(resp)))
            .catch(reject);
    });

export const updateEggVariable = (
    nestId: number,
    eggId: number,
    variableId: number,
    data: Partial<CreateEggVariableData>,
): Promise<AdminEggVariable> =>
    new Promise((resolve, reject) => {
        http.patch(`/api/application/nests/${nestId}/eggs/${eggId}/variables/${variableId}`, data)
            .then(({ data: resp }) => resolve(rawToEggVariable(resp)))
            .catch(reject);
    });

export const deleteEggVariable = (nestId: number, eggId: number, variableId: number): Promise<void> =>
    http.delete(`/api/application/nests/${nestId}/eggs/${eggId}/variables/${variableId}`);
