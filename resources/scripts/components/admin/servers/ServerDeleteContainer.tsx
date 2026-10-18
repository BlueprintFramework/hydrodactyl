import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { errorToMessage } from '@/api/admin/errors';
import { deleteServer } from '@/api/admin/servers';
import { useServer } from '@/api/admin/useServers';
import { Dialog } from '@/components/elements/dialog';
import Spinner from '@/components/elements/Spinner';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/I18nProvider';

const ServerDeleteContainer = () => {
    const { t } = useTranslation();
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
            toast.success(t('admin.servers.deleted'));
            navigate('/servers');
        } catch (error) {
            toast.error(errorToMessage(error, t('admin.servers.delete_failed')));
            setBusy(undefined);
            setConfirm(undefined);
        }
    };

    return (
        <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
            <div className='flex flex-col gap-3 rounded-xl border border-mocha-400 bg-mocha-500 p-4'>
                <h2 className='text-sm font-semibold text-cream-50'>{t('admin.servers.safe_delete_title')}</h2>
                <p className='text-sm text-cream-400/70'>{t('admin.servers.safe_delete_description')}</p>
                <p className='text-xs text-brand-400'>
                    {t('admin.servers.safe_delete_warning')}{' '}
                    <strong>{t('admin.servers.safe_delete_warning_bold')}</strong>{' '}
                    {t('admin.servers.safe_delete_warning_suffix')}
                </p>
                <div className='mt-auto flex justify-end'>
                    <Button variant='attention' disabled={!!busy} onClick={() => setConfirm('safe')}>
                        {t('admin.servers.safe_delete_button')}
                    </Button>
                </div>
            </div>

            <div className='flex flex-col gap-3 rounded-xl border border-brand-400/40 bg-brand-400/5 p-4'>
                <h2 className='text-sm font-semibold text-brand-400'>{t('admin.servers.force_delete_title')}</h2>
                <p className='text-sm text-cream-400/70'>{t('admin.servers.force_delete_description')}</p>
                <p className='text-xs text-brand-400'>{t('admin.servers.force_delete_warning')}</p>
                <div className='mt-auto flex justify-end'>
                    <Button variant='attention' disabled={!!busy} onClick={() => setConfirm('force')}>
                        {t('admin.servers.force_delete_button')}
                    </Button>
                </div>
            </div>

            <Dialog.Confirm
                open={!!confirm}
                title={t('admin.servers.delete')}
                confirm={t('common.delete')}
                loading={!!busy}
                onClose={() => setConfirm(undefined)}
                onConfirmed={() => void remove(confirm === 'force')}
            >
                {t('admin.servers.delete_confirm')}
            </Dialog.Confirm>
        </div>
    );
};

export default ServerDeleteContainer;
