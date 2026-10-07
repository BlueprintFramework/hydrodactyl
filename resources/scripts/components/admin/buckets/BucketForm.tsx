import { useState } from 'react';
import { toast } from 'sonner';
import { type BucketValues, testBucketConnection } from '@/api/admin/buckets';
import { errorToMessage } from '@/api/admin/errors';
import { Field } from '@/components/admin/Field';
import Dropdown from '@/components/elements/Dropdown';
import { Input } from '@/components/elements/inputs';
import { Button } from '@/components/ui/button';

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

const boolOptions = [
    { value: 'false', label: 'No' },
    { value: 'true', label: 'Yes' },
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
            toast.error(errorToMessage(error, 'Connection failed.'));
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
                    <Field label='Name' error={errors.name} hint='A unique name for this S3 bucket configuration.'>
                        <Input.Text value={values.name} onChange={(event) => set('name', event.target.value)} />
                    </Field>
                    <Field
                        label='S3 Bucket Name'
                        error={errors.bucket_name}
                        hint='The actual bucket name on your provider.'
                    >
                        <Input.Text
                            value={values.bucket_name}
                            onChange={(event) => set('bucket_name', event.target.value)}
                        />
                    </Field>
                    <Field label='Endpoint' error={errors.endpoint} hint='Leave blank for AWS S3.'>
                        <Input.Text value={values.endpoint} onChange={(event) => set('endpoint', event.target.value)} />
                    </Field>
                    <Field label='Region' error={errors.region} hint='e.g. us-east-1, or us-west-004 for Backblaze.'>
                        <Input.Text value={values.region} onChange={(event) => set('region', event.target.value)} />
                    </Field>
                </div>

                <div className='flex flex-col gap-4 rounded-xl border border-mocha-400 bg-mocha-500 p-4'>
                    <Field label='Description' error={errors.description} hint='Optional.'>
                        <Input.Text
                            value={values.description}
                            onChange={(event) => set('description', event.target.value)}
                        />
                    </Field>
                    <Field label='Access Key' error={errors.access_key}>
                        <Input.Text
                            value={values.access_key}
                            onChange={(event) => set('access_key', event.target.value)}
                        />
                    </Field>
                    <Field label='Secret Key' error={errors.secret_key}>
                        <Input.Text
                            type='password'
                            value={values.secret_key}
                            onChange={(event) => set('secret_key', event.target.value)}
                        />
                    </Field>
                    <Field label='Use Path-Style Endpoints' error={errors.use_path_style_endpoint}>
                        <Dropdown
                            value={String(values.use_path_style_endpoint)}
                            onChange={(value) => set('use_path_style_endpoint', value === 'true')}
                            options={boolOptions}
                        />
                    </Field>
                    <Field label='Enabled' error={errors.enabled}>
                        <Dropdown
                            value={String(values.enabled)}
                            onChange={(value) => set('enabled', value === 'true')}
                            options={boolOptions}
                        />
                    </Field>
                </div>
            </div>

            <div className='flex items-center justify-between'>
                <Button type='button' variant='secondary' onClick={() => void test()} disabled={testing || submitting}>
                    Test Connection
                </Button>
                <div className='flex gap-2'>
                    {onCancel && (
                        <Button type='button' variant='secondary' onClick={onCancel} disabled={submitting}>
                            Cancel
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
