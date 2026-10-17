import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { deleteBucket } from '@/api/admin/buckets';
import { errorToMessage } from '@/api/admin/errors';
import { useBucket } from '@/api/admin/useBuckets';
import { Dialog } from '@/components/elements/dialog';
import Spinner from '@/components/elements/Spinner';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/I18nProvider';

const BucketDeleteContainer = () => {
    const { t } = useTranslation();
    const { id } = useParams<'id'>();
    const navigate = useNavigate();
    const { data: bucket } = useBucket(id);
    const [deleting, setDeleting] = useState(false);
    const [confirm, setConfirm] = useState(false);

    if (!bucket) {
        return (
            <div className='flex items-center justify-center py-16'>
                <Spinner centered size={Spinner.Size.LARGE} />
            </div>
        );
    }

    const remove = async () => {
        setDeleting(true);

        try {
            await deleteBucket(bucket.id);
            toast.success(t('admin.buckets.deleted'));
            navigate('/buckets');
        } catch (error) {
            toast.error(errorToMessage(error, t('admin.buckets.delete_failed')));
            setDeleting(false);
            setConfirm(false);
        }
    };

    return (
        <div className='max-w-2xl rounded-xl border border-brand-400/40 bg-brand-400/5 p-4'>
            <h2 className='text-sm font-semibold text-brand-400'>{t('admin.buckets.delete')}</h2>
            <p className='mt-1 text-sm text-cream-400/70'>{t('admin.buckets.delete_description')}</p>

            {bucket.servers_count > 0 ? (
                <p className='mt-3 text-sm text-brand-400'>
                    <strong>{t('admin.buckets.delete_in_use_bold', { count: bucket.servers_count })}</strong>{' '}
                    {t('admin.buckets.delete_in_use_suffix')}
                </p>
            ) : (
                <p className='mt-3 text-xs text-brand-400'>{t('admin.buckets.delete_warning')}</p>
            )}

            <Button
                variant='attention'
                className='mt-3'
                disabled={bucket.servers_count > 0}
                onClick={() => setConfirm(true)}
            >
                {t('admin.buckets.delete_button')}
            </Button>

            <Dialog.Confirm
                open={confirm}
                title={t('admin.buckets.delete')}
                confirm={t('common.delete')}
                loading={deleting}
                onClose={() => setConfirm(false)}
                onConfirmed={remove}
            >
                {t('admin.buckets.delete_confirm')}
            </Dialog.Confirm>
        </div>
    );
};

export default BucketDeleteContainer;
