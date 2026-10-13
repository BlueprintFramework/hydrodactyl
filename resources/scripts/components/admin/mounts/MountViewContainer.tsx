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
import { useTranslation } from '@/i18n/I18nProvider';
import type { Translate } from '@/i18n/types';

const cardClass = 'flex flex-col gap-4 rounded-xl border border-mocha-400 bg-mocha-500 p-4';

const boolOptions = (t: Translate) => [
    { value: 'false', label: t('admin.common.false') },
    { value: 'true', label: t('admin.common.true') },
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
    const { t } = useTranslation();
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
            toast.error(errorToMessage(error, t('admin.mounts.attach_failed')));
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
                            <div className='px-3 py-2 text-sm text-cream-400/50'>
                                {t('admin.mounts.nothing_to_attach')}
                            </div>
                        )}
                    </div>

                    <Dialog.Footer>
                        <Button type='button' variant='secondary' onClick={onClose} disabled={submitting}>
                            {t('common.cancel')}
                        </Button>
                        <Button type='submit' form='attach-form' disabled={submitting || selected.length === 0}>
                            {t('common.add')}
                        </Button>
                    </Dialog.Footer>
                </form>
            </div>
        </Dialog>
    );
};

const MountDetailsForm = ({ mount, onSaved }: { mount: AdminMountDetail; onSaved: () => Promise<unknown> }) => {
    const { t } = useTranslation();
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
            toast.success(t('admin.mounts.updated'));
        } catch (error) {
            setErrors(parseValidationErrors(error));
            toast.error(errorToMessage(error, t('admin.mounts.update_failed')));
        } finally {
            setSubmitting(false);
        }
    };

    const remove = async () => {
        setDeleting(true);

        try {
            await deleteMount(mount.id);
            toast.success(t('admin.mounts.deleted'));
            navigate('/mounts');
        } catch (error) {
            toast.error(errorToMessage(error, t('admin.mounts.delete_failed')));
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
            <h2 className='text-sm font-semibold text-cream-50'>{t('admin.mounts.details')}</h2>

            <Field label={t('admin.mounts.unique_id')}>
                <Input.Text readOnly className='opacity-70' value={mount.uuid} />
            </Field>
            <Field label={t('admin.common.name')} error={errors.name}>
                <Input.Text value={values.name} onChange={(event) => set('name', event.target.value)} />
            </Field>
            <Field label={t('admin.common.description')} error={errors.description}>
                <Input.Text value={values.description} onChange={(event) => set('description', event.target.value)} />
            </Field>
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                <Field label={t('admin.mounts.source')} error={errors.source}>
                    <Input.Text value={values.source} onChange={(event) => set('source', event.target.value)} />
                </Field>
                <Field label={t('admin.mounts.target')} error={errors.target}>
                    <Input.Text value={values.target} onChange={(event) => set('target', event.target.value)} />
                </Field>
            </div>
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                <Field label={t('admin.mounts.read_only')} error={errors.read_only}>
                    <Dropdown
                        value={String(values.read_only)}
                        onChange={(value) => set('read_only', value === 'true')}
                        options={boolOptions(t)}
                    />
                </Field>
                <Field label={t('admin.mounts.user_mountable')} error={errors.user_mountable}>
                    <Dropdown
                        value={String(values.user_mountable)}
                        onChange={(value) => set('user_mountable', value === 'true')}
                        options={boolOptions(t)}
                    />
                </Field>
            </div>

            <div className='flex items-center justify-between'>
                <Button type='button' variant='attention' onClick={() => setConfirmDelete(true)}>
                    {t('admin.mounts.delete')}
                </Button>
                <Button type='submit' disabled={submitting}>
                    {t('common.save')}
                </Button>
            </div>

            <Dialog.Confirm
                open={confirmDelete}
                title={t('admin.mounts.delete')}
                confirm={t('common.delete')}
                loading={deleting}
                onClose={() => setConfirmDelete(false)}
                onConfirmed={remove}
            >
                {t('admin.mounts.delete_confirm')}
            </Dialog.Confirm>
        </form>
    );
};

const MountViewContainer = () => {
    const { t } = useTranslation();
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
            toast.success(t('admin.mounts.egg_detached'));
        } catch (error) {
            toast.error(errorToMessage(error, t('admin.mounts.egg_detach_failed')));
        } finally {
            setBusy(undefined);
        }
    };

    const detachNode = async (nodeId: number) => {
        setBusy(nodeId);

        try {
            await deleteMountNode(mount.id, nodeId);
            await mutate();
            toast.success(t('admin.mounts.node_detached'));
        } catch (error) {
            toast.error(errorToMessage(error, t('admin.mounts.node_detach_failed')));
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
                <p className='text-sm text-neutral-400'>{mount.description || t('admin.mounts.mount_configuration')}</p>
            </MainPageHeader>

            <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
                <MountDetailsForm key={mount.id} mount={mount} onSaved={mutate} />

                <div className='flex flex-col gap-4'>
                    <div className='overflow-hidden rounded-xl border border-mocha-400'>
                        <div className='flex items-center justify-between border-b border-mocha-400 px-4 py-3'>
                            <h2 className='text-sm font-semibold text-cream-50'>{t('admin.mounts.eggs')}</h2>
                            <Button size='sm' variant='secondary' onClick={() => setEggDialog(true)}>
                                {t('admin.mounts.add_eggs')}
                            </Button>
                        </div>
                        <table className='w-full text-sm'>
                            <thead className='text-left text-xs uppercase tracking-wide text-cream-400/60'>
                                <tr className='border-b border-mocha-400'>
                                    <th className='px-4 py-3'>{t('admin.common.id')}</th>
                                    <th className='px-4 py-3'>{t('admin.common.name')}</th>
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
                                                {t('admin.mounts.detach')}
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                                {mount.eggs.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className='px-4 py-5 text-center text-cream-400/50'>
                                            {t('admin.mounts.no_eggs')}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className='overflow-hidden rounded-xl border border-mocha-400'>
                        <div className='flex items-center justify-between border-b border-mocha-400 px-4 py-3'>
                            <h2 className='text-sm font-semibold text-cream-50'>{t('admin.common.nodes')}</h2>
                            <Button size='sm' variant='secondary' onClick={() => setNodeDialog(true)}>
                                {t('admin.mounts.add_nodes')}
                            </Button>
                        </div>
                        <table className='w-full text-sm'>
                            <thead className='text-left text-xs uppercase tracking-wide text-cream-400/60'>
                                <tr className='border-b border-mocha-400'>
                                    <th className='px-4 py-3'>{t('admin.common.id')}</th>
                                    <th className='px-4 py-3'>{t('admin.common.name')}</th>
                                    <th className='px-4 py-3'>{t('admin.common.fqdn')}</th>
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
                                                {t('admin.mounts.detach')}
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                                {mount.nodes.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className='px-4 py-5 text-center text-cream-400/50'>
                                            {t('admin.mounts.no_nodes')}
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
                title={t('admin.mounts.add_eggs')}
                groups={eggGroups}
                excluded={mount.eggs.map((egg) => egg.id)}
                onClose={() => setEggDialog(false)}
                onSubmit={async (ids) => {
                    await addMountEggs(mount.id, ids);
                    await mutate();
                    toast.success(t('admin.mounts.eggs_attached'));
                }}
            />

            <AttachDialog
                open={nodeDialog}
                title={t('admin.mounts.add_nodes')}
                groups={nodeGroups}
                excluded={mount.nodes.map((node) => node.id)}
                onClose={() => setNodeDialog(false)}
                onSubmit={async (ids) => {
                    await addMountNodes(mount.id, ids);
                    await mutate();
                    toast.success(t('admin.mounts.nodes_attached'));
                }}
            />
        </PageContentBlock>
    );
};

export default MountViewContainer;
