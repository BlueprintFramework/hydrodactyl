import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { errorToMessage } from '@/api/admin/errors';
import { deleteServer } from '@/api/admin/servers';
import { useServer } from '@/api/admin/useServers';
import { Dialog } from '@/components/elements/dialog';
import Spinner from '@/components/elements/Spinner';
import { Button } from '@/components/ui/button';

const ServerDeleteContainer = () => {
    const { id } = useParams<'id'>();
    const navigate = useNavigate();
    const { data: server } = useServer(id);
    const [busy, setBusy] = useState<'safe' | 'force'>();
    const [confirm, setConfirm] = useState<'safe' | 'force'>();

    if (!server) {
        return (
            <div className='flex items-center justify-center py-16'>
                <Spinner centered size={Spinner.Size.LARGE} />
            </div>
        );
    }

    const remove = async (force: boolean) => {
        setBusy(force ? 'force' : 'safe');

        try {
            await deleteServer(server.id, force);
            toast.success('Server deleted.');
            navigate('/servers');
        } catch (error) {
            toast.error(errorToMessage(error, 'Failed to delete server.'));
            setBusy(undefined);
            setConfirm(undefined);
        }
    };

    return (
        <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
            <div className='flex flex-col gap-3 rounded-xl border border-mocha-400 bg-mocha-500 p-4'>
                <h2 className='text-sm font-semibold text-cream-50'>Safely Delete Server</h2>
                <p className='text-sm text-cream-400/70'>
                    This will attempt to delete the server from both the panel and the daemon. If either reports an
                    error the action is cancelled.
                </p>
                <p className='text-xs text-brand-400'>
                    Deleting a server is irreversible. <strong>All server data</strong> (including files and users) will
                    be removed.
                </p>
                <div className='mt-auto flex justify-end'>
                    <Button variant='attention' disabled={!!busy} onClick={() => setConfirm('safe')}>
                        Safely Delete This Server
                    </Button>
                </div>
            </div>

            <div className='flex flex-col gap-3 rounded-xl border border-brand-400/40 bg-brand-400/5 p-4'>
                <h2 className='text-sm font-semibold text-brand-400'>Force Delete Server</h2>
                <p className='text-sm text-cream-400/70'>
                    This will attempt to delete the server from the panel and daemon, but will continue even if the
                    daemon reports an error.
                </p>
                <p className='text-xs text-brand-400'>
                    This may leave dangling files on your daemon if it reports an error.
                </p>
                <div className='mt-auto flex justify-end'>
                    <Button variant='attention' disabled={!!busy} onClick={() => setConfirm('force')}>
                        Forcibly Delete This Server
                    </Button>
                </div>
            </div>

            <Dialog.Confirm
                open={!!confirm}
                title='Delete Server'
                confirm='Delete'
                loading={!!busy}
                onClose={() => setConfirm(undefined)}
                onConfirmed={() => void remove(confirm === 'force')}
            >
                Are you sure you want to delete this server? There is no going back, all data will immediately be
                removed.
            </Dialog.Confirm>
        </div>
    );
};

export default ServerDeleteContainer;
