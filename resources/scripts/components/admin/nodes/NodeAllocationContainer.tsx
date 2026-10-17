import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useDebouncedCallback } from 'use-debounce';
import { errorToMessage, parseValidationErrors } from '@/api/admin/errors';
import {
    createNodeAllocations,
    deleteAllocation,
    deleteAllocationBlock,
    deleteAllocations,
    type NodeAllocation,
    setAllocationAlias,
    updateAllocationAliases,
} from '@/api/admin/nodes';
import { useNodeAllocations } from '@/api/admin/useNodes';
import { Field } from '@/components/admin/Field';
import Dropdown from '@/components/elements/Dropdown';
import { Dialog } from '@/components/elements/dialog';
import { Input } from '@/components/elements/inputs';
import Spinner from '@/components/elements/Spinner';
import PaginationFooter from '@/components/elements/table/PaginationFooter';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/I18nProvider';

const AliasInput = ({ nodeId, allocation }: { nodeId: string; allocation: NodeAllocation }) => {
    const { t } = useTranslation();
    const [value, setValue] = useState(allocation.ip_alias ?? '');

    const save = useDebouncedCallback((alias: string) => {
        void setAllocationAlias(nodeId, allocation.id, alias).catch((error) =>
            toast.error(errorToMessage(error, t('admin.nodes.alias_save_failed'))),
        );
    }, 500);

    return (
        <Input.Text
            value={value}
            placeholder={t('common.none')}
            onChange={(event) => {
                setValue(event.target.value);
                save(event.target.value);
            }}
        />
    );
};

const NodeAllocationContainer = () => {
    const { t } = useTranslation();
    const { id } = useParams<'id'>();
    const nodeId = id as string;

    const [page, setPage] = useState(1);
    const { data, mutate } = useNodeAllocations(id, page);

    const [selected, setSelected] = useState<number[]>([]);
    const [confirmSingle, setConfirmSingle] = useState<NodeAllocation>();
    const [confirmMultiple, setConfirmMultiple] = useState(false);
    const [confirmBlock, setConfirmBlock] = useState(false);
    const [busy, setBusy] = useState(false);

    const [ip, setIp] = useState('');
    const [alias, setAlias] = useState('');
    const [ports, setPorts] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const [blockIp, setBlockIp] = useState('');
    const [bulkIp, setBulkIp] = useState('');
    const [bulkAlias, setBulkAlias] = useState('');
    const [confirmBulkAlias, setConfirmBulkAlias] = useState(false);

    if (!data) {
        return (
            <div className='flex items-center justify-center py-16'>
                <Spinner centered size={Spinner.Size.LARGE} />
            </div>
        );
    }

    const allocations = data.items;
    const selectable = allocations.filter((allocation) => allocation.server_id === null);
    const allSelected = selectable.length > 0 && selectable.every((allocation) => selected.includes(allocation.id));

    const toggle = (allocationId: number, checked: boolean) =>
        setSelected((current) =>
            checked ? [...current, allocationId] : current.filter((value) => value !== allocationId),
        );

    const submit = async () => {
        setSubmitting(true);
        setErrors({});

        try {
            await createNodeAllocations(nodeId, {
                allocation_ip: ip.trim(),
                allocation_alias: alias,
                allocation_ports: ports
                    .split(/[\s,]+/)
                    .map((port) => port.trim())
                    .filter(Boolean),
            });
            toast.success(t('admin.nodes.allocations_added'));
            setIp('');
            setAlias('');
            setPorts('');
            await mutate();
        } catch (error) {
            setErrors(parseValidationErrors(error));
            toast.error(errorToMessage(error, t('admin.nodes.allocations_add_failed')));
        } finally {
            setSubmitting(false);
        }
    };

    const removeSingle = async () => {
        if (!confirmSingle) {
            return;
        }

        setBusy(true);

        try {
            await deleteAllocation(nodeId, confirmSingle.id);
            toast.success(t('admin.nodes.allocation_deleted'));
            await mutate();
            setConfirmSingle(undefined);
        } catch (error) {
            toast.error(errorToMessage(error, t('admin.nodes.allocation_delete_failed')));
        } finally {
            setBusy(false);
        }
    };

    const removeSelected = async () => {
        setBusy(true);

        try {
            await deleteAllocations(nodeId, selected);
            toast.success(t('admin.nodes.allocations_deleted'));
            setSelected([]);
            await mutate();
            setConfirmMultiple(false);
        } catch (error) {
            toast.error(errorToMessage(error, t('admin.nodes.allocations_delete_failed')));
        } finally {
            setBusy(false);
        }
    };

    const removeBlock = async () => {
        setBusy(true);

        try {
            await deleteAllocationBlock(nodeId, blockIp);
            toast.success(t('admin.nodes.block_deleted', { ip: blockIp }));
            setBlockIp('');
            await mutate();
            setConfirmBlock(false);
        } catch (error) {
            toast.error(errorToMessage(error, t('admin.nodes.allocations_delete_failed')));
        } finally {
            setBusy(false);
        }
    };

    const applyBulkAlias = async () => {
        setBusy(true);

        try {
            const updated = await updateAllocationAliases(nodeId, bulkIp || null, bulkAlias);
            toast.success(t('admin.nodes.aliases_updated', { count: updated }));
            setBulkAlias('');
            await mutate();
            setConfirmBulkAlias(false);
        } catch (error) {
            toast.error(errorToMessage(error, t('admin.nodes.aliases_update_failed')));
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className='grid grid-cols-1 gap-4 lg:grid-cols-3'>
            <div className='flex flex-col gap-4 lg:col-span-2'>
                {selected.length > 0 && (
                    <div className='flex items-center justify-between rounded-lg bg-brand-400/10 px-3 py-2 text-sm text-brand-400'>
                        <span>{t('admin.nodes.selected_count', { count: selected.length })}</span>
                        <Button variant='attention' size='sm' onClick={() => setConfirmMultiple(true)}>
                            {t('admin.nodes.delete_selected')}
                        </Button>
                    </div>
                )}

                <div className='overflow-x-auto rounded-xl border border-mocha-400'>
                    <table className='w-full text-sm'>
                        <thead className='text-left text-xs uppercase tracking-wide text-cream-400/60'>
                            <tr className='border-b border-mocha-400'>
                                <th className='w-10 px-3 py-3'>
                                    <Input.Checkbox
                                        checked={allSelected}
                                        disabled={selectable.length === 0}
                                        onChange={(event) =>
                                            setSelected(event.target.checked ? selectable.map((item) => item.id) : [])
                                        }
                                    />
                                </th>
                                <th className='px-3 py-3'>{t('admin.nodes.ip_address')}</th>
                                <th className='px-3 py-3'>{t('admin.nodes.ip_alias')}</th>
                                <th className='px-3 py-3'>{t('admin.common.port')}</th>
                                <th className='px-3 py-3'>{t('admin.nodes.assigned_to')}</th>
                                <th className='px-3 py-3' />
                            </tr>
                        </thead>
                        <tbody>
                            {allocations.map((allocation) => (
                                <tr key={allocation.id} className='border-b border-mocha-400/40'>
                                    <td className='px-3 py-2 align-middle'>
                                        <Input.Checkbox
                                            disabled={allocation.server_id !== null}
                                            checked={selected.includes(allocation.id)}
                                            onChange={(event) => toggle(allocation.id, event.target.checked)}
                                        />
                                    </td>
                                    <td className='px-3 py-2 align-middle text-cream-100'>{allocation.ip}</td>
                                    <td className='px-3 py-2 align-middle'>
                                        <AliasInput
                                            key={`${allocation.id}:${allocation.ip_alias ?? ''}`}
                                            nodeId={nodeId}
                                            allocation={allocation}
                                        />
                                    </td>
                                    <td className='px-3 py-2 align-middle text-cream-100'>{allocation.port}</td>
                                    <td className='px-3 py-2 align-middle'>
                                        {allocation.server && (
                                            <a
                                                href={`/admin/servers/${allocation.server.id}`}
                                                className='text-cream-50 hover:text-hydro-400'
                                            >
                                                {allocation.server.name}
                                            </a>
                                        )}
                                    </td>
                                    <td className='px-3 py-2 text-right align-middle'>
                                        {allocation.server_id === null && (
                                            <Button
                                                variant='attention'
                                                size='sm'
                                                onClick={() => setConfirmSingle(allocation)}
                                            >
                                                {t('common.delete')}
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {allocations.length === 0 && (
                                <tr>
                                    <td colSpan={6} className='px-3 py-8 text-center text-cream-400/50'>
                                        {t('admin.nodes.allocations_empty')}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {data.pagination.total > 0 && <PaginationFooter pagination={data.pagination} onPageSelect={setPage} />}
            </div>

            <div className='flex flex-col gap-4'>
                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        void submit();
                    }}
                    className='flex flex-col gap-4 rounded-xl border border-mocha-400 bg-mocha-500 p-4'
                >
                    <h2 className='text-sm font-semibold text-cream-50'>{t('admin.nodes.assign_title')}</h2>

                    <Field label={t('admin.nodes.ip_address')} error={errors.allocation_ip}>
                        <Input.Text
                            list='node-allocation-ips'
                            value={ip}
                            placeholder='192.168.1.1'
                            onChange={(event) => setIp(event.target.value)}
                        />
                        <datalist id='node-allocation-ips'>
                            {data.ips.map((value) => (
                                <option key={value} value={value} />
                            ))}
                        </datalist>
                    </Field>

                    <Field
                        label={t('admin.nodes.ip_alias')}
                        error={errors.allocation_alias}
                        hint={t('admin.nodes.ip_alias_hint')}
                    >
                        <Input.Text
                            value={alias}
                            placeholder='alias'
                            onChange={(event) => setAlias(event.target.value)}
                        />
                    </Field>

                    <Field
                        label={t('admin.nodes.ports')}
                        error={errors.allocation_ports ?? errors['allocation_ports.0']}
                        hint={t('admin.nodes.ports_hint')}
                    >
                        <Input.Text
                            value={ports}
                            placeholder='25565, 25566, 3000-3010'
                            onChange={(event) => setPorts(event.target.value)}
                        />
                    </Field>

                    <div className='flex justify-end'>
                        <Button type='submit' disabled={submitting}>
                            {t('common.submit')}
                        </Button>
                    </div>
                </form>

                <div className='rounded-xl border border-mocha-400 bg-mocha-500 p-4'>
                    <h2 className='text-sm font-semibold text-cream-50'>{t('admin.nodes.bulk_alias_title')}</h2>
                    <p className='mt-1 text-xs text-cream-400/60'>{t('admin.nodes.bulk_alias_description')}</p>
                    <div className='mt-3 space-y-4'>
                        <Field label={t('admin.nodes.ip_address')}>
                            <Dropdown
                                value={bulkIp}
                                onChange={setBulkIp}
                                options={[
                                    { value: '', label: t('admin.nodes.all_ips') },
                                    ...data.ips.map((value) => ({ value, label: value })),
                                ]}
                            />
                        </Field>
                        <Field label={t('admin.nodes.alias')} hint={t('admin.nodes.alias_clear_hint')}>
                            <Input.Text
                                value={bulkAlias}
                                placeholder={t('common.none')}
                                onChange={(event) => setBulkAlias(event.target.value)}
                            />
                        </Field>
                    </div>
                    <Button className='mt-3' onClick={() => setConfirmBulkAlias(true)}>
                        {t('admin.nodes.apply_alias')}
                    </Button>
                </div>

                <div className='rounded-xl border border-brand-400/40 bg-brand-400/5 p-4'>
                    <h2 className='text-sm font-semibold text-brand-400'>{t('admin.nodes.delete_block_title')}</h2>
                    <p className='mt-1 text-xs text-cream-400/70'>{t('admin.nodes.delete_block_description')}</p>
                    <div className='mt-3'>
                        <Dropdown
                            value={blockIp}
                            onChange={setBlockIp}
                            placeholder={t('admin.nodes.select_ip')}
                            options={data.ips.map((value) => ({ value, label: value }))}
                        />
                    </div>
                    <Button
                        variant='attention'
                        className='mt-3'
                        disabled={!blockIp}
                        onClick={() => setConfirmBlock(true)}
                    >
                        {t('admin.nodes.delete_allocations')}
                    </Button>
                </div>
            </div>

            <Dialog.Confirm
                open={!!confirmSingle}
                title={t('admin.nodes.delete_allocation_title')}
                confirm={t('common.delete')}
                loading={busy}
                onClose={() => setConfirmSingle(undefined)}
                onConfirmed={removeSingle}
            >
                {t('admin.nodes.delete_allocation_confirm', {
                    ip: confirmSingle?.ip ?? '',
                    port: confirmSingle?.port ?? '',
                })}
            </Dialog.Confirm>

            <Dialog.Confirm
                open={confirmMultiple}
                title={t('admin.nodes.delete_allocations')}
                confirm={t('common.delete')}
                loading={busy}
                onClose={() => setConfirmMultiple(false)}
                onConfirmed={removeSelected}
            >
                {t('admin.nodes.delete_allocations_confirm', { count: selected.length })}
            </Dialog.Confirm>

            <Dialog.Confirm
                open={confirmBlock}
                title={t('admin.nodes.delete_block_title')}
                confirm={t('common.delete')}
                loading={busy}
                onClose={() => setConfirmBlock(false)}
                onConfirmed={removeBlock}
            >
                {t('admin.nodes.delete_block_confirm', { ip: blockIp })}
            </Dialog.Confirm>

            <Dialog.Confirm
                open={confirmBulkAlias}
                title={t('admin.nodes.update_alias_title')}
                confirm={t('common.apply')}
                loading={busy}
                onClose={() => setConfirmBulkAlias(false)}
                onConfirmed={applyBulkAlias}
            >
                {t('admin.nodes.update_alias_confirm', {
                    alias: bulkAlias ? `"${bulkAlias}"` : t('admin.nodes.alias_blank'),
                    target: bulkIp ? t('admin.nodes.target_ip', { ip: bulkIp }) : t('admin.nodes.target_every_ip'),
                })}
            </Dialog.Confirm>
        </div>
    );
};

export default NodeAllocationContainer;
