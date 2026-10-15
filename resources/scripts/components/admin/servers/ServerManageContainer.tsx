import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import useSWR from 'swr';
import { errorToMessage } from '@/api/admin/errors';
import {
    getTransferAllocations,
    reinstallServer,
    type ServerManageData,
    setServerSuspension,
    toggleServerInstall,
    transferServer,
} from '@/api/admin/servers';
import { useServer, useServerManage } from '@/api/admin/useServers';
import { Field } from '@/components/admin/Field';
import Dropdown from '@/components/elements/Dropdown';
import { Dialog } from '@/components/elements/dialog';
import { Input } from '@/components/elements/inputs';
import Spinner from '@/components/elements/Spinner';
import { Button } from '@/components/ui/button';

const cardClass = 'flex flex-col gap-3 rounded-xl border border-mocha-400 bg-mocha-500 p-4';

const TransferDialog = ({
    serverId,
    manage,
    open,
    onClose,
    onDone,
}: {
    serverId: number;
    manage: ServerManageData;
    open: boolean;
    onClose: () => void;
    onDone: () => Promise<unknown>;
}) => {
    const [nodeId, setNodeId] = useState('');
    const [allocationId, setAllocationId] = useState('');
    const [additional, setAdditional] = useState<number[]>([]);
    const [submitting, setSubmitting] = useState(false);

    const { data: allocations, isValidating } = useSWR(
        nodeId ? ['admin:transfer-allocations', serverId, nodeId] : null,
        () => getTransferAllocations(serverId, Number(nodeId)),
        { revalidateOnFocus: false },
    );

    const nodeOptions = manage.locations.flatMap((location) =>
        location.nodes.map((node) => ({
            value: String(node.id),
            label: node.name,
            description: location.long ? `${location.long} (${location.short})` : location.short,
        })),
    );

    const submit = async () => {
        setSubmitting(true);

        try {
            await transferServer(serverId, {
                node_id: Number(nodeId),
                allocation_id: Number(allocationId),
                allocation_additional: additional,
            });
            await onDone();
            toast.success('Server transfer has been queued.');
            onClose();
        } catch (error) {
            toast.error(errorToMessage(error, 'Failed to start the transfer.'));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog
            open={open}
            title='Transfer Server'
            onClose={() => !submitting && onClose()}
            preventExternalClose={submitting}
        >
            <div className='mt-4'>
                <form
                    id='transfer-server-form'
                    onSubmit={(event) => {
                        event.preventDefault();
                        void submit();
                    }}
                    className='flex flex-col gap-4'
                >
                    <Field label='Node' hint='The node this server will be transferred to.'>
                        <Dropdown
                            value={nodeId}
                            onChange={(value) => {
                                setNodeId(value);
                                setAllocationId('');
                                setAdditional([]);
                            }}
                            placeholder='Select a node…'
                            options={nodeOptions}
                        />
                    </Field>

                    <Field label='Default Allocation' hint='The main allocation assigned to this server.'>
                        <Dropdown
                            value={allocationId}
                            onChange={setAllocationId}
                            placeholder={!nodeId ? 'Select a node first…' : 'Select an allocation…'}
                            disabled={!nodeId}
                            options={(allocations ?? []).map((allocation) => ({
                                value: String(allocation.id),
                                label: `${allocation.ip}:${allocation.port}`,
                                description: allocation.alias !== allocation.ip ? allocation.alias : undefined,
                            }))}
                        />
                    </Field>

                    {nodeId && (
                        <Field
                            label='Additional Allocations'
                            hint='Optionally assign extra allocations to this server.'
                        >
                            <div className='max-h-48 overflow-y-auto rounded-lg border border-mocha-400'>
                                {(allocations ?? [])
                                    .filter((allocation) => String(allocation.id) !== allocationId)
                                    .map((allocation) => (
                                        <div
                                            key={allocation.id}
                                            className='flex items-center gap-2 border-b border-mocha-400/40 px-3 py-2 text-sm text-cream-100 last:border-0'
                                        >
                                            <Input.Checkbox
                                                id={`transfer-allocation-${allocation.id}`}
                                                checked={additional.includes(allocation.id)}
                                                onChange={(event) =>
                                                    setAdditional((current) =>
                                                        event.target.checked
                                                            ? [...current, allocation.id]
                                                            : current.filter((value) => value !== allocation.id),
                                                    )
                                                }
                                            />
                                            <label
                                                htmlFor={`transfer-allocation-${allocation.id}`}
                                                className='cursor-pointer'
                                            >
                                                {allocation.ip}:{allocation.port}
                                            </label>
                                        </div>
                                    ))}
                                {!isValidating && (allocations ?? []).length === 0 && (
                                    <div className='px-3 py-2 text-sm text-cream-400/50'>
                                        No unassigned allocations on this node.
                                    </div>
                                )}
                            </div>
                        </Field>
                    )}

                    <Dialog.Footer>
                        <Button type='button' variant='secondary' onClick={onClose} disabled={submitting}>
                            Cancel
                        </Button>
                        <Button
                            type='submit'
                            form='transfer-server-form'
                            disabled={submitting || !nodeId || !allocationId}
                        >
                            Confirm
                        </Button>
                    </Dialog.Footer>
                </form>
            </div>
        </Dialog>
    );
};

const ServerManageContainer = () => {
    const { id } = useParams<'id'>();
    const { data: server, mutate: mutateServer } = useServer(id);
    const { data: manage, error: manageError, mutate: mutateManage } = useServerManage(id);
    const [busy, setBusy] = useState<string>();
    const [confirm, setConfirm] = useState<'reinstall' | 'suspend' | 'unsuspend'>();
    const [transferOpen, setTransferOpen] = useState(false);

    if (manageError) {
        return (
            <div className='rounded-xl border border-brand-400/40 bg-brand-400/5 p-6 text-sm text-brand-400'>
                {errorToMessage(manageError, 'Unable to load the management options for this server.')}
            </div>
        );
    }

    if (!server || !manage) {
        return (
            <div className='flex items-center justify-center py-16'>
                <Spinner centered size={Spinner.Size.LARGE} />
            </div>
        );
    }

    const refresh = async () => {
        await Promise.all([mutateServer(), mutateManage()]);
    };

    const run = async (key: string, action: () => Promise<unknown>, message: string) => {
        setBusy(key);

        try {
            await action();
            await refresh();
            toast.success(message);
        } catch (error) {
            toast.error(errorToMessage(error, 'That action failed.'));
        } finally {
            setBusy(undefined);
        }
    };

    const transferring = manage.transfer !== null;

    return (
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4'>
            <div className={cardClass}>
                <h3 className='text-sm font-semibold text-cream-50'>Reinstall Server</h3>
                <p className='text-xs text-cream-400/60'>
                    Reinstalls the server with the assigned service scripts. This could overwrite server data.
                </p>
                <Button
                    variant='attention'
                    className='mt-auto'
                    disabled={!server.is_installed || busy === 'reinstall'}
                    onClick={() => setConfirm('reinstall')}
                >
                    {server.is_installed ? 'Reinstall Server' : 'Server Must Install First'}
                </Button>
            </div>

            <div className={cardClass}>
                <h3 className='text-sm font-semibold text-cream-50'>Install Status</h3>
                <p className='text-xs text-cream-400/60'>
                    Toggle the install status between installed and uninstalled.
                </p>
                <Button
                    variant='secondary'
                    className='mt-auto'
                    disabled={busy === 'toggle'}
                    onClick={() => void run('toggle', () => toggleServerInstall(server.id), 'Install status toggled.')}
                >
                    Toggle Install Status
                </Button>
            </div>

            {!server.is_suspended ? (
                <div className={cardClass}>
                    <h3 className='text-sm font-semibold text-cream-50'>Suspend Server</h3>
                    <p className='text-xs text-cream-400/60'>
                        Stops all processes and immediately blocks access for users.
                    </p>
                    <Button
                        variant='attention'
                        className='mt-auto'
                        disabled={transferring || busy === 'suspend'}
                        onClick={() => setConfirm('suspend')}
                    >
                        Suspend Server
                    </Button>
                </div>
            ) : (
                <div className={cardClass}>
                    <h3 className='text-sm font-semibold text-cream-50'>Unsuspend Server</h3>
                    <p className='text-xs text-cream-400/60'>Restores normal user access to this server.</p>
                    <Button
                        className='mt-auto'
                        disabled={busy === 'unsuspend'}
                        onClick={() =>
                            void run(
                                'unsuspend',
                                () => setServerSuspension(server.id, 'unsuspend'),
                                'Server unsuspended.',
                            )
                        }
                    >
                        Unsuspend Server
                    </Button>
                </div>
            )}

            <div className={cardClass}>
                <h3 className='text-sm font-semibold text-cream-50'>Transfer Server</h3>
                {transferring ? (
                    <p className='text-xs text-cream-400/60'>
                        This server is being transferred. Transfer started at{' '}
                        <span className='text-cream-100'>
                            {manage.transfer ? new Date(manage.transfer.created_at).toLocaleString() : ''}
                        </span>
                        .
                    </p>
                ) : (
                    <p className='text-xs text-cream-400/60'>Transfer this server to another node on this panel.</p>
                )}
                <Button
                    variant='secondary'
                    className='mt-auto'
                    disabled={transferring || !manage.can_transfer}
                    onClick={() => setTransferOpen(true)}
                >
                    Transfer Server
                </Button>
                {!manage.can_transfer && (
                    <p className='text-xs text-cream-400/50'>
                        Transferring requires more than one node to be configured.
                    </p>
                )}
            </div>

            <Dialog.Confirm
                open={confirm === 'reinstall'}
                title='Reinstall Server'
                confirm='Reinstall'
                loading={busy === 'reinstall'}
                onClose={() => setConfirm(undefined)}
                onConfirmed={async () => {
                    await run('reinstall', () => reinstallServer(server.id), 'Server is being reinstalled.');
                    setConfirm(undefined);
                }}
            >
                Reinstalling this server could overwrite existing server data. Continue?
            </Dialog.Confirm>

            <Dialog.Confirm
                open={confirm === 'suspend'}
                title='Suspend Server'
                confirm='Suspend'
                loading={busy === 'suspend'}
                onClose={() => setConfirm(undefined)}
                onConfirmed={async () => {
                    await run('suspend', () => setServerSuspension(server.id, 'suspend'), 'Server suspended.');
                    setConfirm(undefined);
                }}
            >
                This will stop the server and block all user access. Continue?
            </Dialog.Confirm>

            <TransferDialog
                serverId={server.id}
                manage={manage}
                open={transferOpen}
                onClose={() => setTransferOpen(false)}
                onDone={async () => {
                    await refresh();
                }}
            />
        </div>
    );
};

export default ServerManageContainer;
