import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { errorToMessage, parseValidationErrors } from '@/api/admin/errors';
import {
    type AdminMountDetail,
    addMountEggs,
    addMountNodes,
    deleteMount,
    deleteMountEgg,
    deleteMountNode,
    type MountValues,
    updateMount,
} from '@/api/admin/mounts';
import { useMount } from '@/api/admin/useMounts';
import { Field } from '@/components/admin/Field';
import { Checkbox } from '@/components/elements/CheckboxNew';
import Dropdown from '@/components/elements/Dropdown';
import { Dialog } from '@/components/elements/dialog';
import { Input } from '@/components/elements/inputs';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import PageContentBlock from '@/components/elements/PageContentBlock';
import Spinner from '@/components/elements/Spinner';
import { Button } from '@/components/ui/button';

const cardClass = 'flex flex-col gap-4 rounded-xl border border-mocha-400 bg-mocha-500 p-4';

const boolOptions = [
    { value: 'false', label: 'False' },
    { value: 'true', label: 'True' },
];

interface AttachGroup {
    label: string;
    items: { id: number; name: string }[];
}

const AttachDialog = ({
    open,
    title,
    groups,
    excluded,
    onClose,
    onSubmit,
}: {
    open: boolean;
    title: string;
    groups: AttachGroup[];
    excluded: number[];
    onClose: () => void;
    onSubmit: (ids: number[]) => Promise<unknown>;
}) => {
    const [selected, setSelected] = useState<number[]>([]);
    const [submitting, setSubmitting] = useState(false);

    const filtered = groups
        .map((group) => ({ ...group, items: group.items.filter((item) => !excluded.includes(item.id)) }))
        .filter((group) => group.items.length > 0);

    const submit = async () => {
        setSubmitting(true);

        try {
            await onSubmit(selected);
            setSelected([]);
            onClose();
        } catch (error) {
            toast.error(errorToMessage(error, 'Failed to attach the selection.'));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} title={title} onClose={() => !submitting && onClose()} preventExternalClose={submitting}>
            <div className='mt-4'>
                <form
                    id='attach-form'
                    onSubmit={(event) => {
                        event.preventDefault();
                        void submit();
                    }}
                    className='flex flex-col gap-4'
                >
                    <div className='max-h-64 overflow-y-auto rounded-lg border border-mocha-400'>
                        {filtered.map((group) => (
                            <div key={group.label}>
                                <div className='bg-mocha-400/20 px-3 py-1 text-xs uppercase tracking-wide text-cream-400/60'>
                                    {group.label}
                                </div>
                                {group.items.map((item) => (
                                    <div
                                        key={item.id}
                                        className='flex items-center gap-3 border-b border-mocha-400/40 px-3 py-2 last:border-0'
                                    >
                                        <Checkbox
                                            checked={selected.includes(item.id)}
                                            onCheckedChange={(checked) =>
                                                setSelected((current) =>
                                                    checked === true
                                                        ? [...current, item.id]
                                                        : current.filter((value) => value !== item.id),
                                                )
                                            }
                                        />
                                        <span className='text-sm text-cream-100'>{item.name}</span>
                                    </div>
                                ))}
                            </div>
                        ))}
                        {filtered.length === 0 && (
                            <div className='px-3 py-2 text-sm text-cream-400/50'>Nothing is available to attach.</div>
                        )}
                    </div>

                    <Dialog.Footer>
                        <Button type='button' variant='secondary' onClick={onClose} disabled={submitting}>
                            Cancel
                        </Button>
                        <Button type='submit' form='attach-form' disabled={submitting || selected.length === 0}>
                            Add
                        </Button>
                    </Dialog.Footer>
                </form>
            </div>
        </Dialog>
    );
};

const MountDetailsForm = ({ mount, onSaved }: { mount: AdminMountDetail; onSaved: () => Promise<unknown> }) => {
    const navigate = useNavigate();
    const [values, setValues] = useState<MountValues>({
        name: mount.name,
        description: mount.description ?? '',
        source: mount.source,
        target: mount.target,
        read_only: mount.read_only,
        user_mountable: mount.user_mountable,
    });
    const [submitting, setSubmitting] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const set = <K extends keyof MountValues>(key: K, value: MountValues[K]) =>
        setValues((current) => ({ ...current, [key]: value }));

    const save = async () => {
        setSubmitting(true);
        setErrors({});

        try {
            await updateMount(mount.id, values);
            await onSaved();
            toast.success('Mount updated.');
        } catch (error) {
            setErrors(parseValidationErrors(error));
            toast.error(errorToMessage(error, 'Failed to update the mount.'));
        } finally {
            setSubmitting(false);
        }
    };

    const remove = async () => {
        setDeleting(true);

        try {
            await deleteMount(mount.id);
            toast.success('Mount deleted.');
            navigate('/mounts');
        } catch (error) {
            toast.error(errorToMessage(error, 'Failed to delete the mount.'));
            setDeleting(false);
            setConfirmDelete(false);
        }
    };

    return (
        <form
            onSubmit={(event) => {
                event.preventDefault();
                void save();
            }}
            className={cardClass}
        >
            <h2 className='text-sm font-semibold text-cream-50'>Mount Details</h2>

            <Field label='Unique ID'>
                <Input.Text readOnly className='opacity-70' value={mount.uuid} />
            </Field>
            <Field label='Name' error={errors.name}>
                <Input.Text value={values.name} onChange={(event) => set('name', event.target.value)} />
            </Field>
            <Field label='Description' error={errors.description}>
                <Input.Text value={values.description} onChange={(event) => set('description', event.target.value)} />
            </Field>
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                <Field label='Source' error={errors.source}>
                    <Input.Text value={values.source} onChange={(event) => set('source', event.target.value)} />
                </Field>
                <Field label='Target' error={errors.target}>
                    <Input.Text value={values.target} onChange={(event) => set('target', event.target.value)} />
                </Field>
            </div>
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                <Field label='Read Only' error={errors.read_only}>
                    <Dropdown
                        value={String(values.read_only)}
                        onChange={(value) => set('read_only', value === 'true')}
                        options={boolOptions}
                    />
                </Field>
                <Field label='User Mountable' error={errors.user_mountable}>
                    <Dropdown
                        value={String(values.user_mountable)}
                        onChange={(value) => set('user_mountable', value === 'true')}
                        options={boolOptions}
                    />
                </Field>
            </div>

            <div className='flex items-center justify-between'>
                <Button type='button' variant='attention' onClick={() => setConfirmDelete(true)}>
                    Delete Mount
                </Button>
                <Button type='submit' disabled={submitting}>
                    Save
                </Button>
            </div>

            <Dialog.Confirm
                open={confirmDelete}
                title='Delete Mount'
                confirm='Delete'
                loading={deleting}
                onClose={() => setConfirmDelete(false)}
                onConfirmed={remove}
            >
                Deleting this mount will detach it from every egg and node. This cannot be undone.
            </Dialog.Confirm>
        </form>
    );
};

const MountViewContainer = () => {
    const { id } = useParams<'id'>();
    const { data, mutate } = useMount(id);
    const [eggDialog, setEggDialog] = useState(false);
    const [nodeDialog, setNodeDialog] = useState(false);
    const [busy, setBusy] = useState<number>();

    if (!data) {
        return (
            <div className='flex items-center justify-center py-16'>
                <Spinner centered size={Spinner.Size.LARGE} />
            </div>
        );
    }

    const mount = data.data;

    const detachEgg = async (eggId: number) => {
        setBusy(eggId);

        try {
            await deleteMountEgg(mount.id, eggId);
            await mutate();
            toast.success('Egg detached.');
        } catch (error) {
            toast.error(errorToMessage(error, 'Failed to detach the egg.'));
        } finally {
            setBusy(undefined);
        }
    };

    const detachNode = async (nodeId: number) => {
        setBusy(nodeId);

        try {
            await deleteMountNode(mount.id, nodeId);
            await mutate();
            toast.success('Node detached.');
        } catch (error) {
            toast.error(errorToMessage(error, 'Failed to detach the node.'));
        } finally {
            setBusy(undefined);
        }
    };

    const eggGroups: AttachGroup[] = data.nests.map((nest) => ({ label: nest.name, items: nest.eggs }));
    const nodeGroups: AttachGroup[] = data.locations.map((location) => ({
        label: location.long ?? location.short,
        items: location.nodes,
    }));

    return (
        <PageContentBlock title={mount.name}>
            <MainPageHeader direction='column' title={mount.name}>
                <p className='text-sm text-neutral-400'>{mount.description || 'Mount configuration.'}</p>
            </MainPageHeader>

            <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
                <MountDetailsForm key={mount.id} mount={mount} onSaved={mutate} />

                <div className='flex flex-col gap-4'>
                    <div className='overflow-hidden rounded-xl border border-mocha-400'>
                        <div className='flex items-center justify-between border-b border-mocha-400 px-4 py-3'>
                            <h2 className='text-sm font-semibold text-cream-50'>Eggs</h2>
                            <Button size='sm' variant='secondary' onClick={() => setEggDialog(true)}>
                                Add Eggs
                            </Button>
                        </div>
                        <table className='w-full text-sm'>
                            <thead className='text-left text-xs uppercase tracking-wide text-cream-400/60'>
                                <tr className='border-b border-mocha-400'>
                                    <th className='px-4 py-3'>ID</th>
                                    <th className='px-4 py-3'>Name</th>
                                    <th className='px-4 py-3' />
                                </tr>
                            </thead>
                            <tbody>
                                {mount.eggs.map((egg) => (
                                    <tr key={egg.id} className='border-b border-mocha-400/40'>
                                        <td className='px-4 py-3 font-mono text-cream-400/60'>{egg.id}</td>
                                        <td className='px-4 py-3'>
                                            <Link to={`/eggs/${egg.id}`} className='text-cream-50 hover:text-hydro-400'>
                                                {egg.name}
                                            </Link>
                                        </td>
                                        <td className='px-4 py-3 text-right'>
                                            <Button
                                                size='sm'
                                                variant='attention'
                                                disabled={busy === egg.id}
                                                onClick={() => void detachEgg(egg.id)}
                                            >
                                                Detach
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                                {mount.eggs.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className='px-4 py-5 text-center text-cream-400/50'>
                                            No eggs are attached.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className='overflow-hidden rounded-xl border border-mocha-400'>
                        <div className='flex items-center justify-between border-b border-mocha-400 px-4 py-3'>
                            <h2 className='text-sm font-semibold text-cream-50'>Nodes</h2>
                            <Button size='sm' variant='secondary' onClick={() => setNodeDialog(true)}>
                                Add Nodes
                            </Button>
                        </div>
                        <table className='w-full text-sm'>
                            <thead className='text-left text-xs uppercase tracking-wide text-cream-400/60'>
                                <tr className='border-b border-mocha-400'>
                                    <th className='px-4 py-3'>ID</th>
                                    <th className='px-4 py-3'>Name</th>
                                    <th className='px-4 py-3'>FQDN</th>
                                    <th className='px-4 py-3' />
                                </tr>
                            </thead>
                            <tbody>
                                {mount.nodes.map((node) => (
                                    <tr key={node.id} className='border-b border-mocha-400/40'>
                                        <td className='px-4 py-3 font-mono text-cream-400/60'>{node.id}</td>
                                        <td className='px-4 py-3'>
                                            <Link
                                                to={`/nodes/${node.id}`}
                                                className='text-cream-50 hover:text-hydro-400'
                                            >
                                                {node.name}
                                            </Link>
                                        </td>
                                        <td className='px-4 py-3'>
                                            <code className='text-xs text-cream-400/70'>{node.fqdn}</code>
                                        </td>
                                        <td className='px-4 py-3 text-right'>
                                            <Button
                                                size='sm'
                                                variant='attention'
                                                disabled={busy === node.id}
                                                onClick={() => void detachNode(node.id)}
                                            >
                                                Detach
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                                {mount.nodes.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className='px-4 py-5 text-center text-cream-400/50'>
                                            No nodes are attached.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <AttachDialog
                open={eggDialog}
                title='Add Eggs'
                groups={eggGroups}
                excluded={mount.eggs.map((egg) => egg.id)}
                onClose={() => setEggDialog(false)}
                onSubmit={async (ids) => {
                    await addMountEggs(mount.id, ids);
                    await mutate();
                    toast.success('Eggs attached.');
                }}
            />

            <AttachDialog
                open={nodeDialog}
                title='Add Nodes'
                groups={nodeGroups}
                excluded={mount.nodes.map((node) => node.id)}
                onClose={() => setNodeDialog(false)}
                onSubmit={async (ids) => {
                    await addMountNodes(mount.id, ids);
                    await mutate();
                    toast.success('Nodes attached.');
                }}
            />
        </PageContentBlock>
    );
};

export default MountViewContainer;
