import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { errorToMessage, parseValidationErrors } from '@/api/admin/errors';
import { type AdminNestDetail, deleteNest, updateNest } from '@/api/admin/nests';
import { useNest } from '@/api/admin/useNests';
import { Field } from '@/components/admin/Field';
import { Dialog } from '@/components/elements/dialog';
import { Input } from '@/components/elements/inputs';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import PageContentBlock from '@/components/elements/PageContentBlock';
import Spinner from '@/components/elements/Spinner';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/I18nProvider';

const NestDetails = ({ nest, onSaved }: { nest: AdminNestDetail; onSaved: () => Promise<unknown> }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [name, setName] = useState(nest.name);
    const [description, setDescription] = useState(nest.description ?? '');
    const [submitting, setSubmitting] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const save = async () => {
        setSubmitting(true);
        setErrors({});

        try {
            await updateNest(nest.id, { name, description });
            await onSaved();
            toast.success(t('admin.nests.updated'));
        } catch (error) {
            setErrors(parseValidationErrors(error));
            toast.error(errorToMessage(error, t('admin.nests.update_failed')));
        } finally {
            setSubmitting(false);
        }
    };

    const remove = async () => {
        setDeleting(true);

        try {
            await deleteNest(nest.id);
            toast.success(t('admin.nests.deleted'));
            navigate('/nests');
        } catch (error) {
            toast.error(errorToMessage(error, t('admin.nests.delete_failed')));
            setDeleting(false);
            setConfirmDelete(false);
        }
    };

    return (
        <div className='flex flex-col gap-4'>
            <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
                <div className='flex flex-col gap-4 rounded-xl border border-mocha-400 bg-mocha-500 p-4'>
                    <h2 className='text-sm font-semibold text-cream-50'>{t('admin.nests.details')}</h2>
                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            void save();
                        }}
                        className='flex flex-col gap-4'
                    >
                        <Field label={t('admin.common.name')} error={errors.name} hint={t('admin.nests.name_hint')}>
                            <Input.Text value={name} onChange={(event) => setName(event.target.value)} />
                        </Field>
                        <Field label={t('admin.common.description')} error={errors.description}>
                            <Input.Text value={description} onChange={(event) => setDescription(event.target.value)} />
                        </Field>
                        <div className='flex items-center justify-between'>
                            <Button
                                type='button'
                                variant='attention'
                                disabled={deleting}
                                onClick={() => setConfirmDelete(true)}
                            >
                                {t('common.delete')}
                            </Button>
                            <Button type='submit' disabled={submitting}>
                                {t('common.save')}
                            </Button>
                        </div>
                    </form>
                </div>

                <div className='flex flex-col gap-4 rounded-xl border border-mocha-400 bg-mocha-500 p-4'>
                    <h2 className='text-sm font-semibold text-cream-50'>{t('admin.nests.information')}</h2>
                    <Field label={t('admin.nests.nest_id')}>
                        <Input.Text readOnly className='opacity-70' value={String(nest.id)} />
                    </Field>
                    <Field label={t('admin.nests.author')}>
                        <Input.Text readOnly className='opacity-70' value={nest.author} />
                    </Field>
                    <Field label={t('admin.nests.uuid')}>
                        <Input.Text readOnly className='opacity-70' value={nest.uuid} />
                    </Field>
                </div>
            </div>

            <div className='overflow-hidden rounded-xl border border-mocha-400 bg-mocha-500'>
                <div className='flex items-center justify-between border-b border-mocha-400 px-4 py-3'>
                    <h2 className='text-sm font-semibold text-cream-50'>{t('admin.nests.nest_eggs')}</h2>
                    <Button asChild size='sm'>
                        <Link to='/eggs/new'>{t('admin.nests.new_egg')}</Link>
                    </Button>
                </div>
                <div className='overflow-x-auto'>
                    <table className='w-full text-sm'>
                        <thead className='text-left text-xs uppercase tracking-wide text-cream-400/60'>
                            <tr className='border-b border-mocha-400'>
                                <th className='px-4 py-3'>{t('admin.common.id')}</th>
                                <th className='px-4 py-3'>{t('admin.common.name')}</th>
                                <th className='px-4 py-3'>{t('admin.common.description')}</th>
                                <th className='px-4 py-3 text-center'>{t('admin.common.servers')}</th>
                                <th className='px-4 py-3' />
                            </tr>
                        </thead>
                        <tbody>
                            {nest.eggs.map((egg) => (
                                <tr key={egg.id} className='border-b border-mocha-400/40 hover:bg-mocha-400/20'>
                                    <td className='px-4 py-3 font-mono text-cream-400/60'>{egg.id}</td>
                                    <td className='px-4 py-3'>
                                        <Link to={`/eggs/${egg.id}`} className='text-cream-50 hover:text-hydro-400'>
                                            {egg.name}
                                        </Link>
                                    </td>
                                    <td className='px-4 py-3 text-cream-400/70'>{egg.description || '—'}</td>
                                    <td className='px-4 py-3 text-center text-cream-100'>{egg.servers_count}</td>
                                    <td className='px-4 py-3 text-right'>
                                        <a
                                            href={`/admin/eggs/${egg.id}/export`}
                                            className='text-xs text-cream-400/70 hover:text-hydro-400'
                                        >
                                            {t('admin.nests.export')}
                                        </a>
                                    </td>
                                </tr>
                            ))}
                            {nest.eggs.length === 0 && (
                                <tr>
                                    <td colSpan={5} className='px-4 py-6 text-center text-cream-400/50'>
                                        {t('admin.nests.no_eggs')}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Dialog.Confirm
                open={confirmDelete}
                title={t('admin.nests.delete_nest')}
                confirm={t('common.delete')}
                loading={deleting}
                onClose={() => setConfirmDelete(false)}
                onConfirmed={remove}
            >
                {t('admin.nests.delete_nest_confirm')}
            </Dialog.Confirm>
        </div>
    );
};

const NestViewContainer = () => {
    const { t } = useTranslation();
    const { id } = useParams<'id'>();
    const { data: nest, error, isLoading, mutate } = useNest(id);

    if (isLoading) {
        return (
            <div className='flex items-center justify-center min-h-[60vh]'>
                <Spinner centered size={Spinner.Size.LARGE} />
            </div>
        );
    }

    if (error || !nest) {
        return (
            <PageContentBlock title={t('admin.nests.title_singular')}>
                <div className='rounded-xl border border-mocha-400 bg-mocha-500 p-8 text-center text-sm text-cream-400/60'>
                    {t('admin.nests.not_found')}
                </div>
            </PageContentBlock>
        );
    }

    return (
        <PageContentBlock title={nest.name}>
            <MainPageHeader direction='column' title={nest.name}>
                <p className='text-sm text-neutral-400'>{nest.description || t('admin.nests.no_description')}</p>
            </MainPageHeader>

            <NestDetails key={nest.id} nest={nest} onSaved={mutate} />
        </PageContentBlock>
    );
};

export default NestViewContainer;
