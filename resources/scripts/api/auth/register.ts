import http from '@/api/http';

export interface RegisterData {
    email: string;
    username: string;
    name_first: string;
    name_last?: string;
    password: string;
    password_confirmation: string;
    [key: string]: unknown;
}

export interface RegisterResponse {
    complete: boolean;
    intended?: string;
}

export default async (data: RegisterData): Promise<RegisterResponse> => {
    await http.get('/sanctum/csrf-cookie');

    const response = await http.post('/auth/register', data);

    return {
        complete: response.data?.data?.complete ?? response.data?.complete ?? false,
        intended: response.data?.data?.intended ?? response.data?.intended ?? '/',
    };
};
