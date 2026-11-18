import useSWR from 'swr';
import getServerSubusers from '@/api/server/users/getServerSubusers';
import { ServerContext } from '@/state/server';
import type { Subuser } from '@/state/server/subusers';

export const getServerSubusersSwrKey = (uuid: string): string => `${uuid}:subusers`;

export default (enabled = true) => {
    const uuid = ServerContext.useStoreState((state) => state.server.data?.uuid);

    return useSWR<Subuser[]>(
        enabled && uuid ? getServerSubusersSwrKey(uuid) : null,
        () => getServerSubusers(uuid as string),
        {
            focusThrottleInterval: 30000,
            revalidateOnMount: false,
            refreshInterval: 0,
            errorRetryCount: 2,
        },
    );
};
