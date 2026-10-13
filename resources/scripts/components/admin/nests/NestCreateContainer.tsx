import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { errorToMessage, parseValidationErrors } from '@/api/admin/errors';
import { createNest } from '@/api/admin/nests';
import { Field } from '@/components/admin/Field';
import { Input } from '@/components/elements/inputs';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import PageContentBlock from '@/components/elements/PageContentBlock';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/I18nProvider';

const NestCreateContainer = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const submit = async () => {
        setSubmitting(true);
        setErrors({});

        try {
            const nest = await createNest({ name, description });
            toast.success(t('admin.nests.created'));
            navigate(`/nests/${nest.id}`);
        } catch (error) {
            setErrors(parseValidationErrors(error));
            toast.error(errorToMessage(error, t('admin.nests.create_failed')));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <PageContentBlock title={t('admin.nests.create')}>
            <MainPageHeader direction='column' title={t('admin.nests.create')}>
                <p className='text-sm text-neutral-400'>{t('admin.nests.create_description')}</p>
            </MainPageHeader>

            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    void submit();
                }}
                className='flex flex-col gap-4 rounded-xl border border-mocha-400 bg-mocha-500 p-4'
            >
                <Field label={t('admin.common.name')} error={errors.name} hint={t('admin.nests.name_hint')}>
                    <Input.Text value={name} onChange={(event) => setName(event.target.value)} />
                </Field>
                <Field label={t('admin.common.description')} error={errors.description}>
                    <Input.Text value={description} onChange={(event) => setDescription(event.target.value)} />
                </Field>
                <div className='flex justify-end gap-2'>
                    <Button type='button' variant='secondary' disabled={submitting} onClick={() => navigate('/nests')}>
                        {t('common.cancel')}
                    </Button>
                    <Button type='submit' disabled={submitting}>
                        {t('admin.nests.create')}
                    </Button>
                </div>
            </form>
        </PageContentBlock>
    );
};

export default NestCreateContainer;
