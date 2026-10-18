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
import { useTranslation } from '@/i18n/I18nProvider';
import type { TranslationKey } from '@/i18n/types';

const cardClass = 'flex flex-col gap-4 rounded-xl border border-mocha-400 bg-mocha-500 p-4';

const labelFor = (resource: string) =>
    resource
        .split('_')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');

const ApplicationApiCreateContainer = () => {
    const { t } = useTranslation();
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

    const resourceLabel = (resource: string) => {
        const key = `admin.api.resources.${resource}`;
        const translated = t(key as TranslationKey);

        return translated === key ? labelFor(resource) : translated;
    };

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
            toast.success(t('admin.api.created'));
            navigate('/api');
        } catch (error) {
            setErrors(parseValidationErrors(error));
            toast.error(errorToMessage(error, t('admin.api.create_failed')));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <PageContentBlock title={t('admin.api.new_credentials')}>
            <MainPageHeader direction='column' title={t('admin.api.new_credentials')}>
                <p className='text-sm text-neutral-400'>{t('admin.api.create_description')}</p>
            </MainPageHeader>

            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    void submit();
                }}
                className='grid grid-cols-1 gap-4 lg:grid-cols-3'
            >
                <div className={`${cardClass} lg:col-span-2`}>
                    <h2 className='text-sm font-semibold text-cream-50'>{t('admin.api.select_permissions')}</h2>
                    <div className='overflow-hidden rounded-lg border border-mocha-400'>
                        <table className='w-full text-sm'>
                            <tbody>
                                {data.resources.map((resource) => (
                                    <tr key={resource} className='border-b border-mocha-400/40 last:border-0'>
                                        <td className='px-4 py-3 text-cream-100'>{resourceLabel(resource)}</td>
                                        <td className='w-56 px-4 py-3'>
                                            <Dropdown
                                                value={String(valueFor(resource))}
                                                onChange={(value) =>
                                                    setValues((current) => ({ ...current, [resource]: Number(value) }))
                                                }
                                                options={[
                                                    {
                                                        value: String(data.permissions.read),
                                                        label: t('admin.api.read'),
                                                    },
                                                    {
                                                        value: String(data.permissions.read_write),
                                                        label: t('admin.api.read_write'),
                                                    },
                                                    { value: String(data.permissions.none), label: t('common.none') },
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
                    <Field label={t('admin.common.description')} error={errors.memo} hint={t('admin.api.memo_hint')}>
                        <Input.Text value={memo} onChange={(event) => setMemo(event.target.value)} />
                    </Field>
                    <p className='text-xs text-cream-400/60'>{t('admin.api.warning')}</p>
                    <div className='flex justify-end'>
                        <Button type='submit' disabled={submitting}>
                            {t('admin.api.create_credentials')}
                        </Button>
                    </div>
                </div>
            </form>
        </PageContentBlock>
    );
};

export default ApplicationApiCreateContainer;
