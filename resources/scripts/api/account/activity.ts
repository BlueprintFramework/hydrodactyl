import { toPaginatedSet } from '@definitions/helpers';
import { type ActivityLog, Transformers } from '@definitions/user';
import type { AxiosError } from 'axios';
import type { SWRConfiguration } from 'swr';
import useSWR from 'swr';

import http, { type PaginatedResult, type QueryBuilderParams, withQueryBuilderParams } from '@/api/http';

import useFilteredObject from '@/plugins/useFilteredObject';
import { useUserSWRKey } from '@/plugins/useSWRKey';

export type ActivityLogFilters = QueryBuilderParams<'event' | 'ip' | 'search' | 'after', 'timestamp'>;

const useActivityLogs = (
    filters?: ActivityLogFilters,
    config?: SWRConfiguration<PaginatedResult<ActivityLog>, AxiosError>,
) => {
    const key = useUserSWRKey(['account', 'activity', JSON.stringify(useFilteredObject(filters || {}))]);

    return useSWR<PaginatedResult<ActivityLog>>(
        key,
        async () => {
            const { data } = await http.get('/api/client/account/activity', {
                params: {
                    ...withQueryBuilderParams(filters),
                    include: ['actor'],
                },
            });

            return toPaginatedSet(data, Transformers.toActivityLog);
        },
        { revalidateOnMount: false, ...(config || {}) },
    );
};

const useActivityEvents = (config?: SWRConfiguration<string[], AxiosError>) => {
    const key = useUserSWRKey(['account', 'activity', 'events']);

    return useSWR<string[]>(
        key,
        async () => {
            const { data } = await http.get('/api/client/account/activity/events');
            return data;
        },
        config,
    );
};

const fetchAllActivityLogs = async (filters?: ActivityLogFilters): Promise<ActivityLog[]> => {
    const perPage = 100;
    const items: ActivityLog[] = [];

    let page = 1;
    while (true) {
        const { data } = await http.get('/api/client/account/activity', {
            params: {
                ...withQueryBuilderParams({ ...filters, page }),
                per_page: perPage,
                include: ['actor'],
            },
        });

        const set = toPaginatedSet(data, Transformers.toActivityLog);
        items.push(...set.items);

        if (set.items.length === 0 || items.length >= set.pagination.total) {
            break;
        }

        page++;
    }

    return items;
};

export { fetchAllActivityLogs, useActivityEvents, useActivityLogs };
