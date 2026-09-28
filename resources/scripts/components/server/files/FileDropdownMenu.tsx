import { BarsPlay, Copy, FileArrowDown, FileZipper, PencilToLine, Shield, TrashBin } from '@gravity-ui/icons';
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
import Can from '@/components/elements/Can';
import { ContextMenuContent, ContextMenuItem } from '@/components/elements/ContextMenu';
import { Dialog } from '@/components/elements/dialog';
import ChmodFileModal from '@/components/server/files/ChmodFileModal';
import RenameFileModal from '@/components/server/files/RenameFileModal';
import { useTranslation } from '@/i18n/I18nProvider';
import useFileManagerSwr from '@/plugins/useFileManagerSwr';
import useFlash from '@/plugins/useFlash';
import { ServerContext } from '@/state/server';

type ModalType = 'rename' | 'move' | 'chmod';

const FileDropdownMenu = ({ file }: { file: FileObject }) => {
    const { t } = useTranslation();
    const [modal, setModal] = useState<ModalType | null>(null);
    const [showConfirmation, setShowConfirmation] = useState(false);

    const uuid = ServerContext.useStoreState((state) => state.server.data?.uuid);
    const { mutate } = useFileManagerSwr();
    const { clearAndAddHttpError, clearFlashes } = useFlash();
    const directory = ServerContext.useStoreState((state) => state.files.directory);

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
            .catch((error) => clearAndAddHttpError({ key: 'files', error }));
    };

    const doUnarchive = () => {
        clearFlashes('files');
        toast.info(t('server.files.unarchiving'));

        decompressFiles(uuid, directory, file.name)
            .then(() => mutate())
            .then(() => toast.success(t('server.files.unarchive_success')))
            .catch((error) => clearAndAddHttpError({ key: 'files', error }));
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
