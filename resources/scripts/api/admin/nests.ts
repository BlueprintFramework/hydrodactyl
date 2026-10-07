import http from '@/api/http';

export interface AdminNest {
    id: number;
    uuid: string;
    author: string;
    name: string;
    description: string | null;
    eggs_count: number;
    servers_count: number;
}

export interface NestEgg {
    id: number;
    uuid: string;
    name: string;
    description: string | null;
    author: string;
    servers_count: number;
}

export interface AdminNestDetail {
    id: number;
    uuid: string;
    author: string;
    name: string;
    description: string | null;
    eggs: NestEgg[];
}

export interface NestValues {
    name: string;
    description: string;
}

export interface AdminEgg {
    id: number;
    uuid: string;
    author: string;
    name: string;
    description: string | null;
    startup: string;
    docker_images: string;
    force_outgoing_ip: boolean;
    features: string[];
    config_from: number | null;
    config_stop: string | null;
    config_logs: string | null;
    config_startup: string | null;
    config_files: string | null;
    nest_id: number;
    nest: { id: number; name: string } | null;
}

export interface EggOption {
    id: number;
    name: string;
    author?: string;
}

export interface AdminEggResponse {
    data: AdminEgg;
    config_from_options: EggOption[];
}

export interface EggValues {
    nest_id?: number;
    name: string;
    description: string;
    startup: string;
    docker_images: string;
    force_outgoing_ip: boolean;
    features: string[];
    config_from: string;
    config_stop: string;
    config_logs: string;
    config_startup: string;
    config_files: string;
}

export interface EggVariable {
    id: number;
    name: string;
    description: string | null;
    env_variable: string;
    default_value: string;
    user_viewable: boolean;
    user_editable: boolean;
    rules: string;
    required: boolean;
}

export interface EggVariableValues {
    name: string;
    description: string;
    env_variable: string;
    default_value: string;
    options: string[];
    rules: string;
}

export interface EggScript {
    id: number;
    name: string;
    script_install: string | null;
    script_is_privileged: boolean;
    script_entry: string;
    script_container: string;
    copy_script_from: number | null;
    copy_from: { id: number; name: string } | null;
}

export interface EggScriptResponse {
    data: EggScript;
    copy_from_options: EggOption[];
    rely_on_script: EggOption[];
}

export interface EggScriptValues {
    script_install: string;
    script_is_privileged: boolean;
    script_entry: string;
    script_container: string;
    copy_script_from: string;
}

const multipart = { headers: { 'Content-Type': 'multipart/form-data' } };

export const getNests = (): Promise<AdminNest[]> => http.get('/admin/api/nests').then(({ data }) => data.data);

export const getNest = (id: number | string): Promise<AdminNestDetail> =>
    http.get(`/admin/api/nests/${id}`).then(({ data }) => data.data);

export const createNest = (values: NestValues): Promise<{ id: number }> =>
    http.post('/admin/api/nests', values).then(({ data }) => data.data);

export const updateNest = (id: number | string, values: NestValues): Promise<void> =>
    http.patch(`/admin/api/nests/${id}`, values).then(() => undefined);

export const deleteNest = (id: number | string): Promise<void> =>
    http.delete(`/admin/api/nests/${id}`).then(() => undefined);

export const importEgg = (formData: FormData): Promise<{ id: number }> =>
    http.post('/admin/api/nests/import', formData, multipart).then(({ data }) => data.data);

export const importEggFromUrl = (values: {
    import_file_url: string;
    import_to_nest: number;
}): Promise<{ id: number }> => http.post('/admin/api/nests/import-url', values).then(({ data }) => data.data);

export const getEgg = (id: number | string): Promise<AdminEggResponse> =>
    http.get(`/admin/api/eggs/${id}`).then(({ data }) => data);

export const createEgg = (values: EggValues): Promise<{ id: number }> =>
    http.post('/admin/api/eggs', values).then(({ data }) => data.data);

export const updateEgg = (id: number | string, values: EggValues): Promise<void> =>
    http.patch(`/admin/api/eggs/${id}`, values).then(() => undefined);

export const deleteEgg = (id: number | string): Promise<void> =>
    http.delete(`/admin/api/eggs/${id}`).then(() => undefined);

export const importEggUpdate = (id: number | string, formData: FormData): Promise<void> =>
    http.post(`/admin/api/eggs/${id}/import`, formData, multipart).then(() => undefined);

export const getEggVariables = (
    id: number | string,
): Promise<{ data: EggVariable[]; egg: { id: number; name: string; nest_id: number } }> =>
    http.get(`/admin/api/eggs/${id}/variables`).then(({ data }) => data);

export const createEggVariable = (id: number | string, values: EggVariableValues): Promise<void> =>
    http.post(`/admin/api/eggs/${id}/variables`, values).then(() => undefined);

export const updateEggVariable = (
    eggId: number | string,
    variableId: number,
    values: EggVariableValues,
): Promise<void> => http.patch(`/admin/api/eggs/${eggId}/variables/${variableId}`, values).then(() => undefined);

export const deleteEggVariable = (eggId: number | string, variableId: number): Promise<void> =>
    http.delete(`/admin/api/eggs/${eggId}/variables/${variableId}`).then(() => undefined);

export const getEggScripts = (id: number | string): Promise<EggScriptResponse> =>
    http.get(`/admin/api/eggs/${id}/scripts`).then(({ data }) => data);

export const updateEggScripts = (id: number | string, values: EggScriptValues): Promise<void> =>
    http.patch(`/admin/api/eggs/${id}/scripts`, values).then(() => undefined);
