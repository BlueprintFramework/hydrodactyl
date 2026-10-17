import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { revokeApplicationApiKey } from '@/api/admin/applicationApi';
import { errorToMessage } from '@/api/admin/errors';
import { useApplicationApiKeys } from '@/api/admin/useApplicationApi';
import { Dialog } from '@/components/elements/dialog';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import PageContentBlock from '@/components/elements/PageContentBlock';
import Spinner from '@/components/elements/Spinner';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/I18nProvider';

const CopyButton = ({ value }: { value: string }) => {
    const { t } = useTranslation();
    const [copied, setCopied] = useState(false);

    const copy = async () => {
        if (!navigator.clipboard) {
            toast.error(t('admin.common.clipboard_unavailable'));
            return;
        }

        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    return (
        <Button type='button' variant='secondary' size='sm' onClick={() => void copy()}>
            {copied ? t('admin.common.copied') : t('admin.common.copy')}
        </Button>
    );
};

const formatDate = (value: string | null) => (value ? new Date(value).toLocaleString() : '—');

const ApplicationApiContainer = () => {
    const { t } = useTranslation();
    const { data, mutate } = useApplicationApiKeys();
    const [confirm, setConfirm] = useState<string>();
    const [revoking, setRevoking] = useState(false);

    if (!data) {
        return (
            <div className='flex items-center justify-center min-h-[60vh]'>
                <Spinner centered size={Spinner.Size.LARGE} />
            </div>
        );
    }

    const revoke = async () => {
        if (!confirm) {
            return;
        }

        setRevoking(true);

        try {
            await revokeApplicationApiKey(confirm);
            toast.success(t('admin.api.revoked'));
            await mutate();
            setConfirm(undefined);
        } catch (error) {
            toast.error(errorToMessage(error, t('admin.api.revoke_failed')));
        } finally {
            setRevoking(false);
        }
    };

    return (
        <PageContentBlock title={t('admin.nav.api')}>
            <MainPageHeader direction='column' title={t('admin.nav.api')}>
                <p className='text-sm text-neutral-400'>{t('admin.api.description')}</p>
            </MainPageHeader>

            <div className='mb-4 flex justify-end'>
                <Button asChild>
                    <Link to='/api/new'>{t('admin.api.create_credentials')}</Link>
                </Button>
            </div>

            <div className='overflow-x-auto rounded-xl border border-mocha-400'>
                <table className='w-full text-sm'>
                    <thead className='text-left text-xs uppercase tracking-wide text-cream-400/60'>
                        <tr className='border-b border-mocha-400'>
                            <th className='px-4 py-3'>{t('admin.api.key')}</th>
                            <th className='px-4 py-3'>{t('admin.common.description')}</th>
                            <th className='px-4 py-3'>{t('admin.api.last_used')}</th>
                            <th className='px-4 py-3'>{t('admin.api.created_at')}</th>
                            <th className='px-4 py-3' />
                        </tr>
                    </thead>
                    <tbody>
                        {data.data.map((key) => (
                            <tr key={key.identifier} className='border-b border-mocha-400/40'>
                                <td className='px-4 py-3'>
                                    <div className='flex items-center gap-2'>
                                        <code className='text-xs text-cream-100'>{key.key}</code>
                                        <CopyButton value={key.key} />
                                    </div>
                                </td>
                                <td className='px-4 py-3 text-cream-400/70'>{key.memo || '—'}</td>
                                <td className='px-4 py-3 text-cream-400/70'>{formatDate(key.last_used_at)}</td>
                                <td className='px-4 py-3 text-cream-400/70'>{formatDate(key.created_at)}</td>
                                <td className='px-4 py-3 text-right'>
                                    <Button variant='attention' size='sm' onClick={() => setConfirm(key.identifier)}>
                                        {t('admin.api.revoke')}
                                    </Button>
                                </td>
                            </tr>
                        ))}
                        {data.data.length === 0 && (
                            <tr>
                                <td colSpan={5} className='px-4 py-8 text-center text-cream-400/50'>
                                    {t('admin.api.empty')}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <Dialog.Confirm
                open={!!confirm}
                title={t('admin.api.revoke_title')}
                confirm={t('admin.api.revoke')}
                loading={revoking}
                onClose={() => setConfirm(undefined)}
                onConfirmed={revoke}
            >
                {t('admin.api.revoke_confirm')}
            </Dialog.Confirm>
        </PageContentBlock>
    );
};

export default ApplicationApiContainer;
