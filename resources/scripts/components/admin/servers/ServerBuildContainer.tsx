import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { errorToMessage, parseValidationErrors } from '@/api/admin/errors';
import {
    type ServerAllocationOption,
    type ServerBuildResponse,
    type ServerBuildValues,
    updateServerBuild,
} from '@/api/admin/servers';
import { useServerBuild } from '@/api/admin/useServers';
import { Field } from '@/components/admin/Field';
import { Checkbox } from '@/components/elements/CheckboxNew';
import Dropdown from '@/components/elements/Dropdown';
import { Input } from '@/components/elements/inputs';
import Spinner from '@/components/elements/Spinner';
import VirtualizedList from '@/components/elements/VirtualizedList';
import { Button } from '@/components/ui/button';

interface FormState {
    cpu: string;
    threads: string;
    memory: string;
    overhead_memory: string;
    swap: string;
    disk: string;
    io: string;
    database_limit: string;
    allocation_limit: string;
    backup_limit: string;
    backup_storage_limit: string;
    oom_disabled: boolean;
    exclude_from_resource_calculation: boolean;
    software_enabled: boolean;
}

const AllocationChecklist = ({
    allocations,
    selected,
    onToggle,
    emptyLabel,
}: {
    allocations: ServerAllocationOption[];
    selected: number[];
    onToggle: (id: number, checked: boolean) => void;
    emptyLabel: string;
}) => {
    const [search, setSearch] = useState('');
    const term = search.trim().toLowerCase();

    const filtered = useMemo(
        () =>
            term
                ? allocations.filter((allocation) =>
                      `${allocation.alias}:${allocation.port} ${allocation.ip}`.toLowerCase().includes(term),
                  )
                : allocations,
        [allocations, term],
    );

    return (
        <div className='flex flex-col gap-2'>
            <Input.Text
                placeholder='Search allocations…'
                value={search}
                onChange={(event) => setSearch(event.target.value)}
            />
            <VirtualizedList
                items={filtered}
                className='rounded-lg border border-mocha-400'
                maxHeight={176}
                estimateSize={() => 38}
                overscan={8}
                itemClassName=''
                renderItem={(allocation) => (
                    <div className='flex items-center gap-3 border-b border-mocha-400/40 px-3 py-2'>
                        <Checkbox
                            checked={selected.includes(allocation.id)}
                            onCheckedChange={(checked) => onToggle(allocation.id, checked === true)}
                        />
                        <span className='text-sm text-cream-100'>
                            {allocation.alias}:{allocation.port}
                        </span>
                    </div>
                )}
                emptyState={
                    <div className='px-3 py-2 text-sm text-cream-400/50'>
                        {allocations.length === 0 ? emptyLabel : 'No allocations match your search.'}
                    </div>
                }
            />
        </div>
    );
};

const ServerBuildForm = ({
    serverId,
    build,
    onSaved,
}: {
    serverId: number;
    build: ServerBuildResponse;
    onSaved: () => Promise<unknown>;
}) => {
    const { data, assigned, unassigned } = build;
    const isElytra = data.node_daemon_type === 'elytra';

    const [allocationId, setAllocationId] = useState(String(data.allocation_id));
    const [add, setAdd] = useState<number[]>([]);
    const [remove, setRemove] = useState<number[]>([]);
    const [values, setValues] = useState<FormState>({
        cpu: String(data.cpu),
        threads: data.threads ?? '',
        memory: String(data.memory),
        overhead_memory: String(data.overhead_memory),
        swap: String(data.swap),
        disk: String(data.disk),
        io: String(data.io),
        database_limit: data.database_limit === null ? '' : String(data.database_limit),
        allocation_limit: data.allocation_limit === null ? '' : String(data.allocation_limit),
        backup_limit: data.backup_limit === null ? '' : String(data.backup_limit),
        backup_storage_limit: data.backup_storage_limit === null ? '' : String(data.backup_storage_limit),
        oom_disabled: data.oom_disabled,
        exclude_from_resource_calculation: data.exclude_from_resource_calculation,
        software_enabled: data.software_enabled,
    });
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
        setValues((current) => ({ ...current, [key]: value }));

    const toggle = (list: 'add' | 'remove') => (id: number, checked: boolean) => {
        const setter = list === 'add' ? setAdd : setRemove;
        setter((current) => (checked ? [...current, id] : current.filter((value) => value !== id)));
    };

    const submit = async () => {
        setSubmitting(true);
        setErrors({});

        const payload: ServerBuildValues = {
            allocation_id: Number(allocationId),
            add_allocations: add,
            remove_allocations: remove,
            ...values,
            backup_storage_limit: isElytra ? values.backup_storage_limit : '',
        };

        try {
            await updateServerBuild(serverId, payload);
            await onSaved();
            setAdd([]);
            setRemove([]);
            toast.success('Build configuration updated.');
        } catch (error) {
            setErrors(parseValidationErrors(error));
            toast.error(errorToMessage(error, 'Failed to update the build configuration.'));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form
            onSubmit={(event) => {
                event.preventDefault();
                void submit();
            }}
            className='grid grid-cols-1 gap-4 lg:grid-cols-12'
        >
            <div className='flex flex-col gap-4 rounded-xl border border-mocha-400 bg-mocha-500 p-4 lg:col-span-5'>
                <h2 className='text-sm font-semibold text-cream-50'>Resource Management</h2>

                <Field
                    label='CPU Limit'
                    error={errors.cpu}
                    hint='Each thread is 100%. Set to 0 for unrestricted CPU time.'
                >
                    <Input.Text type='number' value={values.cpu} onChange={(e) => set('cpu', e.target.value)} />
                </Field>

                <Field label='CPU Pinning' error={errors.threads} hint='Advanced: e.g. 0, 0-1,3 or 0,1,3,4.'>
                    <Input.Text value={values.threads} onChange={(e) => set('threads', e.target.value)} />
                </Field>

                <Field label='Allocated Memory' error={errors.memory} hint='MiB. Set to 0 for unlimited.'>
                    <Input.Text type='number' value={values.memory} onChange={(e) => set('memory', e.target.value)} />
                </Field>

                <Field
                    label='Overhead Memory'
                    error={errors.overhead_memory}
                    hint='MiB. Extra memory not exposed to SERVER_MEMORY. 0 disables it.'
                >
                    <Input.Text
                        type='number'
                        value={values.overhead_memory}
                        onChange={(e) => set('overhead_memory', e.target.value)}
                    />
                </Field>

                <Field label='Allocated Swap' error={errors.swap} hint='MiB. 0 disables swap, -1 is unlimited.'>
                    <Input.Text type='number' value={values.swap} onChange={(e) => set('swap', e.target.value)} />
                </Field>

                <Field label='Disk Space Limit' error={errors.disk} hint='MiB. Set to 0 for unlimited disk usage.'>
                    <Input.Text type='number' value={values.disk} onChange={(e) => set('disk', e.target.value)} />
                </Field>

                <Field label='Block IO Proportion' error={errors.io} hint='Advanced: between 10 and 1000.'>
                    <Input.Text type='number' value={values.io} onChange={(e) => set('io', e.target.value)} />
                </Field>

                <Field
                    label='OOM Killer'
                    error={errors.oom_disabled}
                    hint='Enabling may cause processes to exit unexpectedly.'
                >
                    <Dropdown
                        value={String(values.oom_disabled)}
                        onChange={(value) => set('oom_disabled', value === 'true')}
                        options={[
                            { value: 'false', label: 'Enabled' },
                            { value: 'true', label: 'Disabled' },
                        ]}
                    />
                </Field>

                <Field
                    label='Resource Calculation'
                    error={errors.exclude_from_resource_calculation}
                    hint='Excluded servers are ignored when provisioning new servers onto this node.'
                >
                    <Dropdown
                        value={String(values.exclude_from_resource_calculation)}
                        onChange={(value) => set('exclude_from_resource_calculation', value === 'true')}
                        options={[
                            { value: 'false', label: 'Included' },
                            { value: 'true', label: 'Excluded' },
                        ]}
                    />
                </Field>

                <Field
                    label='Software Page'
                    error={errors.software_enabled}
                    hint='When disabled, the built-in Software page is hidden from users on this server.'
                >
                    <Dropdown
                        value={String(values.software_enabled)}
                        onChange={(value) => set('software_enabled', value === 'true')}
                        options={[
                            { value: 'true', label: 'Enabled' },
                            { value: 'false', label: 'Disabled' },
                        ]}
                    />
                </Field>
            </div>

            <div className='flex flex-col gap-4 lg:col-span-7'>
                <div className='flex flex-col gap-4 rounded-xl border border-mocha-400 bg-mocha-500 p-4'>
                    <h2 className='text-sm font-semibold text-cream-50'>Application Feature Limits</h2>
                    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                        <Field
                            label='Database Limit'
                            error={errors.database_limit}
                            hint='Blank is unlimited, 0 disables.'
                        >
                            <Input.Text
                                type='number'
                                value={values.database_limit}
                                onChange={(e) => set('database_limit', e.target.value)}
                            />
                        </Field>
                        <Field
                            label='Allocation Limit'
                            error={errors.allocation_limit}
                            hint='Blank is unlimited, 0 disables.'
                        >
                            <Input.Text
                                type='number'
                                value={values.allocation_limit}
                                onChange={(e) => set('allocation_limit', e.target.value)}
                            />
                        </Field>
                        <Field label='Backup Limit' error={errors.backup_limit} hint='Blank is unlimited, 0 disables.'>
                            <Input.Text
                                type='number'
                                value={values.backup_limit}
                                onChange={(e) => set('backup_limit', e.target.value)}
                            />
                        </Field>
                        {isElytra && (
                            <Field
                                label='Backup Storage Limit'
                                error={errors.backup_storage_limit}
                                hint='MiB. Blank is unlimited. Elytra only.'
                            >
                                <Input.Text
                                    type='number'
                                    value={values.backup_storage_limit}
                                    onChange={(e) => set('backup_storage_limit', e.target.value)}
                                />
                            </Field>
                        )}
                    </div>
                </div>

                <div className='flex flex-1 flex-col gap-4 rounded-xl border border-mocha-400 bg-mocha-500 p-4'>
                    <h2 className='text-sm font-semibold text-cream-50'>Allocation Management</h2>

                    <Field
                        label='Game Port'
                        error={errors.allocation_id}
                        hint='The default connection address for this server.'
                    >
                        <Dropdown
                            value={allocationId}
                            onChange={setAllocationId}
                            options={assigned.map((allocation) => ({
                                value: String(allocation.id),
                                label: `${allocation.alias}:${allocation.port}`,
                                description: allocation.alias !== allocation.ip ? allocation.ip : undefined,
                            }))}
                        />
                    </Field>

                    <Field
                        label='Assign Additional Ports'
                        error={errors.add_allocations}
                        hint='You cannot assign identical ports on different IPs to the same server.'
                    >
                        <AllocationChecklist
                            allocations={unassigned}
                            selected={add}
                            onToggle={toggle('add')}
                            emptyLabel='No unassigned allocations are available on this node.'
                        />
                    </Field>

                    <Field
                        label='Remove Additional Ports'
                        error={errors.remove_allocations}
                        hint='Select the ports you would like to remove from this server.'
                    >
                        <AllocationChecklist
                            allocations={assigned}
                            selected={remove}
                            onToggle={toggle('remove')}
                            emptyLabel='This server has no allocations to remove.'
                        />
                    </Field>

                    <div className='flex justify-end'>
                        <Button type='submit' disabled={submitting}>
                            Update Build Configuration
                        </Button>
                    </div>
                </div>
            </div>
        </form>
    );
};

const ServerBuildContainer = () => {
    const { id } = useParams<'id'>();
    const { data: build, mutate } = useServerBuild(id);

    if (!build) {
        return (
            <div className='flex items-center justify-center py-16'>
                <Spinner centered size={Spinner.Size.LARGE} />
            </div>
        );
    }

    return <ServerBuildForm key={String(id)} serverId={Number(id)} build={build} onSaved={mutate} />;
};

export default ServerBuildContainer;
