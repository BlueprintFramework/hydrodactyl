import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { type BucketValues, createBucket } from '@/api/admin/buckets';
import { errorToMessage, parseValidationErrors } from '@/api/admin/errors';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import PageContentBlock from '@/components/elements/PageContentBlock';
import BucketForm, { emptyBucketValues } from './BucketForm';

const BucketCreateContainer = () => {
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const submit = async (values: BucketValues) => {
        setSubmitting(true);
        setErrors({});

        try {
            const bucket = await createBucket(values);
            toast.success('S3 configuration created.');
            navigate(`/buckets/${bucket.id}`);
        } catch (error) {
            setErrors(parseValidationErrors(error));
            toast.error(errorToMessage(error, 'Failed to create the S3 configuration.'));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <PageContentBlock title='Create Bucket'>
            <MainPageHeader direction='column' title='Create Bucket'>
                <p className='text-sm text-neutral-400'>Add a new S3 bucket configuration.</p>
            </MainPageHeader>

            <BucketForm
                initialValues={emptyBucketValues}
                submitLabel='Create Bucket'
                submitting={submitting}
                errors={errors}
                onSubmit={submit}
                onCancel={() => navigate('/buckets')}
            />
        </PageContentBlock>
    );
};

export default BucketCreateContainer;
