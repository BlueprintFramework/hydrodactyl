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
import { useTranslation } from '@/i18n/I18nProvider';

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
    const { t } = useTranslation();
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
            toast.success(t('admin.servers.transfer_queued'));
            onClose();
        } catch (error) {
            toast.error(errorToMessage(error, t('admin.servers.transfer_failed')));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog
            open={open}
            title={t('admin.servers.transfer')}
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
                    <Field label={t('admin.common.node')} hint={t('admin.servers.transfer_node_hint')}>
                        <Dropdown
                            value={nodeId}
                            onChange={(value) => {
                                setNodeId(value);
                                setAllocationId('');
                                setAdditional([]);
                            }}
                            placeholder={t('admin.servers.select_node')}
                            options={nodeOptions}
                        />
                    </Field>

                    <Field
                        label={t('admin.servers.default_allocation')}
                        hint={t('admin.servers.default_allocation_hint')}
                    >
                        <Dropdown
                            value={allocationId}
                            onChange={setAllocationId}
                            placeholder={
                                !nodeId ? t('admin.servers.select_node_first') : t('admin.servers.select_allocation')
                            }
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
                            label={t('admin.servers.additional_allocations')}
                            hint={t('admin.servers.additional_allocations_hint')}
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
                                        {t('admin.servers.no_unassigned_node')}
                                    </div>
                                )}
                            </div>
                        </Field>
                    )}

                    <Dialog.Footer>
                        <Button type='button' variant='secondary' onClick={onClose} disabled={submitting}>
                            {t('common.cancel')}
                        </Button>
                        <Button
                            type='submit'
                            form='transfer-server-form'
                            disabled={submitting || !nodeId || !allocationId}
                        >
                            {t('common.confirm')}
                        </Button>
                    </Dialog.Footer>
                </form>
            </div>
        </Dialog>
    );
};

const ServerManageContainer = () => {
    const { t } = useTranslation();
    const { id } = useParams<'id'>();
    const { data: server, mutate: mutateServer } = useServer(id);
    const { data: manage, error: manageError, mutate: mutateManage } = useServerManage(id);
    const [busy, setBusy] = useState<string>();
    const [confirm, setConfirm] = useState<'reinstall' | 'suspend' | 'unsuspend'>();
    const [transferOpen, setTransferOpen] = useState(false);

    if (manageError) {
        return (
            <div className='rounded-xl border border-brand-400/40 bg-brand-400/5 p-6 text-sm text-brand-400'>
                {errorToMessage(manageError, t('admin.servers.manage_load_failed'))}
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
            toast.error(errorToMessage(error, t('admin.servers.action_failed')));
        } finally {
            setBusy(undefined);
        }
    };

    const transferring = manage.transfer !== null;

    return (
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4'>
            <div className={cardClass}>
                <h3 className='text-sm font-semibold text-cream-50'>{t('admin.servers.reinstall')}</h3>
                <p className='text-xs text-cream-400/60'>{t('admin.servers.reinstall_description')}</p>
                <Button
                    variant='attention'
                    className='mt-auto'
                    disabled={!server.is_installed || busy === 'reinstall'}
                    onClick={() => setConfirm('reinstall')}
                >
                    {server.is_installed ? t('admin.servers.reinstall') : t('admin.servers.must_install')}
                </Button>
            </div>

            <div className={cardClass}>
                <h3 className='text-sm font-semibold text-cream-50'>{t('admin.servers.install_status')}</h3>
                <p className='text-xs text-cream-400/60'>{t('admin.servers.install_status_description')}</p>
                <Button
                    variant='secondary'
                    className='mt-auto'
                    disabled={busy === 'toggle'}
                    onClick={() =>
                        void run('toggle', () => toggleServerInstall(server.id), t('admin.servers.install_toggled'))
                    }
                >
                    {t('admin.servers.toggle_install')}
                </Button>
            </div>

            {!server.is_suspended ? (
                <div className={cardClass}>
                    <h3 className='text-sm font-semibold text-cream-50'>{t('admin.servers.suspend')}</h3>
                    <p className='text-xs text-cream-400/60'>{t('admin.servers.suspend_description')}</p>
                    <Button
                        variant='attention'
                        className='mt-auto'
                        disabled={transferring || busy === 'suspend'}
                        onClick={() => setConfirm('suspend')}
                    >
                        {t('admin.servers.suspend')}
                    </Button>
                </div>
            ) : (
                <div className={cardClass}>
                    <h3 className='text-sm font-semibold text-cream-50'>{t('admin.servers.unsuspend')}</h3>
                    <p className='text-xs text-cream-400/60'>{t('admin.servers.unsuspend_description')}</p>
                    <Button
                        className='mt-auto'
                        disabled={busy === 'unsuspend'}
                        onClick={() =>
                            void run(
                                'unsuspend',
                                () => setServerSuspension(server.id, 'unsuspend'),
                                t('admin.servers.unsuspended_toast'),
                            )
                        }
                    >
                        {t('admin.servers.unsuspend')}
                    </Button>
                </div>
            )}

            <div className={cardClass}>
                <h3 className='text-sm font-semibold text-cream-50'>{t('admin.servers.transfer')}</h3>
                {transferring ? (
                    <p className='text-xs text-cream-400/60'>
                        {t('admin.servers.transferring_description', {
                            date: manage.transfer ? new Date(manage.transfer.created_at).toLocaleString() : '',
                        })}
                    </p>
                ) : (
                    <p className='text-xs text-cream-400/60'>{t('admin.servers.transfer_description')}</p>
                )}
                <Button
                    variant='secondary'
                    className='mt-auto'
                    disabled={transferring || !manage.can_transfer}
                    onClick={() => setTransferOpen(true)}
                >
                    {t('admin.servers.transfer')}
                </Button>
                {!manage.can_transfer && (
                    <p className='text-xs text-cream-400/50'>{t('admin.servers.transfer_requires_nodes')}</p>
                )}
            </div>

            <Dialog.Confirm
                open={confirm === 'reinstall'}
                title={t('admin.servers.reinstall')}
                confirm={t('admin.servers.reinstall_confirm')}
                loading={busy === 'reinstall'}
                onClose={() => setConfirm(undefined)}
                onConfirmed={async () => {
                    await run('reinstall', () => reinstallServer(server.id), t('admin.servers.reinstalling_toast'));
                    setConfirm(undefined);
                }}
            >
                {t('admin.servers.reinstall_confirm_description')}
            </Dialog.Confirm>

            <Dialog.Confirm
                open={confirm === 'suspend'}
                title={t('admin.servers.suspend')}
                confirm={t('admin.servers.suspend_button')}
                loading={busy === 'suspend'}
                onClose={() => setConfirm(undefined)}
                onConfirmed={async () => {
                    await run(
                        'suspend',
                        () => setServerSuspension(server.id, 'suspend'),
                        t('admin.servers.suspended_toast'),
                    );
                    setConfirm(undefined);
                }}
            >
                {t('admin.servers.suspend_confirm')}
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
