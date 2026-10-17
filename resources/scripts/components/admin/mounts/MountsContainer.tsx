import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { errorToMessage, parseValidationErrors } from '@/api/admin/errors';
import { createMount, type MountValues } from '@/api/admin/mounts';
import { useMounts } from '@/api/admin/useMounts';
import { Field } from '@/components/admin/Field';
import Dropdown from '@/components/elements/Dropdown';
import { Dialog } from '@/components/elements/dialog';
import { Input } from '@/components/elements/inputs';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import PageContentBlock from '@/components/elements/PageContentBlock';
import Spinner from '@/components/elements/Spinner';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/I18nProvider';
import type { Translate } from '@/i18n/types';

const emptyValues: MountValues = {
    name: '',
    description: '',
    source: '',
    target: '',
    read_only: false,
    user_mountable: false,
};

const boolOptions = (t: Translate) => [
    { value: 'false', label: t('admin.common.false') },
    { value: 'true', label: t('admin.common.true') },
];

const CreateMountDialog = ({
    open,
    onClose,
    onCreated,
}: {
    open: boolean;
    onClose: () => void;
    onCreated: () => void;
}) => {
    const { t } = useTranslation();
    const [values, setValues] = useState<MountValues>(emptyValues);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const set = <K extends keyof MountValues>(key: K, value: MountValues[K]) =>
        setValues((current) => ({ ...current, [key]: value }));

    const close = () => {
        if (!submitting) {
            onClose();
        }
    };

    const submit = async () => {
        setSubmitting(true);
        setErrors({});

        try {
            await createMount(values);
            toast.success(t('admin.mounts.created'));
            setValues(emptyValues);
            onCreated();
            onClose();
        } catch (error) {
            setErrors(parseValidationErrors(error));
            toast.error(errorToMessage(error, t('admin.mounts.create_failed')));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} title={t('admin.mounts.create')} onClose={close} preventExternalClose={submitting}>
            <div className='mt-4'>
                <form
                    id='create-mount-form'
                    onSubmit={(event) => {
                        event.preventDefault();
                        void submit();
                    }}
                    className='flex flex-col gap-4'
                >
                    <Field label={t('admin.common.name')} error={errors.name} hint={t('admin.mounts.name_hint')}>
                        <Input.Text value={values.name} onChange={(event) => set('name', event.target.value)} />
                    </Field>
                    <Field
                        label={t('admin.common.description')}
                        error={errors.description}
                        hint={t('admin.mounts.description_hint')}
                    >
                        <Input.Text
                            value={values.description}
                            onChange={(event) => set('description', event.target.value)}
                        />
                    </Field>
                    <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                        <Field
                            label={t('admin.mounts.source')}
                            error={errors.source}
                            hint={t('admin.mounts.source_hint')}
                        >
                            <Input.Text value={values.source} onChange={(event) => set('source', event.target.value)} />
                        </Field>
                        <Field
                            label={t('admin.mounts.target')}
                            error={errors.target}
                            hint={t('admin.mounts.target_hint')}
                        >
                            <Input.Text value={values.target} onChange={(event) => set('target', event.target.value)} />
                        </Field>
                    </div>
                    <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                        <Field
                            label={t('admin.mounts.read_only')}
                            error={errors.read_only}
                            hint={t('admin.mounts.read_only_hint')}
                        >
                            <Dropdown
                                value={String(values.read_only)}
                                onChange={(value) => set('read_only', value === 'true')}
                                options={boolOptions(t)}
                            />
                        </Field>
                        <Field
                            label={t('admin.mounts.user_mountable')}
                            error={errors.user_mountable}
                            hint={t('admin.mounts.user_mountable_hint')}
                        >
                            <Dropdown
                                value={String(values.user_mountable)}
                                onChange={(value) => set('user_mountable', value === 'true')}
                                options={boolOptions(t)}
                            />
                        </Field>
                    </div>
                    <Dialog.Footer>
                        <Button type='button' variant='secondary' onClick={close} disabled={submitting}>
                            {t('common.cancel')}
                        </Button>
                        <Button type='submit' form='create-mount-form' disabled={submitting}>
                            {t('common.create')}
                        </Button>
                    </Dialog.Footer>
                </form>
            </div>
        </Dialog>
    );
};

const MountsContainer = () => {
    const { t } = useTranslation();
    const { data, mutate } = useMounts();
    const [createOpen, setCreateOpen] = useState(false);

    if (!data) {
        return (
            <div className='flex items-center justify-center min-h-[60vh]'>
                <Spinner centered size={Spinner.Size.LARGE} />
            </div>
        );
    }

    return (
        <PageContentBlock title={t('admin.nav.mounts')}>
            <MainPageHeader direction='column' title={t('admin.nav.mounts')}>
                <p className='text-sm text-neutral-400'>{t('admin.mounts.description')}</p>
            </MainPageHeader>

            <div className='mb-4 flex justify-end'>
                <Button onClick={() => setCreateOpen(true)}>{t('admin.mounts.create')}</Button>
            </div>

            <div className='overflow-x-auto rounded-xl border border-mocha-400'>
                <table className='w-full text-sm'>
                    <thead className='text-left text-xs uppercase tracking-wide text-cream-400/60'>
                        <tr className='border-b border-mocha-400'>
                            <th className='px-4 py-3'>{t('admin.common.id')}</th>
                            <th className='px-4 py-3'>{t('admin.common.name')}</th>
                            <th className='px-4 py-3'>{t('admin.mounts.source')}</th>
                            <th className='px-4 py-3'>{t('admin.mounts.target')}</th>
                            <th className='px-4 py-3 text-center'>{t('admin.mounts.eggs')}</th>
                            <th className='px-4 py-3 text-center'>{t('admin.common.nodes')}</th>
                            <th className='px-4 py-3 text-center'>{t('admin.common.servers')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((mount) => (
                            <tr key={mount.id} className='border-b border-mocha-400/40 hover:bg-mocha-400/20'>
                                <td className='px-4 py-3 font-mono text-cream-400/60'>{mount.id}</td>
                                <td className='px-4 py-3'>
                                    <Link to={`/mounts/${mount.id}`} className='text-cream-50 hover:text-hydro-400'>
                                        {mount.name}
                                    </Link>
                                </td>
                                <td className='px-4 py-3'>
                                    <code className='text-xs text-cream-400/70'>{mount.source}</code>
                                </td>
                                <td className='px-4 py-3'>
                                    <code className='text-xs text-cream-400/70'>{mount.target}</code>
                                </td>
                                <td className='px-4 py-3 text-center text-cream-100'>{mount.eggs_count}</td>
                                <td className='px-4 py-3 text-center text-cream-100'>{mount.nodes_count}</td>
                                <td className='px-4 py-3 text-center text-cream-100'>{mount.servers_count}</td>
                            </tr>
                        ))}
                        {data.length === 0 && (
                            <tr>
                                <td colSpan={7} className='px-4 py-8 text-center text-cream-400/50'>
                                    {t('admin.mounts.empty')}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <CreateMountDialog open={createOpen} onClose={() => setCreateOpen(false)} onCreated={() => void mutate()} />
        </PageContentBlock>
    );
};

export default MountsContainer;
