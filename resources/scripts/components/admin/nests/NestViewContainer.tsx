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

const NestDetails = ({ nest, onSaved }: { nest: AdminNestDetail; onSaved: () => Promise<unknown> }) => {
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
            toast.success('Nest updated.');
        } catch (error) {
            setErrors(parseValidationErrors(error));
            toast.error(errorToMessage(error, 'Failed to update the nest.'));
        } finally {
            setSubmitting(false);
        }
    };

    const remove = async () => {
        setDeleting(true);

        try {
            await deleteNest(nest.id);
            toast.success('Nest deleted.');
            navigate('/nests');
        } catch (error) {
            toast.error(errorToMessage(error, 'Failed to delete the nest.'));
            setDeleting(false);
            setConfirmDelete(false);
        }
    };

    return (
        <div className='flex flex-col gap-4'>
            <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
                <div className='flex flex-col gap-4 rounded-xl border border-mocha-400 bg-mocha-500 p-4'>
                    <h2 className='text-sm font-semibold text-cream-50'>Nest Details</h2>
                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            void save();
                        }}
                        className='flex flex-col gap-4'
                    >
                        <Field label='Name' error={errors.name} hint='Must be unique, 1-191 characters.'>
                            <Input.Text value={name} onChange={(event) => setName(event.target.value)} />
                        </Field>
                        <Field label='Description' error={errors.description}>
                            <Input.Text value={description} onChange={(event) => setDescription(event.target.value)} />
                        </Field>
                        <div className='flex items-center justify-between'>
                            <Button
                                type='button'
                                variant='attention'
                                disabled={deleting}
                                onClick={() => setConfirmDelete(true)}
                            >
                                Delete
                            </Button>
                            <Button type='submit' disabled={submitting}>
                                Save
                            </Button>
                        </div>
                    </form>
                </div>

                <div className='flex flex-col gap-4 rounded-xl border border-mocha-400 bg-mocha-500 p-4'>
                    <h2 className='text-sm font-semibold text-cream-50'>Nest Information</h2>
                    <Field label='Nest ID'>
                        <Input.Text readOnly className='opacity-70' value={String(nest.id)} />
                    </Field>
                    <Field label='Author'>
                        <Input.Text readOnly className='opacity-70' value={nest.author} />
                    </Field>
                    <Field label='UUID'>
                        <Input.Text readOnly className='opacity-70' value={nest.uuid} />
                    </Field>
                </div>
            </div>

            <div className='overflow-hidden rounded-xl border border-mocha-400 bg-mocha-500'>
                <div className='flex items-center justify-between border-b border-mocha-400 px-4 py-3'>
                    <h2 className='text-sm font-semibold text-cream-50'>Nest Eggs</h2>
                    <Button asChild size='sm'>
                        <Link to='/eggs/new'>New Egg</Link>
                    </Button>
                </div>
                <div className='overflow-x-auto'>
                    <table className='w-full text-sm'>
                        <thead className='text-left text-xs uppercase tracking-wide text-cream-400/60'>
                            <tr className='border-b border-mocha-400'>
                                <th className='px-4 py-3'>ID</th>
                                <th className='px-4 py-3'>Name</th>
                                <th className='px-4 py-3'>Description</th>
                                <th className='px-4 py-3 text-center'>Servers</th>
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
                                            Export
                                        </a>
                                    </td>
                                </tr>
                            ))}
                            {nest.eggs.length === 0 && (
                                <tr>
                                    <td colSpan={5} className='px-4 py-6 text-center text-cream-400/50'>
                                        No eggs have been added to this nest.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Dialog.Confirm
                open={confirmDelete}
                title='Delete Nest'
                confirm='Delete'
                loading={deleting}
                onClose={() => setConfirmDelete(false)}
                onConfirmed={remove}
            >
                Deleting this nest is permanent and cannot be undone.
            </Dialog.Confirm>
        </div>
    );
};

const NestViewContainer = () => {
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
            <PageContentBlock title='Nest'>
                <div className='rounded-xl border border-mocha-400 bg-mocha-500 p-8 text-center text-sm text-cream-400/60'>
                    That nest could not be found.
                </div>
            </PageContentBlock>
        );
    }

    return (
        <PageContentBlock title={nest.name}>
            <MainPageHeader direction='column' title={nest.name}>
                <p className='text-sm text-neutral-400'>{nest.description || 'No description provided.'}</p>
            </MainPageHeader>

            <NestDetails key={nest.id} nest={nest} onSaved={mutate} />
        </PageContentBlock>
    );
};

export default NestViewContainer;
