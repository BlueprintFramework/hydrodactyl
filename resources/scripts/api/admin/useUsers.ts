import useSWR from 'swr';
import { getUser, getUsers, type UserQuery } from '@/api/admin/users';

export const useUsers = (query: UserQuery) =>
    useSWR(['admin:users', query], () => getUsers(query), {
        revalidateOnFocus: false,
        keepPreviousData: true,
    });

export const useUser = (id?: number | string) =>
    useSWR(id ? ['admin:user', id] : null, () => getUser(id as number | string), {
        revalidateOnFocus: false,
    });
