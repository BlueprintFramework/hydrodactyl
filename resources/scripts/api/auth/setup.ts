import http from '@/api/http';

export interface SetupData {
    email: string;
    username: string;
    name_first: string;
    name_last?: string;
    password: string;
    password_confirmation: string;
}

export interface SetupResponse {
    complete: boolean;
    intended?: string;
}

/**
 * Create the first administrator account through the first-run setup flow.
 * Mirrors the login call: prime the CSRF cookie, then POST to /setup. The
 * backend creates the account, grants admin, and starts the session — so on
 * success the response carries an `intended` path to hard-navigate to.
 */
export default async (data: SetupData): Promise<SetupResponse> => {
    await http.get('/sanctum/csrf-cookie');

    const response = await http.post('/setup', data);

    return {
        complete: response.data?.data?.complete ?? response.data?.complete ?? false,
        intended: response.data?.data?.intended ?? response.data?.intended ?? '/',
    };
};
