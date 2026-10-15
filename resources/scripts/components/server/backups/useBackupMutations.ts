import { useCallback } from 'react';
import { getGlobalDaemonType } from '@/api/server/getServer';
import getServerBackups from '@/api/swr/getServerBackups';
import { ServerContext } from '@/state/server';

export const useBackupMutations = () => {
    const { mutate } = getServerBackups();
    const uuid = ServerContext.useStoreState((state) => state.server.data?.uuid);
    const daemonType = getGlobalDaemonType();

    const createBackup = useCallback(
        async (name: string, ignored: string, isLocked: boolean) => {
            const { default: createServerBackup } = await import('@/api/server/backups/createServerBackup');
            const result = await createServerBackup(uuid, {
                name,
                ignored,
                isLocked,
            });
            mutate();
            return result;
        },
        [uuid, mutate],
    );

    const deleteBackup = useCallback(
        async (backupUuid: string) => {
            const { deleteServerBackup } = await import('@/api/server/backups');
            const result = await deleteServerBackup(uuid, backupUuid);
            mutate();
            return result;
        },
        [uuid, mutate],
    );

    const retryBackup = useCallback(
        async (backupUuid: string) => {
            const { retryBackup: retryBackupApi } = await import('@/api/server/backups');
            await retryBackupApi(uuid, backupUuid);
            mutate();
        },
        [uuid, mutate],
    );

    const restoreBackup = useCallback(
        async (backupUuid: string) => {
            const { restoreServerBackup } = await import('@/api/server/backups');
            const result = await restoreServerBackup(uuid, backupUuid);
            mutate();
            return result;
        },
        [uuid, mutate],
    );

    const renameBackup = useCallback(
        async (backupUuid: string, newName: string) => {
            const http = (await import('@/api/http')).default;
            await http.post(`/api/client/servers/${daemonType}/${uuid}/backups/${backupUuid}/rename`, {
                name: newName,
            });
            mutate();
        },
        [uuid, mutate, daemonType],
    );

    const toggleBackupLock = useCallback(
        async (backupUuid: string) => {
            const http = (await import('@/api/http')).default;
            await http.post(`/api/client/servers/${daemonType}/${uuid}/backups/${backupUuid}/lock`);
            mutate();
        },
        [uuid, mutate, daemonType],
    );

    return {
        createBackup,
        deleteBackup,
        retryBackup,
        restoreBackup,
        renameBackup,
        toggleBackupLock,
        refresh: mutate,
    };
};
