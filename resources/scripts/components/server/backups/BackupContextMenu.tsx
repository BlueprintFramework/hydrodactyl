import { ArrowDownToLine, Bars, CloudArrowUpIn, Pencil, Shield, TrashBin } from '@gravity-ui/icons';
import { useStoreState } from 'easy-peasy';
import { useEffect, useState } from 'react';
import http, { httpErrorToHuman } from '@/api/http';
import { getServerBackupDownloadUrl } from '@/api/server/backups';
import { getGlobalDaemonType } from '@/api/server/getServer';
import Can from '@/components/elements/Can';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/elements/DropdownMenu';
import { Dialog } from '@/components/elements/dialog';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import { Button } from '@/components/ui/button';
import useFlash from '@/plugins/useFlash';
import type { ApplicationStore } from '@/state';
import { ServerContext } from '@/state/server';
import ConfirmPasswordModal from './components/ConfirmPasswordModal';
import type { BackupContextMenuBackup } from './types';
import { useBackupMutations } from './useBackupMutations';

interface Props {
    backup: BackupContextMenuBackup;
}

const BackupContextMenu = ({ backup }: Props) => {
    const uuid = ServerContext.useStoreState((state) => state.server.data?.uuid);
    const daemonType = getGlobalDaemonType();
    const setServerFromState = ServerContext.useStoreActions((actions) => actions.server.setServerFromState);
    const [modal, setModal] = useState('');
    const [loading, setLoading] = useState(false);
    const [countdown, setCountdown] = useState(5);
    const [newName, setNewName] = useState(backup.name);
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const { renameBackup, toggleBackupLock, refresh } = useBackupMutations();
    const hasTwoFactor = useStoreState((state: ApplicationStore) => state.user.data?.useTotp || false);

    const doDownload = () => {
        setLoading(true);
        clearFlashes('backups');
        getServerBackupDownloadUrl(uuid, backup.uuid)
            .then((url) => {
                // @ts-expect-error this is valid
                window.location = url;
            })
            .catch((error) => {
                clearAndAddHttpError({ key: 'backups', error });
            })
            .then(() => setLoading(false));
    };

    const doDeletion = async (password: string, totpCode?: string) => {
        setLoading(true);
        clearFlashes('backup:delete');

        try {
            await http.delete(`/api/client/servers/${daemonType}/${uuid}/backups/${backup.uuid}`, {
                data: {
                    password,
                    ...(hasTwoFactor && totpCode ? { totp_code: totpCode } : {}),
                },
            });

            setLoading(false);
            setModal('');
            await refresh();
        } catch (error) {
            clearAndAddHttpError({ key: 'backup:delete', error });
            setLoading(false);
        }
    };

    const doRestorationAction = async (password: string, totpCode?: string) => {
        setLoading(true);
        clearFlashes('backup:restore');

        try {
            await http.post(`/api/client/servers/${daemonType}/${uuid}/backups/${backup.uuid}/restore`, {
                password,
                ...(hasTwoFactor && totpCode ? { totp_code: totpCode } : {}),
            });

            setServerFromState((s) => ({
                ...s,
                status: 'restoring_backup',
            }));

            setLoading(false);
            setModal('');
        } catch (error) {
            clearAndAddHttpError({ key: 'backup:restore', error });
            setLoading(false);
        }
    };

    const onLockToggle = async () => {
        if (backup.isLocked && modal !== 'unlock') {
            return setModal('unlock');
        }

        try {
            await toggleBackupLock(backup.uuid);
            setModal('');
        } catch (error) {
            alert(httpErrorToHuman(error));
        }
    };

    const doRename = async () => {
        setLoading(true);
        clearFlashes('backups');

        try {
            await renameBackup(backup.uuid, newName.trim());
            setLoading(false);
            setModal('');
        } catch (error) {
            clearAndAddHttpError({ key: 'backups', error });
            setLoading(false);
            setModal('');
        }
    };

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (modal === 'restore' && countdown > 0) {
            interval = setInterval(() => {
                setCountdown((prev) => prev - 1);
            }, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [modal, countdown]);

    useEffect(() => {
        if (modal === 'restore') {
            setCountdown(5);
        }
    }, [modal]);

    useEffect(() => {
        if (modal === 'rename') {
            setNewName(backup.name);
        }
    }, [modal, backup.name]);

    return (
        <>
            {/* Rename Dialog */}
            <Dialog open={modal === 'rename'} onClose={() => setModal('')} title='Rename Backup'>
                <div className='space-y-4'>
                    <div>
                        <label htmlFor='backup-name' className='block text-sm font-medium text-zinc-200 mb-2'>
                            Backup Name
                        </label>
                        <input
                            id='backup-name'
                            type='text'
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            className='w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-zinc-100 placeholder-zinc-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                            placeholder='Enter backup name...'
                            maxLength={191}
                        />
                    </div>
                </div>

                <Dialog.Footer>
                    <Button onClick={() => setModal('')} variant='secondary'>
                        Cancel
                    </Button>
                    <Button onClick={doRename} disabled={!newName.trim() || newName.trim() === backup.name}>
                        Rename Backup
                    </Button>
                </Dialog.Footer>
            </Dialog>

            {/* Unlock Confirmation */}
            <Dialog.Confirm
                open={modal === 'unlock'}
                onClose={() => setModal('')}
                title={`Unlock "${backup.name}"`}
                onConfirmed={onLockToggle}
            >
                This backup will no longer be protected from automated or accidental deletions.
            </Dialog.Confirm>

            {/* Restore Modal */}
            <ConfirmPasswordModal
                open={modal === 'restore'}
                onClose={() => setModal('')}
                onConfirmed={doRestorationAction}
                title='Restore Backup'
                flashKey='backup:restore'
                loading={loading}
                description={`"${backup.name}" - Your server will be stopped during the restoration process. You will not be able to control the power state, access the file manager, or create additional backups until completed.`}
                warningItems={[
                    'All current files and server configuration will be deleted and replaced with the backup data.',
                    'This action cannot be undone.',
                ]}
                confirmText={countdown > 0 ? `Delete All & Restore (${countdown}s)` : 'Delete All & Restore Backup'}
            />

            {/* Delete Modal */}
            <ConfirmPasswordModal
                open={modal === 'delete'}
                onClose={() => setModal('')}
                onConfirmed={doDeletion}
                title={`Delete "${backup.name}"`}
                flashKey='backup:delete'
                loading={loading}
                description='This is a permanent operation. The backup cannot be recovered once deleted.'
                warningItems={['The backup file and its snapshot will be permanently deleted.']}
                confirmText='Delete Backup'
            />

            <SpinnerOverlay visible={loading} fixed />
            {backup.isSuccessful ? (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant='secondary'
                            size='sm'
                            disabled={loading}
                            className='flex items-center justify-center w-8 h-8 p-0 hover:bg-zinc-700'
                        >
                            <div>
                                <Bars width={22} height={22} fill='currentColor' />
                            </div>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end' className='w-48'>
                        <Can action={'backup.download'}>
                            <DropdownMenuItem onClick={doDownload} className='cursor-pointer'>
                                <ArrowDownToLine width={22} height={22} className='mr-2' fill='currentColor' />
                                Download
                            </DropdownMenuItem>
                        </Can>
                        <Can action={'backup.restore'}>
                            <DropdownMenuItem onClick={() => setModal('restore')} className='cursor-pointer'>
                                <CloudArrowUpIn width={22} height={22} className=' mr-2' fill='currentColor' />
                                Restore
                            </DropdownMenuItem>
                        </Can>
                        <Can action={'backup.delete'}>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setModal('rename')} className='cursor-pointer'>
                                <Pencil width={22} height={22} className=' mr-2' fill='currentColor' />
                                Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={onLockToggle} className='cursor-pointer'>
                                <Shield width={22} height={22} className=' mr-2' fill='currentColor' />
                                {backup.isLocked ? 'Unlock' : 'Lock'}
                            </DropdownMenuItem>
                            {!backup.isLocked && (
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={() => setModal('delete')}
                                        className='cursor-pointer text-red-400 focus:text-red-300'
                                    >
                                        <TrashBin width={22} height={22} className=' mr-2' fill='currentColor' />
                                        Delete
                                    </DropdownMenuItem>
                                </>
                            )}
                        </Can>
                    </DropdownMenuContent>
                </DropdownMenu>
            ) : (
                <Button
                    variant='attention'
                    size='sm'
                    onClick={() => setModal('delete')}
                    disabled={loading}
                    className='flex items-center gap-2'
                >
                    <TrashBin width={22} height={22} fill='currentColor' />
                    <span className='hidden sm:inline'>Delete</span>
                </Button>
            )}
        </>
    );
};

export default BackupContextMenu;
