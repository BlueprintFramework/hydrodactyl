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
import { useTranslation } from '@/i18n/I18nProvider';

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
    const { t } = useTranslation();
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
                placeholder={t('admin.servers.search_allocations')}
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
                        {allocations.length === 0 ? emptyLabel : t('admin.servers.no_allocations_match')}
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
    const { t } = useTranslation();
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
            toast.success(t('admin.servers.build_updated'));
        } catch (error) {
            setErrors(parseValidationErrors(error));
            toast.error(errorToMessage(error, t('admin.servers.build_update_failed')));
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
                <h2 className='text-sm font-semibold text-cream-50'>{t('admin.servers.resource_title')}</h2>

                <Field
                    label={t('admin.servers.cpu_limit')}
                    error={errors.cpu}
                    hint={t('admin.servers.cpu_limit_hint_build')}
                >
                    <Input.Text type='number' value={values.cpu} onChange={(e) => set('cpu', e.target.value)} />
                </Field>

                <Field
                    label={t('admin.servers.cpu_pinning')}
                    error={errors.threads}
                    hint={t('admin.servers.cpu_pinning_hint_build')}
                >
                    <Input.Text value={values.threads} onChange={(e) => set('threads', e.target.value)} />
                </Field>

                <Field
                    label={t('admin.servers.allocated_memory')}
                    error={errors.memory}
                    hint={t('admin.servers.allocated_memory_hint')}
                >
                    <Input.Text type='number' value={values.memory} onChange={(e) => set('memory', e.target.value)} />
                </Field>

                <Field
                    label={t('admin.servers.overhead_memory')}
                    error={errors.overhead_memory}
                    hint={t('admin.servers.overhead_hint_build')}
                >
                    <Input.Text
                        type='number'
                        value={values.overhead_memory}
                        onChange={(e) => set('overhead_memory', e.target.value)}
                    />
                </Field>

                <Field
                    label={t('admin.servers.allocated_swap')}
                    error={errors.swap}
                    hint={t('admin.servers.swap_hint_build')}
                >
                    <Input.Text type='number' value={values.swap} onChange={(e) => set('swap', e.target.value)} />
                </Field>

                <Field
                    label={t('admin.servers.disk_limit')}
                    error={errors.disk}
                    hint={t('admin.servers.disk_limit_hint')}
                >
                    <Input.Text type='number' value={values.disk} onChange={(e) => set('disk', e.target.value)} />
                </Field>

                <Field
                    label={t('admin.servers.block_io_proportion')}
                    error={errors.io}
                    hint={t('admin.servers.block_io_hint_build')}
                >
                    <Input.Text type='number' value={values.io} onChange={(e) => set('io', e.target.value)} />
                </Field>

                <Field
                    label={t('admin.servers.oom_killer_label')}
                    error={errors.oom_disabled}
                    hint={t('admin.servers.oom_hint')}
                >
                    <Dropdown
                        value={String(values.oom_disabled)}
                        onChange={(value) => set('oom_disabled', value === 'true')}
                        options={[
                            { value: 'false', label: t('common.enabled') },
                            { value: 'true', label: t('common.disabled') },
                        ]}
                    />
                </Field>

                <Field
                    label={t('admin.servers.resource_calculation')}
                    error={errors.exclude_from_resource_calculation}
                    hint={t('admin.servers.resource_calculation_hint')}
                >
                    <Dropdown
                        value={String(values.exclude_from_resource_calculation)}
                        onChange={(value) => set('exclude_from_resource_calculation', value === 'true')}
                        options={[
                            { value: 'false', label: t('admin.servers.included') },
                            { value: 'true', label: t('admin.servers.excluded') },
                        ]}
                    />
                </Field>

                <Field
                    label={t('admin.servers.software_page')}
                    error={errors.software_enabled}
                    hint={t('admin.servers.software_page_hint')}
                >
                    <Dropdown
                        value={String(values.software_enabled)}
                        onChange={(value) => set('software_enabled', value === 'true')}
                        options={[
                            { value: 'true', label: t('common.enabled') },
                            { value: 'false', label: t('common.disabled') },
                        ]}
                    />
                </Field>
            </div>

            <div className='flex flex-col gap-4 lg:col-span-7'>
                <div className='flex flex-col gap-4 rounded-xl border border-mocha-400 bg-mocha-500 p-4'>
                    <h2 className='text-sm font-semibold text-cream-50'>{t('admin.servers.feature_limits_title')}</h2>
                    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                        <Field
                            label={t('admin.servers.database_limit')}
                            error={errors.database_limit}
                            hint={t('admin.servers.blank_unlimited_zero')}
                        >
                            <Input.Text
                                type='number'
                                value={values.database_limit}
                                onChange={(e) => set('database_limit', e.target.value)}
                            />
                        </Field>
                        <Field
                            label={t('admin.servers.allocation_limit')}
                            error={errors.allocation_limit}
                            hint={t('admin.servers.blank_unlimited_zero')}
                        >
                            <Input.Text
                                type='number'
                                value={values.allocation_limit}
                                onChange={(e) => set('allocation_limit', e.target.value)}
                            />
                        </Field>
                        <Field
                            label={t('admin.servers.backup_limit')}
                            error={errors.backup_limit}
                            hint={t('admin.servers.blank_unlimited_zero')}
                        >
                            <Input.Text
                                type='number'
                                value={values.backup_limit}
                                onChange={(e) => set('backup_limit', e.target.value)}
                            />
                        </Field>
                        {isElytra && (
                            <Field
                                label={t('admin.servers.backup_storage_limit')}
                                error={errors.backup_storage_limit}
                                hint={t('admin.servers.backup_storage_hint')}
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
                    <h2 className='text-sm font-semibold text-cream-50'>{t('admin.servers.allocation_title')}</h2>

                    <Field
                        label={t('admin.servers.game_port')}
                        error={errors.allocation_id}
                        hint={t('admin.servers.game_port_hint')}
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
                        label={t('admin.servers.assign_ports')}
                        error={errors.add_allocations}
                        hint={t('admin.servers.assign_ports_hint')}
                    >
                        <AllocationChecklist
                            allocations={unassigned}
                            selected={add}
                            onToggle={toggle('add')}
                            emptyLabel={t('admin.servers.no_unassigned')}
                        />
                    </Field>

                    <Field
                        label={t('admin.servers.remove_ports')}
                        error={errors.remove_allocations}
                        hint={t('admin.servers.remove_ports_hint')}
                    >
                        <AllocationChecklist
                            allocations={assigned}
                            selected={remove}
                            onToggle={toggle('remove')}
                            emptyLabel={t('admin.servers.no_allocations_remove')}
                        />
                    </Field>

                    <div className='flex justify-end'>
                        <Button type='submit' disabled={submitting}>
                            {t('admin.servers.update_build')}
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
