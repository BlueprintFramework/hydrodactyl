import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { type BucketValues, createBucket } from '@/api/admin/buckets';
import { errorToMessage, parseValidationErrors } from '@/api/admin/errors';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import PageContentBlock from '@/components/elements/PageContentBlock';
import { useTranslation } from '@/i18n/I18nProvider';
import BucketForm, { emptyBucketValues } from './BucketForm';

const BucketCreateContainer = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const submit = async (values: BucketValues) => {
        setSubmitting(true);
        setErrors({});

        try {
            const bucket = await createBucket(values);
            toast.success(t('admin.buckets.created'));
            navigate(`/buckets/${bucket.id}`);
        } catch (error) {
            setErrors(parseValidationErrors(error));
            toast.error(errorToMessage(error, t('admin.buckets.create_failed')));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <PageContentBlock title={t('admin.buckets.create')}>
            <MainPageHeader direction='column' title={t('admin.buckets.create')}>
                <p className='text-sm text-neutral-400'>{t('admin.buckets.create_description')}</p>
            </MainPageHeader>

            <BucketForm
                initialValues={emptyBucketValues}
                submitLabel={t('admin.buckets.create')}
                submitting={submitting}
                errors={errors}
                onSubmit={submit}
                onCancel={() => navigate('/buckets')}
            />
        </PageContentBlock>
    );
};

export default BucketCreateContainer;
