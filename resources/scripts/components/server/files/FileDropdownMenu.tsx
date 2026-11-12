import { BarsPlay, Copy, FileArrowDown, FileZipper, Lock, PencilToLine, Shield, TrashBin } from '@gravity-ui/icons';
import { join } from 'pathe';
import { memo, useState } from 'react';
import isEqual from 'react-fast-compare';
import { toast } from 'sonner';
import compressFiles from '@/api/server/files/compressFiles';
import copyFile from '@/api/server/files/copyFile';
import decompressFiles from '@/api/server/files/decompressFiles';
import deleteFiles from '@/api/server/files/deleteFiles';
import getFileDownloadUrl from '@/api/server/files/getFileDownloadUrl';
import type { FileObject } from '@/api/server/files/loadDirectory';
import updateFileBlocks from '@/api/server/files/updateFileBlocks';
import Can from '@/components/elements/Can';
import {
    ContextMenuCheckboxItem,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuSub,
    ContextMenuSubContent,
    ContextMenuSubTrigger,
} from '@/components/elements/ContextMenu';
import { Dialog } from '@/components/elements/dialog';
import ChmodFileModal from '@/components/server/files/ChmodFileModal';
import RenameFileModal from '@/components/server/files/RenameFileModal';
import { useTranslation } from '@/i18n/I18nProvider';
import useFileBlocksSwr from '@/plugins/useFileBlocksSwr';
import useFileManagerSwr from '@/plugins/useFileManagerSwr';
import useFlash from '@/plugins/useFlash';
import useServerSubusersSwr from '@/plugins/useServerSubusersSwr';
import { ServerContext } from '@/state/server';

type ModalType = 'rename' | 'move' | 'chmod';

const FileDropdownMenu = ({ file }: { file: FileObject }) => {
    const { t } = useTranslation();
    const [modal, setModal] = useState<ModalType | null>(null);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [savingBlocks, setSavingBlocks] = useState(false);
    const [blocksMenuOpen, setBlocksMenuOpen] = useState(false);

    const uuid = ServerContext.useStoreState((state) => state.server.data?.uuid);
    const permissions = ServerContext.useStoreState((state) => state.server.permissions);
    const canManageBlocks = permissions.includes('*');
    const { mutate } = useFileManagerSwr();
    const { data: subusers, isLoading: loadingSubusers } = useServerSubusersSwr(canManageBlocks && blocksMenuOpen);
    const {
        data: fileBlocks,
        isLoading: loadingBlocks,
        mutate: mutateFileBlocks,
    } = useFileBlocksSwr(canManageBlocks && blocksMenuOpen);
    const { clearAndAddHttpError, clearFlashes } = useFlash();
    const directory = ServerContext.useStoreState((state) => state.files.directory);

    const resolvedSubusers = subusers ?? [];
    const resolvedBlocks = fileBlocks ?? [];
    const blocksLoading = loadingSubusers || loadingBlocks;
    const filePath = join(directory, file.name);
    const blockedUserUuids = resolvedBlocks.filter((block) => block.path === filePath).map((block) => block.userUuid);
    const allBlocked =
        resolvedSubusers.length > 0 && resolvedSubusers.every((subuser) => blockedUserUuids.includes(subuser.uuid));

    const doDeletion = async () => {
        clearFlashes('files');

        await mutate((files) => files?.filter((f) => f.key !== file.key), false);

        deleteFiles(uuid, directory, [file.name]).catch((error) => {
            mutate();
            clearAndAddHttpError({ key: 'files', error });
        });

        setShowConfirmation(false);
    };

    const doCopy = () => {
        clearFlashes('files');
        toast.info(t('server.files.duplicating'));

        copyFile(uuid, join(directory, file.name))
            .then(() => mutate())
            .then(() => toast.success(t('server.files.duplicate_success')))
            .catch((error) => clearAndAddHttpError({ key: 'files', error }));
    };

    const doDownload = () => {
        clearFlashes('files');

        getFileDownloadUrl(uuid, join(directory, file.name))
            .then((url) => {
                // @ts-expect-error this is valid
                window.location = url;
            })
            .catch((error) => clearAndAddHttpError({ key: 'files', error }));
    };

    const doArchive = () => {
        clearFlashes('files');
        toast.info(t('server.files.archiving'));

        compressFiles(uuid, directory, [file.name])
            .then(() => mutate())
            .then(() => toast.success(t('server.files.archive_success')))
            .catch((error: { code?: string }) => {
                clearAndAddHttpError({
                    key: 'files',
                    error: error?.code === 'ECONNABORTED' ? new Error(t('server.files.archive_timeout')) : error,
                });
            });
    };

    const doUnarchive = () => {
        clearFlashes('files');
        toast.info(t('server.files.unarchiving'));

        decompressFiles(uuid, directory, file.name)
            .then(() => mutate())
            .then(() => toast.success(t('server.files.unarchive_success')))
            .catch((error: { code?: string }) => {
                clearAndAddHttpError({
                    key: 'files',
                    error: error?.code === 'ECONNABORTED' ? new Error(t('server.files.unarchive_timeout')) : error,
                });
            });
    };

    const setBlockedUsers = (userUuids: string[]) => {
        if (!uuid || savingBlocks) {
            return;
        }

        setSavingBlocks(true);
        clearFlashes('files');

        updateFileBlocks(uuid, filePath, userUuids)
            .then((blocks) => {
                mutateFileBlocks(
                    (current) => [...(current ?? []).filter((block) => block.path !== filePath), ...blocks],
                    false,
                );
                toast.success(t('server.files.block_updated'));
            })
            .catch((error) => clearAndAddHttpError({ key: 'files', error }))
            .finally(() => setSavingBlocks(false));
    };

    const toggleUserBlock = (userUuid: string, checked: boolean) => {
        const next = checked
            ? [...new Set([...blockedUserUuids, userUuid])]
            : blockedUserUuids.filter((id) => id !== userUuid);

        setBlockedUsers(next);
    };

    const toggleAllBlocks = (checked: boolean) => {
        setBlockedUsers(checked ? resolvedSubusers.map((subuser) => subuser.uuid) : []);
    };

    return (
        <>
            <Dialog.Confirm
                open={showConfirmation}
                onClose={() => setShowConfirmation(false)}
                title={t('server.files.delete_title', {
                    type: file.isFile ? t('server.files.file') : t('server.files.directory'),
                })}
                confirm={t('common.delete')}
                onConfirmed={doDeletion}
            >
                {t('server.files.delete_message_prefix')}
                <span className={'font-semibold text-zinc-50'}> {file.name}</span>{' '}
                {t('server.files.delete_message_suffix')}
            </Dialog.Confirm>
            {modal ? (
                modal === 'chmod' ? (
                    <ChmodFileModal
                        visible
                        appear
                        files={[{ file: file.name, mode: file.modeBits }]}
                        onDismissed={() => setModal(null)}
                    />
                ) : (
                    <RenameFileModal
                        visible
                        appear
                        files={[file.name]}
                        useMoveTerminology={modal === 'move'}
                        onDismissed={() => setModal(null)}
                    />
                )
            ) : null}
            <ContextMenuContent className='flex flex-col gap-1'>
                <Can action={'file.update'}>
                    <ContextMenuItem className='flex gap-2' onSelect={() => setModal('rename')}>
                        <PencilToLine className='h-4! w-4!' fill='currentColor' />
                        <span>{t('server.files.rename')}</span>
                    </ContextMenuItem>
                    <ContextMenuItem className='flex gap-2' onSelect={() => setModal('move')}>
                        <BarsPlay className='h-4! w-4!' fill='currentColor' />
                        <span>{t('server.files.move')}</span>
                    </ContextMenuItem>
                    <ContextMenuItem className='flex gap-2' onSelect={() => setModal('chmod')}>
                        <Shield className='h-4! w-4!' fill='currentColor' />
                        <span>{t('server.files.permissions')}</span>
                    </ContextMenuItem>
                </Can>
                {file.isFile && (
                    <Can action={'file.create'}>
                        <ContextMenuItem className='flex gap-2' onClick={doCopy}>
                            <Copy className='h-4! w-4!' fill='currentColor' />
                            <span>{t('server.files.duplicate')}</span>
                        </ContextMenuItem>
                    </Can>
                )}
                {file.isArchiveType() ? (
                    <Can action={'file.create'}>
                        <ContextMenuItem
                            className='flex gap-2'
                            onSelect={doUnarchive}
                            title={t('server.files.unarchive')}
                        >
                            <FileZipper className='h-4! w-4!' fill='currentColor' />
                            <span>{t('server.files.unarchive')}</span>
                        </ContextMenuItem>
                    </Can>
                ) : (
                    <Can action={'file.archive'}>
                        <ContextMenuItem className='flex gap-2' onSelect={doArchive}>
                            <FileZipper className='h-4! w-4!' fill='currentColor' />
                            <span>{t('server.files.archive')}</span>
                        </ContextMenuItem>
                    </Can>
                )}
                {file.isFile && (
                    <ContextMenuItem className='flex gap-2' onSelect={doDownload}>
                        <FileArrowDown className='h-4! w-4!' fill='currentColor' />
                        <span>{t('common.download')}</span>
                    </ContextMenuItem>
                )}
                {canManageBlocks && (
                    <>
                        <ContextMenuSeparator />
                        <ContextMenuSub onOpenChange={setBlocksMenuOpen}>
                            <ContextMenuSubTrigger className='flex gap-2'>
                                <Lock className='h-4! w-4!' fill='currentColor' />
                                <span>{t('server.files.block_for')}</span>
                            </ContextMenuSubTrigger>
                            <ContextMenuSubContent className='flex flex-col gap-1 min-w-[16rem]'>
                                {blocksLoading ? (
                                    <div className='px-2 py-1.5 text-sm font-medium text-zinc-300'>
                                        {t('common.loading')}
                                    </div>
                                ) : resolvedSubusers.length === 0 ? (
                                    <div className='px-2 py-1.5 text-sm font-medium text-zinc-300'>
                                        {t('server.files.block_no_subusers')}
                                    </div>
                                ) : (
                                    <>
                                        <ContextMenuCheckboxItem
                                            checked={allBlocked}
                                            disabled={savingBlocks}
                                            onCheckedChange={(checked) => toggleAllBlocks(checked === true)}
                                            onSelect={(event) => event.preventDefault()}
                                        >
                                            {t('server.files.block_all_subusers')}
                                        </ContextMenuCheckboxItem>
                                        <ContextMenuSeparator />
                                        {resolvedSubusers.map((subuser) => (
                                            <ContextMenuCheckboxItem
                                                key={subuser.uuid}
                                                checked={blockedUserUuids.includes(subuser.uuid)}
                                                disabled={savingBlocks}
                                                onCheckedChange={(checked) =>
                                                    toggleUserBlock(subuser.uuid, checked === true)
                                                }
                                                onSelect={(event) => event.preventDefault()}
                                            >
                                                {subuser.username}
                                            </ContextMenuCheckboxItem>
                                        ))}
                                    </>
                                )}
                            </ContextMenuSubContent>
                        </ContextMenuSub>
                    </>
                )}
                <Can action={'file.delete'}>
                    <ContextMenuItem className='flex gap-2' onSelect={() => setShowConfirmation(true)}>
                        <TrashBin className='h-4! w-4!' fill='currentColor' />
                        <span>{t('common.delete')}</span>
                    </ContextMenuItem>
                </Can>
            </ContextMenuContent>
        </>
    );
};

export default memo(FileDropdownMenu, isEqual);
