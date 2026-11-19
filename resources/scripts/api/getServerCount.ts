import http from '@/api/http';

export type ServerAccessType = 'owner' | 'shared';

/**
 * Total number of servers the signed-in user owns (`owner`) or is a subuser on
 * (`shared`). Only one row is requested: the pagination total carries the count
 * without shipping a page of servers the account page will not render.
 */
export default async (type: ServerAccessType): Promise<number> => {
    const { data } = await http.get('/api/client', {
        params: { type, per_page: 1 },
    });

    return data?.meta?.pagination?.total ?? 0;
};
