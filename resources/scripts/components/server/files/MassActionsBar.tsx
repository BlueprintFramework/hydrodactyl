import { useEffect, useState } from 'react';
import compressFiles from '@/api/server/files/compressFiles';
import deleteFiles from '@/api/server/files/deleteFiles';
import { Dialog } from '@/components/elements/dialog';
import Spinner from '@/components/elements/Spinner';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import FadeTransition from '@/components/elements/transitions/FadeTransition';
import RenameFileModal from '@/components/server/files/RenameFileModal';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/I18nProvider';
import useFileManagerSwr from '@/plugins/useFileManagerSwr';
import useFlash from '@/plugins/useFlash';
import { ServerContext } from '@/state/server';

const MassActionsBar = () => {
    const { t } = useTranslation();
    const uuid = ServerContext.useStoreState((state) => state.server.data?.uuid);

    const { mutate } = useFileManagerSwr();
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const [loading, setLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [showConfirm, setShowConfirm] = useState(false);
    const [showMove, setShowMove] = useState(false);
    const directory = ServerContext.useStoreState((state) => state.files.directory);

    const selectedFiles = ServerContext.useStoreState((state) => state.files.selectedFiles);
    const setSelectedFiles = ServerContext.useStoreActions((actions) => actions.files.setSelectedFiles);

    useEffect(() => {
        if (!loading) setLoadingMessage('');
    }, [loading]);

    const onClickCompress = () => {
        setLoading(true);
        clearFlashes('files');
        setLoadingMessage(t('server.files.archiving'));

        compressFiles(uuid, directory, selectedFiles)
            .then(() => mutate())
            .then(() => setSelectedFiles([]))
            .catch((error) => clearAndAddHttpError({ key: 'files', error }))
            .then(() => setLoading(false));
    };

    const onClickConfirmDeletion = () => {
        setLoading(true);
        setShowConfirm(false);
        clearFlashes('files');
        setLoadingMessage(t('server.files.deleting'));

        deleteFiles(uuid, directory, selectedFiles)
            .then(async () => {
                await mutate((files) => files?.filter((f) => selectedFiles.indexOf(f.name) < 0), false);
                setSelectedFiles([]);
            })
            .catch(async (error) => {
                await mutate();
                clearAndAddHttpError({ key: 'files', error });
            })
            .then(() => setLoading(false));
    };

    return (
        <div className={`pointer-events-none fixed bottom-0 z-[9997] left-0 right-0 flex justify-center`}>
            <SpinnerOverlay visible={loading} size={'large'} fixed>
                {loadingMessage}
            </SpinnerOverlay>
            <Dialog.Confirm
                title={t('server.files.delete_files_title')}
                open={showConfirm}
                confirm={t('common.delete')}
                onClose={() => setShowConfirm(false)}
                onConfirmed={onClickConfirmDeletion}
                loading={loading}
            >
                <p className={'mb-2'}>
                    {t('server.files.delete_confirm_prefix')}&nbsp;
                    <span className={'font-semibold text-zinc-50'}>
                        {t('server.files.files_count', { count: selectedFiles.length })}
                    </span>
                    {t('server.files.delete_confirm_suffix')}
                </p>
                {selectedFiles.slice(0, 15).map((file) => (
                    <li key={file}>{file}</li>
                ))}
                {selectedFiles.length > 15 && (
                    <li>{t('server.files.delete_others', { count: selectedFiles.length - 15 })}</li>
                )}
            </Dialog.Confirm>
            {showMove && (
                <RenameFileModal
                    files={selectedFiles}
                    visible
                    appear
                    useMoveTerminology
                    onDismissed={() => setShowMove(false)}
                />
            )}
            <FadeTransition duration='duration-75' show={selectedFiles.length > 0} appear unmount>
                <div
                    className={
                        'pointer-events-none fixed bottom-0 left-0 right-0 mb-[calc(4rem+env(safe-area-inset-bottom))] lg:mb-6 flex justify-center w-full z-50'
                    }
                >
                    <div className={`flex items-center space-x-4 pointer-events-auto rounded-sm p-4 bg-black/50`}>
                        <Button onClick={() => setShowMove(true)} disabled={loading}>
                            {loading && loadingMessage === t('server.files.moving') && <Spinner size='small' />}
                            {t('server.files.move')}
                        </Button>
                        <Button onClick={onClickCompress} disabled={loading}>
                            {loading && loadingMessage === t('server.files.archiving') && <Spinner size='small' />}
                            {t('server.files.archive')}
                        </Button>
                        <Button variant='attention' onClick={() => setShowConfirm(true)} disabled={loading}>
                            {loading && loadingMessage === t('server.files.deleting') && <Spinner size='small' />}
                            {t('common.delete')}
                        </Button>
                    </div>
                </div>
            </FadeTransition>
        </div>
    );
};

export default MassActionsBar;
