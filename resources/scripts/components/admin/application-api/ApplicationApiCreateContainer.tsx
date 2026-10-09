import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { createApplicationApiKey } from '@/api/admin/applicationApi';
import { errorToMessage, parseValidationErrors } from '@/api/admin/errors';
import { useApplicationApiKeys } from '@/api/admin/useApplicationApi';
import { Field } from '@/components/admin/Field';
import Dropdown from '@/components/elements/Dropdown';
import { Input } from '@/components/elements/inputs';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import PageContentBlock from '@/components/elements/PageContentBlock';
import Spinner from '@/components/elements/Spinner';
import { Button } from '@/components/ui/button';

const cardClass = 'flex flex-col gap-4 rounded-xl border border-mocha-400 bg-mocha-500 p-4';

const labelFor = (resource: string) =>
    resource
        .split('_')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');

const ApplicationApiCreateContainer = () => {
    const navigate = useNavigate();
    const { data, mutate } = useApplicationApiKeys();
    const [memo, setMemo] = useState('');
    const [values, setValues] = useState<Record<string, number>>({});
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    if (!data) {
        return (
            <div className='flex items-center justify-center min-h-[60vh]'>
                <Spinner centered size={Spinner.Size.LARGE} />
            </div>
        );
    }

    const valueFor = (resource: string) => values[resource] ?? data.permissions.none;

    const submit = async () => {
        setSubmitting(true);
        setErrors({});

        const payload: Record<string, string | number> = { memo };
        for (const resource of data.resources) {
            payload[`r_${resource}`] = valueFor(resource);
        }

        try {
            await createApplicationApiKey(payload);
            await mutate();
            toast.success('A new application API key has been generated for your account.');
            navigate('/api');
        } catch (error) {
            setErrors(parseValidationErrors(error));
            toast.error(errorToMessage(error, 'Failed to create the API key.'));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <PageContentBlock title='New Credentials'>
            <MainPageHeader direction='column' title='New Credentials'>
                <p className='text-sm text-neutral-400'>Create a new application API key.</p>
            </MainPageHeader>

            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    void submit();
                }}
                className='grid grid-cols-1 gap-4 lg:grid-cols-3'
            >
                <div className={`${cardClass} lg:col-span-2`}>
                    <h2 className='text-sm font-semibold text-cream-50'>Select Permissions</h2>
                    <div className='overflow-hidden rounded-lg border border-mocha-400'>
                        <table className='w-full text-sm'>
                            <tbody>
                                {data.resources.map((resource) => (
                                    <tr key={resource} className='border-b border-mocha-400/40 last:border-0'>
                                        <td className='px-4 py-3 text-cream-100'>{labelFor(resource)}</td>
                                        <td className='w-56 px-4 py-3'>
                                            <Dropdown
                                                value={String(valueFor(resource))}
                                                onChange={(value) =>
                                                    setValues((current) => ({ ...current, [resource]: Number(value) }))
                                                }
                                                options={[
                                                    { value: String(data.permissions.read), label: 'Read' },
                                                    {
                                                        value: String(data.permissions.read_write),
                                                        label: 'Read & Write',
                                                    },
                                                    { value: String(data.permissions.none), label: 'None' },
                                                ]}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className={cardClass}>
                    <Field
                        label='Description'
                        error={errors.memo}
                        hint='A label to help you identify this set of credentials.'
                    >
                        <Input.Text value={memo} onChange={(event) => setMemo(event.target.value)} />
                    </Field>
                    <p className='text-xs text-cream-400/60'>
                        Once permissions are assigned and the credentials are created you will not be able to edit them.
                        If you need to make changes later, create a new set of credentials.
                    </p>
                    <div className='flex justify-end'>
                        <Button type='submit' disabled={submitting}>
                            Create Credentials
                        </Button>
                    </div>
                </div>
            </form>
        </PageContentBlock>
    );
};

export default ApplicationApiCreateContainer;
