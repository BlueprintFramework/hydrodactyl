import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { deleteBucket } from '@/api/admin/buckets';
import { errorToMessage } from '@/api/admin/errors';
import { useBucket } from '@/api/admin/useBuckets';
import { Dialog } from '@/components/elements/dialog';
import Spinner from '@/components/elements/Spinner';
import { Button } from '@/components/ui/button';

const BucketDeleteContainer = () => {
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
            toast.success('S3 configuration deleted.');
            navigate('/buckets');
        } catch (error) {
            toast.error(errorToMessage(error, 'Failed to delete the S3 configuration.'));
            setDeleting(false);
            setConfirm(false);
        }
    };

    return (
        <div className='max-w-2xl rounded-xl border border-brand-400/40 bg-brand-400/5 p-4'>
            <h2 className='text-sm font-semibold text-brand-400'>Delete S3 Configuration</h2>
            <p className='mt-1 text-sm text-cream-400/70'>
                This action will permanently delete this S3 bucket configuration.
            </p>

            {bucket.servers_count > 0 ? (
                <p className='mt-3 text-sm text-brand-400'>
                    <strong>{bucket.servers_count} server(s)</strong> are currently using this configuration. Reassign
                    them to another bucket before deleting.
                </p>
            ) : (
                <p className='mt-3 text-xs text-brand-400'>
                    Deleting an S3 configuration is irreversible. Any backups stored in this bucket will become
                    inaccessible from the panel.
                </p>
            )}

            <Button
                variant='attention'
                className='mt-3'
                disabled={bucket.servers_count > 0}
                onClick={() => setConfirm(true)}
            >
                Delete This Configuration
            </Button>

            <Dialog.Confirm
                open={confirm}
                title='Delete S3 Configuration'
                confirm='Delete'
                loading={deleting}
                onClose={() => setConfirm(false)}
                onConfirmed={remove}
            >
                Are you sure that you want to delete this S3 configuration? There is no going back.
            </Dialog.Confirm>
        </div>
    );
};

export default BucketDeleteContainer;
