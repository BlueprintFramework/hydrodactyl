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

const AliasInput = ({ nodeId, allocation }: { nodeId: string; allocation: NodeAllocation }) => {
    const [value, setValue] = useState(allocation.ip_alias ?? '');

    const save = useDebouncedCallback((alias: string) => {
        void setAllocationAlias(nodeId, allocation.id, alias).catch((error) =>
            toast.error(errorToMessage(error, 'Failed to save alias.')),
        );
    }, 500);

    return (
        <Input.Text
            value={value}
            placeholder='none'
            onChange={(event) => {
                setValue(event.target.value);
                save(event.target.value);
            }}
        />
    );
};

const NodeAllocationContainer = () => {
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
            toast.success('Allocations added.');
            setIp('');
            setAlias('');
            setPorts('');
            await mutate();
        } catch (error) {
            setErrors(parseValidationErrors(error));
            toast.error(errorToMessage(error, 'Failed to add allocations.'));
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
            toast.success('Allocation deleted.');
            await mutate();
            setConfirmSingle(undefined);
        } catch (error) {
            toast.error(errorToMessage(error, 'Failed to delete allocation.'));
        } finally {
            setBusy(false);
        }
    };

    const removeSelected = async () => {
        setBusy(true);

        try {
            await deleteAllocations(nodeId, selected);
            toast.success('Allocations deleted.');
            setSelected([]);
            await mutate();
            setConfirmMultiple(false);
        } catch (error) {
            toast.error(errorToMessage(error, 'Failed to delete allocations.'));
        } finally {
            setBusy(false);
        }
    };

    const removeBlock = async () => {
        setBusy(true);

        try {
            await deleteAllocationBlock(nodeId, blockIp);
            toast.success(`Deleted allocations for ${blockIp}.`);
            setBlockIp('');
            await mutate();
            setConfirmBlock(false);
        } catch (error) {
            toast.error(errorToMessage(error, 'Failed to delete allocations.'));
        } finally {
            setBusy(false);
        }
    };

    const applyBulkAlias = async () => {
        setBusy(true);

        try {
            const updated = await updateAllocationAliases(nodeId, bulkIp || null, bulkAlias);
            toast.success(`Updated ${updated} allocation(s).`);
            setBulkAlias('');
            await mutate();
            setConfirmBulkAlias(false);
        } catch (error) {
            toast.error(errorToMessage(error, 'Failed to update aliases.'));
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className='grid grid-cols-1 gap-4 lg:grid-cols-3'>
            <div className='flex flex-col gap-4 lg:col-span-2'>
                {selected.length > 0 && (
                    <div className='flex items-center justify-between rounded-lg bg-brand-400/10 px-3 py-2 text-sm text-brand-400'>
                        <span>{selected.length} allocation(s) selected</span>
                        <Button variant='attention' size='sm' onClick={() => setConfirmMultiple(true)}>
                            Delete Selected
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
                                <th className='px-3 py-3'>IP Address</th>
                                <th className='px-3 py-3'>IP Alias</th>
                                <th className='px-3 py-3'>Port</th>
                                <th className='px-3 py-3'>Assigned To</th>
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
                                                Delete
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {allocations.length === 0 && (
                                <tr>
                                    <td colSpan={6} className='px-3 py-8 text-center text-cream-400/50'>
                                        No allocations assigned to this node.
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
                    <h2 className='text-sm font-semibold text-cream-50'>Assign New Allocations</h2>

                    <Field label='IP Address' error={errors.allocation_ip}>
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
                        label='IP Alias'
                        error={errors.allocation_alias}
                        hint='Optional alias applied to the new allocations.'
                    >
                        <Input.Text
                            value={alias}
                            placeholder='alias'
                            onChange={(event) => setAlias(event.target.value)}
                        />
                    </Field>

                    <Field
                        label='Ports'
                        error={errors.allocation_ports ?? errors['allocation_ports.0']}
                        hint='Individual ports or ranges separated by commas or spaces.'
                    >
                        <Input.Text
                            value={ports}
                            placeholder='25565, 25566, 3000-3010'
                            onChange={(event) => setPorts(event.target.value)}
                        />
                    </Field>

                    <div className='flex justify-end'>
                        <Button type='submit' disabled={submitting}>
                            Submit
                        </Button>
                    </div>
                </form>

                <div className='rounded-xl border border-mocha-400 bg-mocha-500 p-4'>
                    <h2 className='text-sm font-semibold text-cream-50'>Bulk IP Alias</h2>
                    <p className='mt-1 text-xs text-cream-400/60'>
                        Apply one alias to every allocation on an IP, or across every IP on this node.
                    </p>
                    <div className='mt-3 space-y-4'>
                        <Field label='IP Address'>
                            <Dropdown
                                value={bulkIp}
                                onChange={setBulkIp}
                                options={[
                                    { value: '', label: 'All IPs' },
                                    ...data.ips.map((value) => ({ value, label: value })),
                                ]}
                            />
                        </Field>
                        <Field label='Alias' hint='Leave blank to clear the alias.'>
                            <Input.Text
                                value={bulkAlias}
                                placeholder='none'
                                onChange={(event) => setBulkAlias(event.target.value)}
                            />
                        </Field>
                    </div>
                    <Button className='mt-3' onClick={() => setConfirmBulkAlias(true)}>
                        Apply Alias
                    </Button>
                </div>

                <div className='rounded-xl border border-brand-400/40 bg-brand-400/5 p-4'>
                    <h2 className='text-sm font-semibold text-brand-400'>Delete IP Block</h2>
                    <p className='mt-1 text-xs text-cream-400/70'>
                        Removes every unassigned allocation for the selected IP address.
                    </p>
                    <div className='mt-3'>
                        <Dropdown
                            value={blockIp}
                            onChange={setBlockIp}
                            placeholder='Select an IP address…'
                            options={data.ips.map((value) => ({ value, label: value }))}
                        />
                    </div>
                    <Button
                        variant='attention'
                        className='mt-3'
                        disabled={!blockIp}
                        onClick={() => setConfirmBlock(true)}
                    >
                        Delete Allocations
                    </Button>
                </div>
            </div>

            <Dialog.Confirm
                open={!!confirmSingle}
                title='Delete Allocation'
                confirm='Delete'
                loading={busy}
                onClose={() => setConfirmSingle(undefined)}
                onConfirmed={removeSingle}
            >
                Deleting {confirmSingle?.ip}:{confirmSingle?.port} is permanent and cannot be undone.
            </Dialog.Confirm>

            <Dialog.Confirm
                open={confirmMultiple}
                title='Delete Allocations'
                confirm='Delete'
                loading={busy}
                onClose={() => setConfirmMultiple(false)}
                onConfirmed={removeSelected}
            >
                Are you sure you want to delete {selected.length} allocation(s)? This cannot be undone.
            </Dialog.Confirm>

            <Dialog.Confirm
                open={confirmBlock}
                title='Delete IP Block'
                confirm='Delete'
                loading={busy}
                onClose={() => setConfirmBlock(false)}
                onConfirmed={removeBlock}
            >
                Every unassigned allocation for {blockIp} will be removed. This cannot be undone.
            </Dialog.Confirm>

            <Dialog.Confirm
                open={confirmBulkAlias}
                title='Update IP Alias'
                confirm='Apply'
                loading={busy}
                onClose={() => setConfirmBulkAlias(false)}
                onConfirmed={applyBulkAlias}
            >
                Set the alias to {bulkAlias ? `"${bulkAlias}"` : 'blank'} for {bulkIp ? `the IP ${bulkIp}` : 'every IP'}{' '}
                on this node?
            </Dialog.Confirm>
        </div>
    );
};

export default NodeAllocationContainer;
