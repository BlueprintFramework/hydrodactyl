import useSWR from 'swr';
import getFileBlocks, { type FileBlock } from '@/api/server/files/getFileBlocks';
import { ServerContext } from '@/state/server';

export const getFileBlocksSwrKey = (uuid: string): string => `${uuid}:file-blocks`;

export default (enabled = true) => {
    const uuid = ServerContext.useStoreState((state) => state.server.data?.uuid);

    return useSWR<FileBlock[]>(
        enabled && uuid ? getFileBlocksSwrKey(uuid) : null,
        () => getFileBlocks(uuid as string),
        {
            focusThrottleInterval: 30000,
            revalidateOnMount: false,
            refreshInterval: 0,
            errorRetryCount: 2,
        },
    );
};
