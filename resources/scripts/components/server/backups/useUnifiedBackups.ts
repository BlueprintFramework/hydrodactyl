import { useContext } from 'react';
import getServerBackups from '@/api/swr/getServerBackups';
import { LiveProgressContext } from './BackupContainer';
import type { UnifiedBackup } from './types';
import { useBackupMutations } from './useBackupMutations';

export const useUnifiedBackups = () => {
    const { data: backups, error, isValidating, mutate } = getServerBackups();

    const liveProgress = useContext(LiveProgressContext);

    const { createBackup, deleteBackup, retryBackup, restoreBackup, renameBackup, toggleBackupLock } =
        useBackupMutations();

    const unifiedBackups: UnifiedBackup[] = [];

    if (backups?.items) {
        for (const backup of backups.items) {
            const live = liveProgress[backup.uuid];

            unifiedBackups.push({
                uuid: backup.uuid,
                name: live?.backupName || backup.name,
                status: live ? (live.status as string) : backup.isSuccessful ? 'completed' : 'failed',
                progress: live ? live.progress : backup.isSuccessful ? 100 : 0,
                message: live ? live.message : backup.isSuccessful ? 'Completed' : 'Failed',
                isSuccessful: backup.isSuccessful,
                isLocked: backup.isLocked,
                isAutomatic: backup.isAutomatic,
                checksum: backup.checksum,
                bytes: backup.bytes,
                createdAt: backup.createdAt,
                completedAt: backup.completedAt,
                canRetry: live ? live.canRetry : backup.canRetry,
                canDelete: !live,
                canDownload: backup.isSuccessful && !live,
                canRestore: backup.isSuccessful && !live,
                isLiveOnly: false,
                isDeletion: live?.isDeletion || false,
            });
        }
    }

    // Add live-only backups (new operations not yet in SWR)
    for (const [backupUuid, live] of Object.entries(liveProgress)) {
        const existsInSwr = unifiedBackups.some((b) => b.uuid === backupUuid);

        if (!existsInSwr && !live.isDeletion) {
            unifiedBackups.push({
                uuid: backupUuid,
                name: live.backupName || live.message || 'Processing...',
                status: live.status as string,
                progress: live.progress,
                message: live.message,
                isSuccessful: false,
                isLocked: false,
                isAutomatic: false,
                checksum: undefined,
                bytes: undefined,
                createdAt: new Date(),
                completedAt: null,
                canRetry: live.canRetry,
                canDelete: false,
                canDownload: false,
                canRestore: false,
                isLiveOnly: true,
                isDeletion: false,
            });
        }
    }

    unifiedBackups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return {
        backups: unifiedBackups,
        backupCount: backups?.backupCount || 0,
        storage: backups?.storage,
        pagination: backups?.pagination,
        error,
        isValidating,
        createBackup,
        deleteBackup,
        retryBackup,
        restoreBackup,
        renameBackup,
        toggleBackupLock,
        refresh: () => mutate(),
    };
};
