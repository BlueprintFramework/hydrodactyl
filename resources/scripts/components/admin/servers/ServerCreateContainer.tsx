import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import useSWR from 'swr';
import { errorToMessage, parseValidationErrors } from '@/api/admin/errors';
import {
    createServer,
    type EggSummary,
    getCreateAllocations,
    type NestSummary,
    type ServerCreateOptions,
    type ServerCreateValues,
} from '@/api/admin/servers';
import { useServerCreateOptions } from '@/api/admin/useServers';
import { Field } from '@/components/admin/Field';
import { Checkbox } from '@/components/elements/CheckboxNew';
import Dropdown from '@/components/elements/Dropdown';
import { Input } from '@/components/elements/inputs';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import PageContentBlock from '@/components/elements/PageContentBlock';
import Spinner from '@/components/elements/Spinner';
import VirtualizedList from '@/components/elements/VirtualizedList';
import { Button } from '@/components/ui/button';
import OwnerSelect from './OwnerSelect';

const cardClass = 'flex flex-col gap-4 rounded-xl border border-mocha-400 bg-mocha-500 p-4';

const allEggs = (nests: NestSummary[]) => nests.flatMap((nest) => nest.eggs);

const findEgg = (nests: NestSummary[], eggId: string) => allEggs(nests).find((egg) => String(egg.id) === eggId);

const imagesFor = (egg?: EggSummary) => (egg ? Object.values(egg.docker_images ?? {}) : []);

const ServerCreateForm = ({ options }: { options: ServerCreateOptions }) => {
    const navigate = useNavigate();

    const firstNode = options.locations.flatMap((location) => location.nodes)[0];
    const initialNest = options.nests[0];
    const initialEgg = initialNest?.eggs[0];

    const [templateId, setTemplateId] = useState('');
    const [name, setName] = useState('');
    const [ownerId, setOwnerId] = useState(0);
    const [description, setDescription] = useState('');
    const [startOnCompletion, setStartOnCompletion] = useState(false);

    const [nodeId, setNodeId] = useState(firstNode ? String(firstNode.id) : '');
    const [allocationId, setAllocationId] = useState('');
    const [additional, setAdditional] = useState<number[]>([]);
    const [allocSearch, setAllocSearch] = useState('');

    const [databaseLimit, setDatabaseLimit] = useState('');
    const [allocationLimit, setAllocationLimit] = useState('');
    const [backupLimit, setBackupLimit] = useState('');
    const [backupStorageLimit, setBackupStorageLimit] = useState('');

    const [cpu, setCpu] = useState('0');
    const [threads, setThreads] = useState('');
    const [memory, setMemory] = useState('');
    const [overheadMemory, setOverheadMemory] = useState('0');
    const [swap, setSwap] = useState('0');
    const [disk, setDisk] = useState('');
    const [io, setIo] = useState('500');
    const [oomKiller, setOomKiller] = useState(false);
    const [exclude, setExclude] = useState(false);

    const [nestId, setNestId] = useState(initialNest ? String(initialNest.id) : '');
    const [eggId, setEggId] = useState(initialEgg ? String(initialEgg.id) : '');
    const [skipScripts, setSkipScripts] = useState(false);
    const [image, setImage] = useState(imagesFor(initialEgg)[0] ?? '');
    const [customImage, setCustomImage] = useState('');
    const [startup, setStartup] = useState(initialEgg?.startup ?? '');
    const [environment, setEnvironment] = useState<Record<string, string>>({});

    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const { data: allocations } = useSWR(
        nodeId ? ['admin:create-allocations', nodeId] : null,
        () => getCreateAllocations(nodeId),
        { revalidateOnFocus: false, revalidateIfStale: false },
    );

    useEffect(() => {
        const first = allocations?.[0];
        if (!allocationId && first) {
            setAllocationId(String(first.id));
        }
    }, [allocations, allocationId]);

    const selectedNest = options.nests.find((nest) => String(nest.id) === nestId);
    const selectedNode = options.locations
        .flatMap((location) => location.nodes)
        .find((node) => String(node.id) === nodeId);
    const isElytra = selectedNode?.daemonType === 'elytra';
    const selectedEgg = findEgg(options.nests, eggId);
    const defaultStartup = selectedEgg?.startup ?? '';
    const dockerOptions = Object.entries(selectedEgg?.docker_images ?? {}).map(([label, value]) => ({
        value,
        label: `${label} (${value})`,
    }));

    const additionalOptions = useMemo(() => {
        const term = allocSearch.trim().toLowerCase();

        return (allocations ?? [])
            .filter((allocation) => String(allocation.id) !== allocationId)
            .filter((allocation) =>
                term ? `${allocation.alias}:${allocation.port} ${allocation.ip}`.toLowerCase().includes(term) : true,
            );
    }, [allocations, allocationId, allocSearch]);

    const valueFor = (env: string, fallback: string) => environment[env] ?? fallback;

    const applyTemplate = (value: string) => {
        setTemplateId(value);
        const template = options.templates.find((item) => item.id === value);

        if (!template) {
            return;
        }

        setMemory(String(template.memory));
        setOverheadMemory(String(template.overhead_memory));
        setSwap(String(template.swap));
        setDisk(String(template.disk));
        setCpu(String(template.cpu));
        setThreads(template.threads ?? '');
        setIo(String(template.io));
        setDatabaseLimit(String(template.database_limit));
        setAllocationLimit(String(template.allocation_limit));
        setBackupLimit(String(template.backup_limit));
        setBackupStorageLimit(String(template.backup_storage_limit));
        setOomKiller(!template.oom_disabled);
        setExclude(template.exclude_from_resource_calculation);
        setSkipScripts(template.skip_scripts);
        setStartOnCompletion(template.start_on_completion);
    };

    const applyEgg = (value: string) => {
        setEggId(value);
        const egg = findEgg(options.nests, value);
        setImage(imagesFor(egg)[0] ?? '');
        setCustomImage('');
        setStartup(egg?.startup ?? '');
        setEnvironment({});
    };

    const changeNest = (value: string) => {
        setNestId(value);
        const nest = options.nests.find((item) => String(item.id) === value);
        applyEgg(nest?.eggs[0] ? String(nest.eggs[0].id) : '');
    };

    const changeNode = (value: string) => {
        setNodeId(value);
        setAllocationId('');
        setAdditional([]);
        setAllocSearch('');
    };

    const submit = async () => {
        setSubmitting(true);
        setErrors({});

        const env: Record<string, string> = {};
        for (const variable of selectedEgg?.variables ?? []) {
            env[variable.env_variable] = valueFor(variable.env_variable, variable.default_value ?? '');
        }

        const payload: ServerCreateValues = {
            name,
            owner_id: ownerId,
            description,
            start_on_completion: startOnCompletion,
            node_id: Number(nodeId),
            allocation_id: Number(allocationId),
            allocation_additional: additional,
            database_limit: databaseLimit,
            allocation_limit: allocationLimit,
            backup_limit: backupLimit,
            backup_storage_limit: isElytra ? backupStorageLimit : '',
            cpu,
            threads,
            memory,
            overhead_memory: overheadMemory,
            swap,
            disk,
            io,
            oom_disabled: !oomKiller,
            exclude_from_resource_calculation: exclude,
            nest_id: Number(nestId),
            egg_id: Number(eggId),
            skip_scripts: skipScripts,
            image: customImage.trim() || image,
            startup,
            environment: env,
        };

        try {
            const server = await createServer(payload);
            toast.success('Server created.');
            navigate(`/servers/${server.id}`);
        } catch (error) {
            setErrors(parseValidationErrors(error));
            toast.error(errorToMessage(error, 'Failed to create the server.'));
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
            className='flex flex-col gap-4'
        >
            <div className={cardClass}>
                <h2 className='text-sm font-semibold text-cream-50'>Template &amp; Core Details</h2>
                <Field
                    label='Server Template'
                    optional
                    hint='Prefills resources and limits. Node and egg still need to be chosen below.'
                >
                    <Dropdown
                        value={templateId}
                        onChange={applyTemplate}
                        options={[
                            { value: '', label: 'Custom (no template)' },
                            ...options.templates.map((template) => ({
                                value: template.id,
                                label: template.name,
                                description: template.description ?? undefined,
                            })),
                        ]}
                    />
                </Field>
                <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                    <Field label='Server Name' error={errors.name} hint='Allowed: a-z, A-Z, 0-9, _ - . and spaces.'>
                        <Input.Text value={name} onChange={(event) => setName(event.target.value)} />
                    </Field>
                    <Field label='Server Description' error={errors.description}>
                        <Input.Text value={description} onChange={(event) => setDescription(event.target.value)} />
                    </Field>
                </div>
                <Field label='Server Owner' error={errors.owner_id} hint='The account that will own this server.'>
                    <OwnerSelect onChange={setOwnerId} />
                </Field>
                <div className='flex items-center gap-2'>
                    <Checkbox
                        checked={startOnCompletion}
                        onCheckedChange={(checked) => setStartOnCompletion(checked === true)}
                    />
                    <span className='text-sm text-cream-100'>Start Server when Installed</span>
                </div>
            </div>

            <div className={cardClass}>
                <h2 className='text-sm font-semibold text-cream-50'>Allocation Management</h2>
                <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                    <Field label='Node' error={errors.node_id} hint='The node this server will be deployed to.'>
                        <Dropdown
                            value={nodeId}
                            onChange={changeNode}
                            placeholder='Select a node…'
                            options={options.locations.flatMap((location) =>
                                location.nodes.map((node) => ({
                                    value: String(node.id),
                                    label: node.name,
                                    description: location.long ?? location.short,
                                })),
                            )}
                        />
                    </Field>
                    <Field label='Default Allocation' error={errors.allocation_id}>
                        <Dropdown
                            value={allocationId}
                            onChange={setAllocationId}
                            placeholder={nodeId ? 'Select an allocation…' : 'Select a node first…'}
                            disabled={!nodeId}
                            options={(allocations ?? []).map((allocation) => ({
                                value: String(allocation.id),
                                label: `${allocation.alias}:${allocation.port}`,
                                description: allocation.alias !== allocation.ip ? allocation.ip : undefined,
                            }))}
                        />
                    </Field>
                </div>
                <Field
                    label='Additional Allocations'
                    error={errors.allocation_additional}
                    hint='Optionally assign extra allocations to this server.'
                >
                    <div className='flex flex-col gap-2'>
                        <Input.Text
                            placeholder='Search allocations…'
                            value={allocSearch}
                            onChange={(event) => setAllocSearch(event.target.value)}
                        />
                        <VirtualizedList
                            items={additionalOptions}
                            className='rounded-lg border border-mocha-400'
                            maxHeight={176}
                            estimateSize={() => 38}
                            overscan={8}
                            itemClassName=''
                            renderItem={(allocation) => (
                                <div className='flex items-center gap-3 border-b border-mocha-400/40 px-3 py-2'>
                                    <Checkbox
                                        checked={additional.includes(allocation.id)}
                                        onCheckedChange={(checked) =>
                                            setAdditional((current) =>
                                                checked === true
                                                    ? [...current, allocation.id]
                                                    : current.filter((value) => value !== allocation.id),
                                            )
                                        }
                                    />
                                    <span className='text-sm text-cream-100'>
                                        {allocation.alias}:{allocation.port}
                                    </span>
                                </div>
                            )}
                            emptyState={
                                <div className='px-3 py-2 text-sm text-cream-400/50'>
                                    No unassigned allocations are available on this node.
                                </div>
                            }
                        />
                    </div>
                </Field>
            </div>

            <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
                <div className={cardClass}>
                    <h2 className='text-sm font-semibold text-cream-50'>Resource Management</h2>
                    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                        <Field label='CPU Limit' error={errors.cpu} hint='Each thread is 100%. 0 is unrestricted.'>
                            <Input.Text type='number' value={cpu} onChange={(event) => setCpu(event.target.value)} />
                        </Field>
                        <Field label='CPU Pinning' error={errors.threads} hint='e.g. 0, 0-1,3 or 0,1,3,4.'>
                            <Input.Text value={threads} onChange={(event) => setThreads(event.target.value)} />
                        </Field>
                        <Field label='Memory' error={errors.memory} hint='MiB. 0 is unlimited.'>
                            <Input.Text
                                type='number'
                                value={memory}
                                onChange={(event) => setMemory(event.target.value)}
                            />
                        </Field>
                        <Field label='Overhead Memory' error={errors.overhead_memory} hint='MiB. 0 disables it.'>
                            <Input.Text
                                type='number'
                                value={overheadMemory}
                                onChange={(event) => setOverheadMemory(event.target.value)}
                            />
                        </Field>
                        <Field label='Swap' error={errors.swap} hint='MiB. 0 disables, -1 is unlimited.'>
                            <Input.Text type='number' value={swap} onChange={(event) => setSwap(event.target.value)} />
                        </Field>
                        <Field label='Disk Space' error={errors.disk} hint='MiB. 0 is unlimited.'>
                            <Input.Text type='number' value={disk} onChange={(event) => setDisk(event.target.value)} />
                        </Field>
                        <Field label='Block IO Weight' error={errors.io} hint='Between 10 and 1000.'>
                            <Input.Text type='number' value={io} onChange={(event) => setIo(event.target.value)} />
                        </Field>
                    </div>
                    <div className='flex items-center gap-2'>
                        <Checkbox checked={oomKiller} onCheckedChange={(checked) => setOomKiller(checked === true)} />
                        <span className='text-sm text-cream-100'>Enable OOM Killer</span>
                    </div>
                    <div className='flex items-center gap-2'>
                        <Checkbox checked={exclude} onCheckedChange={(checked) => setExclude(checked === true)} />
                        <span className='text-sm text-cream-100'>Exclude from Resource Calculation</span>
                    </div>
                </div>

                <div className='flex flex-col gap-4'>
                    <div className={cardClass}>
                        <h2 className='text-sm font-semibold text-cream-50'>Application Feature Limits</h2>
                        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                            <Field label='Database Limit' error={errors.database_limit} hint='Blank is unlimited.'>
                                <Input.Text
                                    type='number'
                                    value={databaseLimit}
                                    onChange={(event) => setDatabaseLimit(event.target.value)}
                                />
                            </Field>
                            <Field label='Allocation Limit' error={errors.allocation_limit} hint='Blank is unlimited.'>
                                <Input.Text
                                    type='number'
                                    value={allocationLimit}
                                    onChange={(event) => setAllocationLimit(event.target.value)}
                                />
                            </Field>
                            <Field label='Backup Limit' error={errors.backup_limit} hint='Blank is unlimited.'>
                                <Input.Text
                                    type='number'
                                    value={backupLimit}
                                    onChange={(event) => setBackupLimit(event.target.value)}
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
                                        value={backupStorageLimit}
                                        onChange={(event) => setBackupStorageLimit(event.target.value)}
                                    />
                                </Field>
                            )}
                        </div>
                    </div>

                    <div className={cardClass}>
                        <h2 className='text-sm font-semibold text-cream-50'>Nest &amp; Docker Configuration</h2>
                        <Field label='Nest' error={errors.nest_id}>
                            <Dropdown
                                value={nestId}
                                onChange={changeNest}
                                options={options.nests.map((nest) => ({ value: String(nest.id), label: nest.name }))}
                            />
                        </Field>
                        <Field label='Egg' error={errors.egg_id}>
                            <Dropdown
                                value={eggId}
                                onChange={applyEgg}
                                placeholder='Select an egg…'
                                options={(selectedNest?.eggs ?? []).map((egg) => ({
                                    value: String(egg.id),
                                    label: egg.name,
                                }))}
                            />
                        </Field>
                        <Field label='Docker Image' error={errors.image}>
                            <Dropdown
                                value={image}
                                onChange={setImage}
                                placeholder='Select an image…'
                                options={dockerOptions}
                            />
                        </Field>
                        <Field label='Custom Image' error={errors.custom_image} hint='Overrides the selected image.'>
                            <Input.Text
                                value={customImage}
                                placeholder='Or enter a custom image…'
                                onChange={(event) => setCustomImage(event.target.value)}
                            />
                        </Field>
                        <div className='flex items-center gap-2'>
                            <Checkbox
                                checked={skipScripts}
                                onCheckedChange={(checked) => setSkipScripts(checked === true)}
                            />
                            <span className='text-sm text-cream-100'>Skip Egg Install Script</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className={cardClass}>
                <h2 className='text-sm font-semibold text-cream-50'>Startup Configuration</h2>
                <Field
                    label='Startup Command'
                    error={errors.startup}
                    hint={'Available: {{SERVER_MEMORY}}, {{SERVER_IP}}, and {{SERVER_PORT}}.'}
                >
                    <Input.Text value={startup} onChange={(event) => setStartup(event.target.value)} />
                </Field>
                <Field label='Default Service Start Command' hint='Provided by the selected egg.'>
                    <Input.Text readOnly className='opacity-70' value={defaultStartup} />
                </Field>

                {(selectedEgg?.variables ?? []).length > 0 && (
                    <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                        {(selectedEgg?.variables ?? []).map((variable) => (
                            <Field
                                key={variable.env_variable}
                                label={variable.required ? `${variable.name} *` : variable.name}
                                hint={variable.description}
                            >
                                <Input.Text
                                    value={valueFor(variable.env_variable, variable.default_value ?? '')}
                                    onChange={(event) =>
                                        setEnvironment((current) => ({
                                            ...current,
                                            [variable.env_variable]: event.target.value,
                                        }))
                                    }
                                />
                            </Field>
                        ))}
                    </div>
                )}

                <div className='flex justify-end'>
                    <Button type='submit' disabled={submitting}>
                        Create Server
                    </Button>
                </div>
            </div>
        </form>
    );
};

const ServerCreateContainer = () => {
    const { data: options } = useServerCreateOptions();

    if (!options) {
        return (
            <div className='flex items-center justify-center min-h-[60vh]'>
                <Spinner centered size={Spinner.Size.LARGE} />
            </div>
        );
    }

    return (
        <PageContentBlock title='Create Server'>
            <MainPageHeader direction='column' title='Create Server'>
                <p className='text-sm text-neutral-400'>Add a new server to the panel.</p>
            </MainPageHeader>

            <ServerCreateForm options={options} />
        </PageContentBlock>
    );
};

export default ServerCreateContainer;
