import { toPaginatedSet } from '@definitions/helpers';
import type { ActivityLog } from '@definitions/user';
import { Transformers } from '@definitions/user';
import type { AxiosError } from 'axios';
import type { SWRConfiguration } from 'swr';
import useSWR from 'swr';

import type { PaginatedResult, QueryBuilderParams } from '@/api/http';
import http, { withQueryBuilderParams } from '@/api/http';
import { getGlobalDaemonType } from '@/api/server/getServer';
import useFilteredObject from '@/plugins/useFilteredObject';
import { useServerSWRKey } from '@/plugins/useSWRKey';
import { ServerContext } from '@/state/server';

export type ActivityLogFilters = QueryBuilderParams<'event' | 'ip' | 'search' | 'after', 'timestamp'>;

const useActivityLogs = (
    filters?: ActivityLogFilters,
    config?: SWRConfiguration<PaginatedResult<ActivityLog>, AxiosError>,
) => {
    const uuid = ServerContext.useStoreState((state) => state.server.data?.uuid);
    const daemonType = getGlobalDaemonType();
    const key = useServerSWRKey(['activity', useFilteredObject(filters || {})]);

    return useSWR<PaginatedResult<ActivityLog>>(
        key,
        async () => {
            const { data } = await http.get(`/api/client/servers/${daemonType}/${uuid}/activity`, {
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

/**
 * Fetches the distinct event types present in the server's activity log so the
 * event-type filter is not restricted to the currently visible page of results.
 */
const useActivityEvents = (config?: SWRConfiguration<string[], AxiosError>) => {
    const uuid = ServerContext.useStoreState((state) => state.server.data?.uuid);
    const daemonType = getGlobalDaemonType();
    const key = useServerSWRKey(['activity', 'events']);

    return useSWR<string[]>(
        key,
        async () => {
            const { data } = await http.get(`/api/client/servers/${daemonType}/${uuid}/activity/events`);
            return data;
        },
        config,
    );
};

/**
 * Fetches every activity log entry matching the given filters by paging
 * through the API in large batches. Backend responses are capped at 100 items
 * per page, so this loops until the full (filtered) dataset has been collected.
 * Used by the export action so the entire matching dataset can be downloaded
 * rather than just the currently visible page.
 */
const fetchAllActivityLogs = async (
    uuid: string,
    daemonType: string,
    filters?: ActivityLogFilters,
): Promise<ActivityLog[]> => {
    const perPage = 100;
    const items: ActivityLog[] = [];

    let page = 1;
    while (true) {
        const { data } = await http.get(`/api/client/servers/${daemonType}/${uuid}/activity`, {
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
