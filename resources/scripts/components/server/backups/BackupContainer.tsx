import { ArrowDownToLine, Plus } from '@gravity-ui/icons';
import { useStoreState } from 'easy-peasy';
import type { FormikHelpers } from 'formik';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import deleteAllServerBackups from '@/api/server/backups/deleteAllServerBackups';
import getServerBackups, { Context as ServerBackupContext } from '@/api/swr/getServerBackups';
import Can from '@/components/elements/Can';
import Pagination from '@/components/elements/Pagination';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import VirtualizedList from '@/components/elements/VirtualizedList';
import FlashMessageRender from '@/components/FlashMessageRender';
import { SocketEvent } from '@/components/server/events';
import ServerHeader from '@/components/server/header/ServerHeader';
import { Button } from '@/components/ui/button';
import useFlash from '@/plugins/useFlash';
import useWebsocketEvent from '@/plugins/useWebsocketEvent';
import type { ApplicationStore } from '@/state';
import { ServerContext } from '@/state/server';
import BackupItem from './BackupItem';
import BackupStats from './components/BackupStats';
// import BulkActionBar from './components/BulkActionBar';
import ConfirmPasswordModal from './components/ConfirmPasswordModal';
import CreateBackupModal from './components/CreateBackupModal';
import { useUnifiedBackups } from './useUnifiedBackups';

// Context to share live backup progress across components
export const LiveProgressContext = createContext<
    Record<
        string,
        {
            status: string;
            progress: number;
            message: string;
            canRetry: boolean;
            lastUpdated: string;
            completed: boolean;
            isDeletion: boolean;
            backupName?: string;
        }
    >
>({});

interface BackupValues {
    name: string;
    ignored: string;
    isLocked: boolean;
}

const BackupContainer = () => {
    const { setPage } = useContext(ServerBackupContext);
    const { clearFlashes, clearAndAddHttpError, addFlash } = useFlash();
    const liveProgress = useContext(LiveProgressContext);
    const [createModalVisible, setCreateModalVisible] = useState(false);
    const [deleteAllModalVisible, setDeleteAllModalVisible] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Bulk operations state
    const [selectedBackups, setSelectedBackups] = useState<Set<string>>(new Set());
    const [bulkDeleteModalVisible, setBulkDeleteModalVisible] = useState(false);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);

    const hasTwoFactor = useStoreState((state: ApplicationStore) => state.user.data?.useTotp || false);

    const { backups, backupCount, storage, pagination, error, isValidating, createBackup, retryBackup, refresh } =
        useUnifiedBackups();

    const uuid = ServerContext.useStoreState((state) => state.server.data?.uuid);
    const backupLimit = ServerContext.useStoreState((state) => state.server.data?.featureLimits.backups);
    const backupStorageLimit = ServerContext.useStoreState((state) => state.server.data?.featureLimits.backupStorageMb);

    // Check if any backup operation is in progress
    const hasActiveOperation = Object.values(liveProgress).some((op) => !op.completed);

    const submitBackup = async (values: BackupValues, { setSubmitting }: FormikHelpers<BackupValues>) => {
        clearFlashes('backups:create');

        try {
            await createBackup(values.name, values.ignored, values.isLocked);
            clearFlashes('backups');
            clearFlashes('backups:create');
            setSubmitting(false);
            setCreateModalVisible(false);
        } catch (error) {
            clearAndAddHttpError({ key: 'backups:create', error });
            setSubmitting(false);
        }
    };

    const handleDeleteAll = async (password: string, totpCode?: string) => {
        setIsDeleting(true);

        try {
            await deleteAllServerBackups(uuid, password, hasTwoFactor, totpCode || '');
            toast.success('All backups and repositories are being deleted. This may take a few minutes.');
            setDeleteAllModalVisible(false);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to delete backups.');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleBulkDelete = async (password: string, totpCode?: string) => {
        setIsBulkDeleting(true);
        clearFlashes('backups:bulk_delete');

        try {
            const http = (await import('@/api/http')).default;
            await http.post(`/api/client/servers/${uuid}/backups/bulk-delete`, {
                backup_uuids: Array.from(selectedBackups),
                password,
                ...(hasTwoFactor && totpCode ? { totp_code: totpCode } : {}),
            });

            addFlash({
                key: 'backups',
                type: 'success',
                message: `${selectedBackups.size} backup${selectedBackups.size > 1 ? 's are' : ' is'} being deleted.`,
            });

            setBulkDeleteModalVisible(false);
            setSelectedBackups(new Set());
            await refresh();
        } catch (error) {
            clearAndAddHttpError({ key: 'backups:bulk_delete', error });
        } finally {
            setIsBulkDeleting(false);
        }
    };

    // Bulk selection handlers
    const toggleBackupSelection = (backupUuid: string) => {
        setSelectedBackups((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(backupUuid)) {
                newSet.delete(backupUuid);
            } else {
                newSet.add(backupUuid);
            }
            return newSet;
        });
    };

    const _toggleSelectAll = () => {
        const selectableBackups = backups.filter((b) => b.status === 'completed' && b.isSuccessful && !b.isLiveOnly);
        if (selectedBackups.size === selectableBackups.length) {
            setSelectedBackups(new Set());
        } else {
            setSelectedBackups(new Set(selectableBackups.map((b) => b.uuid)));
        }
    };

    // Get backups that can be selected (completed and not active)
    const selectableBackups = useMemo(
        () => backups.filter((b) => b.status === 'completed' && b.isSuccessful && !b.isLiveOnly),
        [backups],
    );
    const selectableBackupUuids = useMemo(() => new Set(selectableBackups.map((b) => b.uuid)), [selectableBackups]);

    useEffect(() => {
        if (!error) {
            clearFlashes('backups');
            return;
        }
        clearAndAddHttpError({ error, key: 'backups' });
    }, [error, clearAndAddHttpError, clearFlashes]);

    const isLoading = !backups || (error && isValidating);

    return (
        <ServerContentBlock className='p-0!' title={'Backups'}>
            <ServerHeader />
            <FlashMessageRender byKey={'backups'} />
            {isLoading ? (
                <div className='flex items-center justify-center py-12'>
                    <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-brand'></div>
                </div>
            ) : (
                <>
                    <Can action={'backup.create'}>
                        <div className='px-2 pt-2 sm:px-14 sm:pt-14 flex flex-col sm:flex-row items-center gap-4'>
                            <div className='flex gap-2'>
                                {backupCount > 0 && (
                                    <Button
                                        variant='secondary'
                                        onClick={() => setDeleteAllModalVisible(true)}
                                        disabled={hasActiveOperation}
                                    >
                                        <svg
                                            className='w-4 h-4 mr-2'
                                            fill='none'
                                            viewBox='0 0 24 24'
                                            stroke='currentColor'
                                            role='img'
                                            aria-label='Delete'
                                        >
                                            <path
                                                strokeLinecap='round'
                                                strokeLinejoin='round'
                                                strokeWidth={2}
                                                d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                                            />
                                        </svg>
                                        Delete All
                                    </Button>
                                )}
                                {(backupLimit === null || backupLimit > backupCount) &&
                                    (!backupStorageLimit || !storage?.is_over_limit) && (
                                        <Button
                                            variant='secondary'
                                            className='gap-2'
                                            onClick={() => setCreateModalVisible(true)}
                                            disabled={hasActiveOperation}
                                        >
                                            <Plus width={22} height={22} className='w-4 h-4' fill='currentColor' />
                                            New Backup
                                        </Button>
                                    )}
                            </div>
                            <BackupStats
                                backupCount={backupCount}
                                backupLimit={backupLimit}
                                storage={storage}
                                backupStorageLimit={backupStorageLimit}
                            />
                        </div>
                    </Can>

                    {createModalVisible && (
                        <CreateBackupModal
                            visible={createModalVisible}
                            onDismissed={() => setCreateModalVisible(false)}
                            onSubmit={submitBackup}
                        />
                    )}

                    <ConfirmPasswordModal
                        open={deleteAllModalVisible}
                        onClose={() => setDeleteAllModalVisible(false)}
                        onConfirmed={handleDeleteAll}
                        title='Delete All Backups'
                        flashKey='backups'
                        loading={isDeleting}
                        description={`You are about to permanently delete ${backupCount} ${backupCount === 1 ? 'backup' : 'backups'} and completely destroy the backup repository for this server.`}
                        warningItems={[
                            'All backup data will be permanently deleted',
                            'Locked backups will also be deleted',
                            'The entire backup repository will be destroyed',
                            'This operation may take several minutes to complete',
                            'You will not be able to restore any of these backups',
                        ]}
                        confirmText='Delete All Backups'
                    />

                    <ConfirmPasswordModal
                        open={bulkDeleteModalVisible}
                        onClose={() => setBulkDeleteModalVisible(false)}
                        onConfirmed={handleBulkDelete}
                        title='Delete Selected Backups'
                        flashKey='backups:bulk_delete'
                        loading={isBulkDeleting}
                        description={`You are about to permanently delete ${selectedBackups.size} backup${selectedBackups.size > 1 ? 's' : ''}. This action cannot be undone.`}
                        warningItems={[
                            'The selected backup files and their snapshots will be permanently deleted. You will not be able to restore them.',
                        ]}
                        confirmText={`Delete ${selectedBackups.size} Backup${selectedBackups.size > 1 ? 's' : ''}`}
                    />

                    <div className='px-2 sm:px-14'>
                        {backups.length === 0 ? (
                            <div className='flex flex-col items-center justify-center min-h-[60vh] py-12 px-4'>
                                <div className='text-center'>
                                    <div className='w-16 h-16 mx-auto mb-4 rounded-full bg-[#ffffff11] flex items-center justify-center'>
                                        <ArrowDownToLine
                                            width={22}
                                            height={22}
                                            className='w-6 h-6 text-zinc-400'
                                            fill=' currentColor'
                                        />
                                    </div>
                                    <h3 className='text-lg font-medium text-zinc-200 mb-2'>
                                        {backupLimit === 0 ? 'Backups unavailable' : 'No backups found'}
                                    </h3>
                                    <p className='text-sm text-zinc-400 max-w-sm'>
                                        {backupLimit === 0
                                            ? 'Backups cannot be created for this server.'
                                            : 'Your server does not have any backups. Create one to get started.'}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <>
                                <VirtualizedList
                                    items={backups}
                                    renderItem={(backup) => (
                                        <BackupItem
                                            backup={backup}
                                            isSelected={selectedBackups.has(backup.uuid)}
                                            onToggleSelect={() => toggleBackupSelection(backup.uuid)}
                                            isSelectable={selectableBackupUuids.has(backup.uuid)}
                                            retryBackup={retryBackup}
                                        />
                                    )}
                                    estimateSize={() => 120}
                                    gap={12}
                                    className='pt-2'
                                />

                                {pagination?.currentPage && pagination.totalPages && pagination.totalPages > 1 && (
                                    <Pagination data={{ items: backups, pagination }} onPageSelect={setPage}>
                                        {() => null}
                                    </Pagination>
                                )}
                            </>
                        )}
                    </div>
                </>
            )}
        </ServerContentBlock>
    );
};

const BackupContainerWrapper = () => {
    const [page, setPage] = useState<number>(1);
    const { mutate } = getServerBackups();
    const [liveProgress, setLiveProgress] = useState<
        Record<
            string,
            {
                status: string;
                progress: number;
                message: string;
                canRetry: boolean;
                lastUpdated: string;
                completed: boolean;
                isDeletion: boolean;
                backupName?: string;
            }
        >
    >({});

    // Single websocket listener for the entire page
    const handleBackupStatus = useCallback(
        (rawData: unknown) => {
            let data: Record<string, unknown> | string;
            try {
                if (typeof rawData === 'string') {
                    data = JSON.parse(rawData);
                } else {
                    data = rawData;
                }
            } catch (_error) {
                return;
            }

            const backup_uuid = data?.backup_uuid;
            if (!backup_uuid) {
                return;
            }

            const { status, progress, message, timestamp, operation, error: errorMsg, name } = data;

            const can_retry = status === 'failed' && operation === 'create';
            const last_updated_at = timestamp ? new Date(timestamp * 1000).toISOString() : new Date().toISOString();
            const isDeletionOperation = operation === 'delete' || data.deleted === true;

            setLiveProgress((prevProgress) => {
                const currentState = prevProgress[backup_uuid];
                const newProgress = progress || 0;
                const isCompleted = status === 'completed' && newProgress === 100;
                const displayMessage = errorMsg ? `${message || 'Operation failed'}: ${errorMsg}` : message || '';

                if (currentState?.completed && !isCompleted) {
                    return prevProgress;
                }

                if (
                    currentState &&
                    !isCompleted &&
                    currentState.lastUpdated >= last_updated_at &&
                    currentState.progress >= newProgress
                ) {
                    return prevProgress;
                }

                return {
                    ...prevProgress,
                    [backup_uuid]: {
                        status,
                        progress: newProgress,
                        message: displayMessage,
                        canRetry: can_retry || false,
                        lastUpdated: last_updated_at,
                        completed: isCompleted,
                        isDeletion: isDeletionOperation,
                        backupName: name || currentState?.backupName,
                    },
                };
            });

            if (status === 'completed' && progress === 100) {
                if (isDeletionOperation) {
                    // Optimistically remove the deleted backup from SWR cache immediately
                    // note: this is incredibly buggy sometimes, somebody please refactor how "live" backups work. - ellie
                    // Changed this to use "revalidate: false" so the optimistic update persists - tyr
                    mutate(
                        (currentData) => {
                            if (!currentData) return currentData;
                            return {
                                ...currentData,
                                items: currentData.items.filter((b) => b.uuid !== backup_uuid),
                                backupCount: Math.max(0, (currentData.backupCount || 0) - 1),
                            };
                        },
                        { revalidate: false },
                    );

                    // Remove from live progress immediately
                    setLiveProgress((prev) => {
                        const updated = { ...prev };
                        delete updated[backup_uuid];
                        return updated;
                    });
                } else {
                    // For new backups, wait for them to appear in the API
                    mutate();
                    const checkForBackup = async (attempts = 0) => {
                        if (attempts > 10) {
                            setLiveProgress((prev) => {
                                const updated = { ...prev };
                                delete updated[backup_uuid];
                                return updated;
                            });
                            return;
                        }

                        // Force fresh data
                        const currentBackups = await mutate();
                        const backupExists = currentBackups?.items?.some((b) => b.uuid === backup_uuid);

                        if (backupExists) {
                            setLiveProgress((prev) => {
                                const updated = { ...prev };
                                delete updated[backup_uuid];
                                return updated;
                            });
                        } else {
                            setTimeout(() => checkForBackup(attempts + 1), 1000);
                        }
                    };

                    setTimeout(() => checkForBackup(), 1000);
                }
            }
        },
        [mutate],
    );

    useWebsocketEvent(SocketEvent.BACKUP_STATUS, handleBackupStatus);

    return (
        <LiveProgressContext.Provider value={liveProgress}>
            <ServerBackupContext.Provider value={{ page, setPage }}>
                <BackupContainer />
            </ServerBackupContext.Provider>
        </LiveProgressContext.Provider>
    );
};

export default BackupContainerWrapper;
