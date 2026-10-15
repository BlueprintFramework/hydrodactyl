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

const emptyValues: MountValues = {
    name: '',
    description: '',
    source: '',
    target: '',
    read_only: false,
    user_mountable: false,
};

const boolOptions = [
    { value: 'false', label: 'False' },
    { value: 'true', label: 'True' },
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
            toast.success('Mount created.');
            setValues(emptyValues);
            onCreated();
            onClose();
        } catch (error) {
            setErrors(parseValidationErrors(error));
            toast.error(errorToMessage(error, 'Failed to create the mount.'));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} title='Create Mount' onClose={close} preventExternalClose={submitting}>
            <div className='mt-4'>
                <form
                    id='create-mount-form'
                    onSubmit={(event) => {
                        event.preventDefault();
                        void submit();
                    }}
                    className='flex flex-col gap-4'
                >
                    <Field
                        label='Name'
                        error={errors.name}
                        hint='Unique name used to separate this mount from another.'
                    >
                        <Input.Text value={values.name} onChange={(event) => set('name', event.target.value)} />
                    </Field>
                    <Field label='Description' error={errors.description} hint='Optional, less than 191 characters.'>
                        <Input.Text
                            value={values.description}
                            onChange={(event) => set('description', event.target.value)}
                        />
                    </Field>
                    <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                        <Field label='Source' error={errors.source} hint='Path on the host to mount.'>
                            <Input.Text value={values.source} onChange={(event) => set('source', event.target.value)} />
                        </Field>
                        <Field label='Target' error={errors.target} hint='Path inside the container.'>
                            <Input.Text value={values.target} onChange={(event) => set('target', event.target.value)} />
                        </Field>
                    </div>
                    <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                        <Field
                            label='Read Only'
                            error={errors.read_only}
                            hint='Mount as read only inside the container.'
                        >
                            <Dropdown
                                value={String(values.read_only)}
                                onChange={(value) => set('read_only', value === 'true')}
                                options={boolOptions}
                            />
                        </Field>
                        <Field
                            label='User Mountable'
                            error={errors.user_mountable}
                            hint='Allow users to mount this themselves.'
                        >
                            <Dropdown
                                value={String(values.user_mountable)}
                                onChange={(value) => set('user_mountable', value === 'true')}
                                options={boolOptions}
                            />
                        </Field>
                    </div>
                    <Dialog.Footer>
                        <Button type='button' variant='secondary' onClick={close} disabled={submitting}>
                            Cancel
                        </Button>
                        <Button type='submit' form='create-mount-form' disabled={submitting}>
                            Create
                        </Button>
                    </Dialog.Footer>
                </form>
            </div>
        </Dialog>
    );
};

const MountsContainer = () => {
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
        <PageContentBlock title='Mounts'>
            <MainPageHeader direction='column' title='Mounts'>
                <p className='text-sm text-neutral-400'>Configure and manage additional mount points for servers.</p>
            </MainPageHeader>

            <div className='mb-4 flex justify-end'>
                <Button onClick={() => setCreateOpen(true)}>Create Mount</Button>
            </div>

            <div className='overflow-x-auto rounded-xl border border-mocha-400'>
                <table className='w-full text-sm'>
                    <thead className='text-left text-xs uppercase tracking-wide text-cream-400/60'>
                        <tr className='border-b border-mocha-400'>
                            <th className='px-4 py-3'>ID</th>
                            <th className='px-4 py-3'>Name</th>
                            <th className='px-4 py-3'>Source</th>
                            <th className='px-4 py-3'>Target</th>
                            <th className='px-4 py-3 text-center'>Eggs</th>
                            <th className='px-4 py-3 text-center'>Nodes</th>
                            <th className='px-4 py-3 text-center'>Servers</th>
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
                                    No mounts have been created.
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
