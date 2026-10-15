import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { type BucketValues, updateBucket } from '@/api/admin/buckets';
import { errorToMessage, parseValidationErrors } from '@/api/admin/errors';
import { useBucket } from '@/api/admin/useBuckets';
import Spinner from '@/components/elements/Spinner';
import BucketForm from './BucketForm';

const BucketDetailsContainer = () => {
    const { id } = useParams<'id'>();
    const { data: bucket, mutate } = useBucket(id);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    if (!bucket) {
        return (
            <div className='flex items-center justify-center py-16'>
                <Spinner centered size={Spinner.Size.LARGE} />
            </div>
        );
    }

    const submit = async (values: BucketValues) => {
        setSubmitting(true);
        setErrors({});

        try {
            await updateBucket(bucket.id, values);
            await mutate();
            toast.success('S3 configuration updated.');
        } catch (error) {
            setErrors(parseValidationErrors(error));
            toast.error(errorToMessage(error, 'Failed to update the S3 configuration.'));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <BucketForm
            key={bucket.id}
            initialValues={{
                name: bucket.name,
                description: bucket.description ?? '',
                access_key: bucket.access_key ?? '',
                secret_key: bucket.secret_key ?? '',
                endpoint: bucket.endpoint ?? '',
                region: bucket.region || 'us-east-1',
                bucket_name: bucket.bucket_name,
                use_path_style_endpoint: bucket.use_path_style_endpoint,
                enabled: bucket.enabled,
            }}
            submitLabel='Update Configuration'
            submitting={submitting}
            errors={errors}
            onSubmit={submit}
        />
    );
};

export default BucketDetailsContainer;
