import { useState } from 'react';
import { toast } from 'sonner';
import { type BucketValues, testBucketConnection } from '@/api/admin/buckets';
import { errorToMessage } from '@/api/admin/errors';
import { Field } from '@/components/admin/Field';
import Dropdown from '@/components/elements/Dropdown';
import { Input } from '@/components/elements/inputs';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/I18nProvider';

export const emptyBucketValues: BucketValues = {
    name: '',
    description: '',
    access_key: '',
    secret_key: '',
    endpoint: '',
    region: 'us-east-1',
    bucket_name: '',
    use_path_style_endpoint: false,
    enabled: true,
};

import type { Translate } from '@/i18n/types';

const boolOptions = (t: Translate) => [
    { value: 'false', label: t('common.no') },
    { value: 'true', label: t('common.yes') },
];

interface Props {
    initialValues: BucketValues;
    submitLabel: string;
    submitting: boolean;
    errors: Record<string, string>;
    onSubmit: (values: BucketValues) => void;
    onCancel?: () => void;
}

const BucketForm = ({ initialValues, submitLabel, submitting, errors, onSubmit, onCancel }: Props) => {
    const { t } = useTranslation();
    const [values, setValues] = useState<BucketValues>(initialValues);
    const [testing, setTesting] = useState(false);

    const set = <K extends keyof BucketValues>(key: K, value: BucketValues[K]) =>
        setValues((current) => ({ ...current, [key]: value }));

    const test = async () => {
        setTesting(true);

        try {
            const message = await testBucketConnection({
                access_key: values.access_key,
                secret_key: values.secret_key,
                bucket_name: values.bucket_name,
                endpoint: values.endpoint,
                region: values.region,
                use_path_style_endpoint: values.use_path_style_endpoint,
            });
            toast.success(message);
        } catch (error) {
            toast.error(errorToMessage(error, t('admin.buckets.connection_failed')));
        } finally {
            setTesting(false);
        }
    };

    return (
        <form
            onSubmit={(event) => {
                event.preventDefault();
                onSubmit(values);
            }}
            className='flex flex-col gap-4'
        >
            <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
                <div className='flex flex-col gap-4 rounded-xl border border-mocha-400 bg-mocha-500 p-4'>
                    <Field label={t('admin.common.name')} error={errors.name} hint={t('admin.buckets.name_hint')}>
                        <Input.Text value={values.name} onChange={(event) => set('name', event.target.value)} />
                    </Field>
                    <Field
                        label={t('admin.buckets.s3_bucket_name')}
                        error={errors.bucket_name}
                        hint={t('admin.buckets.s3_bucket_name_hint')}
                    >
                        <Input.Text
                            value={values.bucket_name}
                            onChange={(event) => set('bucket_name', event.target.value)}
                        />
                    </Field>
                    <Field
                        label={t('admin.buckets.endpoint')}
                        error={errors.endpoint}
                        hint={t('admin.buckets.endpoint_hint')}
                    >
                        <Input.Text value={values.endpoint} onChange={(event) => set('endpoint', event.target.value)} />
                    </Field>
                    <Field
                        label={t('admin.buckets.region')}
                        error={errors.region}
                        hint={t('admin.buckets.region_hint')}
                    >
                        <Input.Text value={values.region} onChange={(event) => set('region', event.target.value)} />
                    </Field>
                </div>

                <div className='flex flex-col gap-4 rounded-xl border border-mocha-400 bg-mocha-500 p-4'>
                    <Field
                        label={t('admin.common.description')}
                        error={errors.description}
                        hint={t('admin.buckets.description_hint')}
                    >
                        <Input.Text
                            value={values.description}
                            onChange={(event) => set('description', event.target.value)}
                        />
                    </Field>
                    <Field label={t('admin.buckets.access_key')} error={errors.access_key}>
                        <Input.Text
                            value={values.access_key}
                            onChange={(event) => set('access_key', event.target.value)}
                        />
                    </Field>
                    <Field label={t('admin.buckets.secret_key')} error={errors.secret_key}>
                        <Input.Text
                            type='password'
                            value={values.secret_key}
                            onChange={(event) => set('secret_key', event.target.value)}
                        />
                    </Field>
                    <Field label={t('admin.buckets.path_style')} error={errors.use_path_style_endpoint}>
                        <Dropdown
                            value={String(values.use_path_style_endpoint)}
                            onChange={(value) => set('use_path_style_endpoint', value === 'true')}
                            options={boolOptions(t)}
                        />
                    </Field>
                    <Field label={t('common.enabled')} error={errors.enabled}>
                        <Dropdown
                            value={String(values.enabled)}
                            onChange={(value) => set('enabled', value === 'true')}
                            options={boolOptions(t)}
                        />
                    </Field>
                </div>
            </div>

            <div className='flex items-center justify-between'>
                <Button type='button' variant='secondary' onClick={() => void test()} disabled={testing || submitting}>
                    {t('admin.buckets.test_connection')}
                </Button>
                <div className='flex gap-2'>
                    {onCancel && (
                        <Button type='button' variant='secondary' onClick={onCancel} disabled={submitting}>
                            {t('common.cancel')}
                        </Button>
                    )}
                    <Button type='submit' disabled={submitting}>
                        {submitLabel}
                    </Button>
                </div>
            </div>
        </form>
    );
};

export default BucketForm;
