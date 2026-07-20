import { useState } from 'react';
import { Link, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import useSWR, { mutate } from 'swr';
import { toast } from 'sonner';
import { getEggVariables, getNestEggs, getNests } from '@/api/admin/nests';
import { getNodes } from '@/api/admin/nodes';
import { getUsers } from '@/api/admin/users';
import { getDomains } from '@/api/admin/settings';
import {
    type AdminServer,
    createServer,
    createServerDatabase,
    deleteServer,
    deleteServerDatabase,
    getServer,
    getServerDatabases,
    getServerDetails,
    getServers,
    reinstallServer,
    suspendServer,
    unsuspendServer,
    updateServerBuild,
    updateServerDetails,
    updateServerStartup,
} from '@/api/admin/servers';
import { httpErrorToHuman } from '@/api/http';
import { Dialog } from '@/components/elements/dialog';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import Pagination from '@/components/elements/Pagination';
import Spinner from '@/components/elements/Spinner';
import { Button } from '@/components/ui/button';

const inputClass =
    'w-full bg-mocha-600 border border-mocha-400 rounded px-3 py-2 text-sm text-cream-400 focus:outline-none focus:border-mocha-300 transition-colors';
const labelClass = 'block text-sm text-mocha-200 mb-1';

const CreateServerModal = ({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) => {
    const [nestId, setNestId] = useState<number>(0);
    const [eggId, setEggId] = useState<number>(0);

    const { data: nests } = useSWR(open ? 'admin:nests' : null, () => getNests());
    const { data: eggData } = useSWR(open && nestId ? ['admin:nest:eggs', nestId] : null, () => getNestEggs(nestId));
    const { data: nodeData } = useSWR(open ? 'admin:nodes' : null, () => getNodes());
    const { data: usersData } = useSWR(open ? 'admin:users:list' : null, () => getUsers({ page: 1 }));
    const { data: domainsData } = useSWR(open ? 'admin:domains:list' : null, () => getDomains());
    const [nodeId, setNodeId] = useState<number>(0);
    const [name, setName] = useState('');
    const [userId, setUserId] = useState<number>(0);
    const [memory, setMemory] = useState<number | string>('');
    const [swap, setSwap] = useState<number | string>('');
    const [disk, setDisk] = useState<number | string>('');
    const [cpu, setCpu] = useState<number | string>('');
    const [io, setIo] = useState<number | string>('');
    const [startupCommand, setStartupCommand] = useState('');
    const [dockerImage, setDockerImage] = useState('');
    const [envVars, setEnvVars] = useState<{ key: string; value: string }[]>([]);
    const [databases, setDatabases] = useState<number | string>('');
    const [allocations, setAllocations] = useState<number | string>('');
    const [backups, setBackups] = useState<number | string>('');
    const [saving, setSaving] = useState(false);

    const resetForm = () => {
        setNestId(0);
        setEggId(0);
        setNodeId(0);
        setName('');
        setUserId(0);
        setMemory('');
        setSwap('');
        setDisk('');
        setCpu('');
        setIo('');
        setStartupCommand('');
        setDockerImage('');
        setEnvVars([]);
        setDatabases('');
        setAllocations('');
        setBackups('');
    };

    const handleSubmit = async () => {
        setSaving(true);
        try {
            const environment: Record<string, string> = {};
            envVars.forEach(({ key, value }) => {
                if (key.trim()) environment[key.trim()] = value;
            });
            
            // Convert empty string and 0 to undefined for "infinite" resources
            const serverData: any = {
                name,
                user: userId,
                egg: eggId,
                docker_image: dockerImage || undefined,
                startup_command: startupCommand || undefined,
                environment: Object.keys(environment).length > 0 ? environment : undefined,
                memory: memory === '' || Number(memory) === 0 ? undefined : Number(memory),
                swap: swap === '' || Number(swap) === 0 ? undefined : Number(swap),
                disk: disk === '' || Number(disk) === 0 ? undefined : Number(disk),
                cpu: cpu === '' || Number(cpu) === 0 ? undefined : Number(cpu),
                io: io === '' || Number(io) === 0 ? undefined : Number(io),
                feature_limits: {
                    databases: databases === '' || Number(databases) === 0 ? undefined : Number(databases),
                    allocations: allocations === '' || Number(allocations) === 0 ? undefined : Number(allocations),
                    backups: backups === '' || Number(backups) === 0 ? undefined : Number(backups),
                },
            };
            
            await createServer(serverData);
            toast.success('Server created successfully');
            resetForm();
            onCreated();
            onClose();
        } catch (e: any) {
            const errorMessage = httpErrorToHuman(e);
            toast.error(errorMessage);
            // If it's a validation error about startup, show a more helpful message
            if (errorMessage.toLowerCase().includes('startup')) {
                toast.error('Startup command is required. Please enter a startup command or select an egg that provides one.');
            }
        } finally {
            setSaving(false);
        }
    };

    const addEnvVar = () => setEnvVars([...envVars, { key: '', value: '' }]);
    const removeEnvVar = (i: number) => setEnvVars(envVars.filter((_, idx) => idx !== i));
    const updateEnvVar = (i: number, field: 'key' | 'value', val: string) => {
        const updated = [...envVars];
        const current = updated[i];
        if (current) {
            updated[i] = field === 'key' ? { key: val, value: current.value } : { key: current.key, value: val };
        }
        setEnvVars(updated);
    };

    return (
        <Dialog open={open} onClose={onClose} title='Create Server'>
            <div className='space-y-4 max-h-[60vh] overflow-y-auto pr-2'>
                <div>
                    <label className={labelClass}>Nest *</label>
                    <select
                        value={nestId}
                        onChange={(e) => {
                            setNestId(Number(e.target.value));
                            setEggId(0);
                        }}
                        className={inputClass}
                    >
                        <option value={0}>Select a nest</option>
                        {nests?.items.map((nest) => (
                            <option key={nest.id} value={nest.id}>
                                {nest.name}
                            </option>
                        ))}
                    </select>
                </div>

                {nestId > 0 && (
                    <div>
                        <label className={labelClass}>Egg *</label>
                        <select
                            value={eggId}
                            onChange={(e) => {
                                setEggId(Number(e.target.value));
                                const egg = eggData?.items.find((eg) => eg.id === Number(e.target.value));
                                if (egg) {
                                    setDockerImage(egg.dockerImage);
                                    setStartupCommand(egg.startup);
                                }
                            }}
                            className={inputClass}
                        >
                            <option value={0}>Select an egg</option>
                            {eggData?.items.map((egg) => (
                                <option key={egg.id} value={egg.id}>
                                    {egg.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {eggId > 0 && (
                    <div>
                        <label className={labelClass}>Node *</label>
                        <select
                            value={nodeId}
                            onChange={(e) => setNodeId(Number(e.target.value))}
                            className={inputClass}
                        >
                            <option value={0}>Select a node</option>
                            {nodeData?.items.map((node) => (
                                <option key={node.id} value={node.id}>
                                    {node.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {nodeId > 0 && (
                    <>
                        <div className='grid grid-cols-2 gap-4'>
                            <div>
                                <label className={labelClass}>Server Name *</label>
                                <input
                                    type='text'
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className={inputClass}
                                    placeholder='My Server'
                                />
                            </div>
                            <div>
                                <label className={labelClass}>User *</label>
                                <select
                                    value={userId}
                                    onChange={(e) => setUserId(Number(e.target.value))}
                                    className={inputClass}
                                >
                                    <option value={0}>Select a user</option>
                                    {usersData?.items?.slice(0, 10).map((user) => (
                                        <option key={user.id} value={user.id}>
                                            {user.username} ({user.email})
                                        </option>
                                    ))}
                                </select>
                                {usersData && usersData.pagination.total > 10 && (
                                    <p className='text-mocha-200 text-xs mt-1.5'>
                                        Showing 10 of {usersData.pagination.total} users
                                    </p>
                                )}
                            </div>
                        </div>

                        {domainsData && domainsData.domains && domainsData.domains.length > 0 && (
                            <div>
                                <label className={labelClass}>Domain</label>
                                <select
                                    value={0}
                                    onChange={(e) => {}}
                                    className={inputClass}
                                >
                                    <option value={0}>No domain (assign later)</option>
                                    {domainsData.domains.map((domain) => (
                                        <option key={domain.id} value={domain.id}>
                                            {domain.name}
                                        </option>
                                    ))}
                                </select>
                                <p className='text-mocha-200 text-xs mt-1.5'>
                                    Select a domain to assign to this server
                                </p>
                            </div>
                        )}
                        <div className='grid grid-cols-2 gap-4'>
                            <div>
                                <label className={labelClass}>Memory (MB)</label>
                                <input
                                    type='number'
                                    value={memory}
                                    onChange={(e) => setMemory(e.target.value)}
                                    className={inputClass}
                                    placeholder='1024'
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Disk (MB)</label>
                                <input
                                    type='number'
                                    value={disk}
                                    onChange={(e) => setDisk(e.target.value)}
                                    className={inputClass}
                                    placeholder='10240'
                                />
                            </div>
                        </div>
                        <div className='grid grid-cols-2 gap-4'>
                            <div>
                                <label className={labelClass}>CPU (%)</label>
                                <input
                                    type='number'
                                    value={cpu}
                                    onChange={(e) => setCpu(e.target.value)}
                                    className={inputClass}
                                    placeholder='100'
                                />
                            </div>
                            <div>
                                <label className={labelClass}>IO Weight</label>
                                <input
                                    type='number'
                                    value={io}
                                    onChange={(e) => setIo(e.target.value)}
                                    className={inputClass}
                                    placeholder='500'
                                />
                            </div>
                        </div>
                        <div className='grid grid-cols-2 gap-4'>
                            <div>
                                <label className={labelClass}>Swap (MB)</label>
                                <input
                                    type='number'
                                    value={swap}
                                    onChange={(e) => setSwap(e.target.value)}
                                    className={inputClass}
                                    placeholder='0'
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Startup Command</label>
                                <input
                                    type='text'
                                    value={startupCommand}
                                    onChange={(e) => setStartupCommand(e.target.value)}
                                    className={inputClass}
                                    placeholder='Auto-filled from egg'
                                />
                            </div>
                        </div>
                        <div>
                            <label className={labelClass}>Docker Image</label>
                            <input
                                type='text'
                                value={dockerImage}
                                onChange={(e) => setDockerImage(e.target.value)}
                                className={inputClass}
                                placeholder='Auto-filled from egg'
                            />
                        </div>

                        <div>
                            <div className='flex items-center justify-between mb-2'>
                                <label className='text-mocha-200 font-medium'>Environment Variables</label>
                                <Button variant='ghost' size='sm' type='button' onClick={addEnvVar}>+ Add Variable</Button>
                            </div>
                            {envVars.map((v, i) => (
                                <div key={i} className='flex gap-2 mb-2'>
                                    <input
                                        type='text'
                                        value={v.key}
                                        onChange={(e) => updateEnvVar(i, 'key', e.target.value)}
                                        className={inputClass}
                                        placeholder='KEY'
                                    />
                                    <input
                                        type='text'
                                        value={v.value}
                                        onChange={(e) => updateEnvVar(i, 'value', e.target.value)}
                                        className={inputClass}
                                        placeholder='value'
                                    />
                                    <Button variant='ghost' size='sm' type='button' onClick={() => removeEnvVar(i)}>×</Button>
                                </div>
                            ))}
                        </div>

                        <div className='grid grid-cols-3 gap-4'>
                            <div>
                                <label className={labelClass}>Databases</label>
                                <input
                                    type='number'
                                    value={databases}
                                    onChange={(e) => setDatabases(e.target.value)}
                                    className={inputClass}
                                    placeholder='0'
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Allocations</label>
                                <input
                                    type='number'
                                    value={allocations}
                                    onChange={(e) => setAllocations(e.target.value)}
                                    className={inputClass}
                                    placeholder='0'
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Backups</label>
                                <input
                                    type='number'
                                    value={backups}
                                    onChange={(e) => setBackups(e.target.value)}
                                    className={inputClass}
                                    placeholder='0'
                                />
                            </div>
                        </div>
                    </>
                )}
            </div>

            <Dialog.Footer>
                <div className='flex items-center gap-3 p-6'>
                    <Button variant='default' onClick={handleSubmit} disabled={saving || !name || !userId || !eggId || !nodeId}>{saving ? 'Creating...' : 'Create Server'}</Button>
                    <Button variant='secondary' onClick={onClose}>Cancel</Button>
                </div>
            </Dialog.Footer>
        </Dialog>
    );
};

const AdminServerViewContainer = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const serverId = Number(id);

    const {
        data: server,
        error: serverError,
        mutate: mutateServer,
    } = useSWR(['admin:server', serverId], () => getServer(serverId));
    const { data: details } = useSWR(['admin:server:details', serverId], () => getServerDetails(serverId));
    const { data: databases, mutate: mutateDatabases } = useSWR(['admin:server:databases', serverId], () =>
        getServerDatabases(serverId),
    );

    const [activeTab, setActiveTab] = useState<'details' | 'build' | 'startup' | 'databases' | 'manage'>('details');
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [confirmReinstall, setConfirmReinstall] = useState(false);
    const [confirmSuspend, setConfirmSuspend] = useState(false);
    const [confirmUnsuspend, setConfirmUnsuspend] = useState(false);
    const [confirmDeleteDb, setConfirmDeleteDb] = useState<number | null>(null);

    // Details form
    const [detailsFormInit, setDetailsFormInit] = useState(false);
    const [dName, setDName] = useState('');
    const [dDescription, setDDescription] = useState('');
    const [dImage, setDImage] = useState('');
    const [dStartup, setDStartup] = useState('');
    const [dEnvVars, setDEnvVars] = useState<{ key: string; value: string }[]>([]);
    const [detailsSaving, setDetailsSaving] = useState(false);
    const [detailsError, setDetailsError] = useState('');
    const [detailsSuccess, setDetailsSuccess] = useState(false);

    if (details && !detailsFormInit) {
        setDName(details.name);
        setDDescription(details.description);
        setDImage(details.image);
        setDetailsFormInit(true);
    }

    // Build form
    const [buildFormInit, setBuildFormInit] = useState(false);
    const [bMemory, setBMemory] = useState(0);
    const [bSwap, setBSwap] = useState(0);
    const [bDisk, setBDisk] = useState(0);
    const [bIO, setBIO] = useState(500);
    const [bCPU, setBCPU] = useState(0);
    const [bThreads, setBThreads] = useState('');
    const [bOomKill, setBOomKill] = useState(false);
    const [buildSaving, setBuildSaving] = useState(false);
    const [buildError, setBuildError] = useState('');
    const [buildSuccess, setBuildSuccess] = useState(false);

    if (server && !buildFormInit) {
        setBMemory(server.memory);
        setBSwap(server.swap);
        setBDisk(server.disk);
        setBIO(server.io);
        setBCPU(server.cpu);
        setBThreads(server.threads || '');
        setBuildFormInit(true);
    }

    // Startup form
    const [startupFormInit, setStartupFormInit] = useState(false);
    const [sStartup, setSStartup] = useState('');
    const [sImage, setSImage] = useState('');
    const [sEnvVars, setSEnvVars] = useState<{ key: string; value: string }[]>([]);
    const [startupSaving, setStartupSaving] = useState(false);
    const [startupError, setStartupError] = useState('');
    const [startupSuccess, setStartupSuccess] = useState(false);

    const { data: eggVars } = useSWR(details ? ['admin:egg:variables', details.nestId, details.eggId] : null, () =>
        details ? getEggVariables(details.nestId, details.eggId) : Promise.resolve([]),
    );

    if (details && !startupFormInit) {
        setSImage(details.image);
        setStartupFormInit(true);
    }

    // Database form
    const [dbHostId, setDbHostId] = useState(0);
    const [dbName, setDbName] = useState('');
    const [dbUsername, setDbUsername] = useState('');
    const [dbSaving, setDbSaving] = useState(false);
    const [dbError, setDbError] = useState('');

    const handleDetailsSave = async () => {
        setDetailsError('');
        setDetailsSaving(true);
        setDetailsSuccess(false);
        try {
            const environment: Record<string, string> = {};
            dEnvVars.forEach(({ key, value }) => {
                if (key.trim()) environment[key.trim()] = value;
            });
            await updateServerDetails(serverId, {
                name: dName,
                description: dDescription,
                docker_image: dImage,
                startup: dStartup || undefined,
                environment: Object.keys(environment).length > 0 ? environment : undefined,
            });
            mutateServer();
            setDetailsSuccess(true);
            setTimeout(() => setDetailsSuccess(false), 3000);
        } catch (e: any) {
            setDetailsError(httpErrorToHuman(e));
        } finally {
            setDetailsSaving(false);
        }
    };

    const handleBuildSave = async () => {
        setBuildError('');
        setBuildSaving(true);
        setBuildSuccess(false);
        try {
            await updateServerBuild(serverId, {
                memory: bMemory,
                swap: bSwap,
                disk: bDisk,
                io: bIO,
                cpu: bCPU,
                threads: bThreads || null,
                oom_kill: bOomKill,
            });
            mutateServer();
            setBuildSuccess(true);
            setTimeout(() => setBuildSuccess(false), 3000);
        } catch (e: any) {
            setBuildError(httpErrorToHuman(e));
        } finally {
            setBuildSaving(false);
        }
    };

    const handleStartupSave = async () => {
        setStartupError('');
        setStartupSaving(true);
        setStartupSuccess(false);
        try {
            const env: Record<string, string> = {};
            sEnvVars.forEach(({ key, value }) => {
                if (key.trim()) env[key.trim()] = value;
            });
            await updateServerStartup(serverId, {
                startup: sStartup || undefined,
                image: sImage || undefined,
                env: Object.keys(env).length > 0 ? env : undefined,
            });
            mutateServer();
            setStartupSuccess(true);
            setTimeout(() => setStartupSuccess(false), 3000);
        } catch (e: any) {
            setStartupError(httpErrorToHuman(e));
        } finally {
            setStartupSaving(false);
        }
    };

    const handleCreateDatabase = async () => {
        setDbError('');
        setDbSaving(true);
        try {
            await createServerDatabase(serverId, {
                database_host_id: dbHostId,
                database: dbName || undefined,
                username: dbUsername || undefined,
            });
            mutateDatabases();
            setDbHostId(0);
            setDbName('');
            setDbUsername('');
        } catch (e: any) {
            setDbError(httpErrorToHuman(e));
        } finally {
            setDbSaving(false);
        }
    };

    const handleDeleteDatabase = async () => {
        if (confirmDeleteDb === null) return;
        const dbId = confirmDeleteDb;
        setConfirmDeleteDb(null);
        try {
            await deleteServerDatabase(serverId, dbId);
            mutateDatabases();
        } catch (e: any) {
            alert(httpErrorToHuman(e));
        }
    };

    const handleReinstall = async () => {
        setConfirmReinstall(false);
        try {
            await reinstallServer(serverId);
            mutateServer();
        } catch (e: any) {
            alert(httpErrorToHuman(e));
        }
    };

    const handleSuspend = async () => {
        setConfirmSuspend(false);
        try {
            await suspendServer(serverId);
            mutateServer();
        } catch (e: any) {
            alert(httpErrorToHuman(e));
        }
    };

    const handleUnsuspend = async () => {
        setConfirmUnsuspend(false);
        try {
            await unsuspendServer(serverId);
            mutateServer();
        } catch (e: any) {
            alert(httpErrorToHuman(e));
        }
    };

    const handleDelete = async () => {
        setConfirmDelete(false);
        try {
            await deleteServer(serverId);
            navigate('/admin/servers');
        } catch (e: any) {
            alert(httpErrorToHuman(e));
        }
    };

    const addDetailsEnvVar = () => setDEnvVars([...dEnvVars, { key: '', value: '' }]);
    const removeDetailsEnvVar = (i: number) => setDEnvVars(dEnvVars.filter((_, idx) => idx !== i));
    const updateDetailsEnvVar = (i: number, field: 'key' | 'value', val: string) => {
        const updated = [...dEnvVars];
        const current = updated[i];
        if (current) {
            updated[i] = field === 'key' ? { key: val, value: current.value } : { key: current.key, value: val };
        }
        setDEnvVars(updated);
    };

    const addStartupEnvVar = () => setSEnvVars([...sEnvVars, { key: '', value: '' }]);
    const removeStartupEnvVar = (i: number) => setSEnvVars(sEnvVars.filter((_, idx) => idx !== i));
    const updateStartupEnvVar = (i: number, field: 'key' | 'value', val: string) => {
        const updated = [...sEnvVars];
        const current = updated[i];
        if (current) {
            updated[i] = field === 'key' ? { key: val, value: current.value } : { key: current.key, value: val };
        }
        setSEnvVars(updated);
    };

    if (serverError) {
        return (
            <div>
                <MainPageHeader title='Server' />
                <div className='text-red-400 text-sm'>Error loading server: {httpErrorToHuman(serverError)}</div>
            </div>
        );
    }

    if (!server || !details) {
        return (
            <div>
                <MainPageHeader title='Server' />
                <Spinner />
            </div>
        );
    }

    const tabs = ['details', 'build', 'startup', 'databases', 'manage'] as const;

    return (
        <div>
            <MainPageHeader title={server.name}>
                <Link to='..' className='text-sm text-mocha-100 hover:text-cream-400 transition-colors'>
                    Back to Servers
                </Link>
            </MainPageHeader>

            <div className='flex items-center space-x-1 border-b border-mocha-400 overflow-x-auto'>
                {tabs.map((tab) => (
                    <Button
                        key={tab}
                        variant='ghost'
                        onClick={() => setActiveTab(tab)}
                        className={`border-b-2 -mb-px rounded-none ${
                            activeTab === tab
                                ? 'border-brand text-cream-400'
                                : 'border-transparent text-mocha-200 hover:text-cream-400 hover:border-mocha-300'
                        }`}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </Button>
                ))}
            </div>

            <div className='mt-4'>
                {/* Details Tab */}
                {activeTab === 'details' && (
                    <div className='space-y-6'>
                        <div className='bg-mocha-500 border border-mocha-400 rounded-lg p-6'>
                            <h3 className='text-cream-400 font-medium mb-4'>Server Information</h3>
                            <div className='grid grid-cols-2 md:grid-cols-3 gap-4 text-sm'>
                                <div>
                                    <span className='text-mocha-200'>UUID</span>
                                    <p className='text-cream-400 font-mono text-xs'>{server.uuid}</p>
                                </div>
                                <div>
                                    <span className='text-mocha-200'>Owner</span>
                                    <p className='text-cream-400'>
                                        #{details.userId}
                                        {details.user?.username && ` (${details.user.username})`}
                                    </p>
                                </div>
                                <div>
                                    <span className='text-mocha-200'>Node</span>
                                    <p className='text-cream-400'>
                                        #{details.nodeId}
                                        {details.node?.name && ` (${details.node.name})`}
                                    </p>
                                </div>
                                <div>
                                    <span className='text-mocha-200'>Egg</span>
                                    <p className='text-cream-400'>
                                        #{details.eggId}
                                        {details.egg?.name && ` (${details.egg.name})`}
                                    </p>
                                </div>
                                <div>
                                    <span className='text-mocha-200'>Image</span>
                                    <p className='text-cream-400 font-mono text-xs'>{details.image}</p>
                                </div>
                                <div>
                                    <span className='text-mocha-200'>Created</span>
                                    <p className='text-cream-400'>{new Date(details.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </div>

                        <div className='bg-mocha-500 border border-mocha-400 rounded-lg p-6'>
                            <h3 className='text-cream-400 font-medium mb-4'>Edit Details</h3>
                            {detailsError && <div className='text-red-400 text-sm mb-3'>Error: {detailsError}</div>}
                            {detailsSuccess && <div className='text-green-400 text-sm mb-3'>Details saved.</div>}

                            <div className='space-y-4'>
                                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                    <div>
                                        <label className={labelClass}>Name</label>
                                        <input
                                            type='text'
                                            value={dName}
                                            onChange={(e) => setDName(e.target.value)}
                                            className={inputClass}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Description</label>
                                        <input
                                            type='text'
                                            value={dDescription}
                                            onChange={(e) => setDDescription(e.target.value)}
                                            className={inputClass}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Docker Image</label>
                                        <input
                                            type='text'
                                            value={dImage}
                                            onChange={(e) => setDImage(e.target.value)}
                                            className={inputClass}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Startup Command</label>
                                        <input
                                            type='text'
                                            value={dStartup}
                                            onChange={(e) => setDStartup(e.target.value)}
                                            className={inputClass}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <div className='flex items-center justify-between mb-2'>
                                        <label className='text-mocha-200 font-medium'>Environment Variables</label>
                                        <Button variant='ghost' size='sm' type='button' onClick={addDetailsEnvVar}>+ Add Variable</Button>
                                    </div>
                                    {dEnvVars.map((v, i) => (
                                        <div key={i} className='flex gap-2 mb-2'>
                                            <input
                                                type='text'
                                                value={v.key}
                                                onChange={(e) => updateDetailsEnvVar(i, 'key', e.target.value)}
                                                className={inputClass}
                                                placeholder='KEY'
                                            />
                                            <input
                                                type='text'
                                                value={v.value}
                                                onChange={(e) => updateDetailsEnvVar(i, 'value', e.target.value)}
                                                className={inputClass}
                                                placeholder='value'
                                            />
                                            <Button variant='ghost' size='sm' type='button' onClick={() => removeDetailsEnvVar(i)}>×</Button>
                                        </div>
                                    ))}
                                </div>

                                <div className='flex justify-end'>
                                <Button variant='default' onClick={handleDetailsSave} disabled={detailsSaving}>{detailsSaving ? 'Saving...' : 'Save Details'}</Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Build Tab */}
                {activeTab === 'build' && (
                    <div className='bg-mocha-500 border border-mocha-400 rounded-lg p-6'>
                        <h3 className='text-cream-400 font-medium mb-4'>Build Configuration</h3>
                        {buildError && <div className='text-red-400 text-sm mb-3'>Error: {buildError}</div>}
                        {buildSuccess && <div className='text-green-400 text-sm mb-3'>Build settings saved.</div>}

                        <div className='space-y-4'>
                            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                                <div>
                                    <label className={labelClass}>Memory (MB)</label>
                                    <input
                                        type='number'
                                        value={bMemory}
                                        onChange={(e) => setBMemory(Number(e.target.value))}
                                        className={inputClass}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Swap (MB)</label>
                                    <input
                                        type='number'
                                        value={bSwap}
                                        onChange={(e) => setBSwap(Number(e.target.value))}
                                        className={inputClass}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Disk (MB)</label>
                                    <input
                                        type='number'
                                        value={bDisk}
                                        onChange={(e) => setBDisk(Number(e.target.value))}
                                        className={inputClass}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>IO Weight</label>
                                    <input
                                        type='number'
                                        value={bIO}
                                        onChange={(e) => setBIO(Number(e.target.value))}
                                        className={inputClass}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>CPU (%)</label>
                                    <input
                                        type='number'
                                        value={bCPU}
                                        onChange={(e) => setBCPU(Number(e.target.value))}
                                        className={inputClass}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Threads</label>
                                    <input
                                        type='text'
                                        value={bThreads}
                                        onChange={(e) => setBThreads(e.target.value)}
                                        className={inputClass}
                                        placeholder='Leave empty for default'
                                    />
                                </div>
                            </div>

                            <div className='flex items-center space-x-2'>
                                <input
                                    type='checkbox'
                                    id='oomKill'
                                    checked={bOomKill}
                                    onChange={(e) => setBOomKill(e.target.checked)}
                                    className='rounded-lg border-mocha-400'
                                />
                                <label htmlFor='oomKill' className='text-sm text-mocha-100'>
                                    Enable OOM Kill
                                </label>
                            </div>

                            <div className='flex justify-end'>
                                <Button variant='default' onClick={handleBuildSave} disabled={buildSaving}>{buildSaving ? 'Saving...' : 'Save Build'}</Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Startup Tab */}
                {activeTab === 'startup' && (
                    <div className='space-y-6'>
                        {eggVars && eggVars.length > 0 && (
                            <div className='bg-mocha-500 border border-mocha-400 rounded-lg p-4'>
                                <h4 className='text-mocha-200 font-medium mb-2'>Egg Variable Defaults</h4>
                                <div className='space-y-1'>
                                    {eggVars.map((v) => (
                                        <div key={v.id} className='text-xs text-mocha-200'>
                                            <span className='text-mocha-100 font-mono'>{v.envVariable}</span>:{' '}
                                            {v.defaultValue || '(empty)'}
                                            {v.description && <span className='ml-2'>- {v.description}</span>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className='bg-mocha-500 border border-mocha-400 rounded-lg p-6'>
                            <h3 className='text-cream-400 font-medium mb-4'>Startup Configuration</h3>
                            {startupError && <div className='text-red-400 text-sm mb-3'>Error: {startupError}</div>}
                            {startupSuccess && (
                                <div className='text-green-400 text-sm mb-3'>Startup settings saved.</div>
                            )}

                            <div className='space-y-4'>
                                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                    <div>
                                        <label className={labelClass}>Startup Command</label>
                                        <input
                                            type='text'
                                            value={sStartup}
                                            onChange={(e) => setSStartup(e.target.value)}
                                            className={inputClass}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Docker Image</label>
                                        <input
                                            type='text'
                                            value={sImage}
                                            onChange={(e) => setSImage(e.target.value)}
                                            className={inputClass}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <div className='flex items-center justify-between mb-2'>
                                        <label className='text-mocha-200 font-medium'>Environment Variables</label>
                                        <Button variant='ghost' size='sm' type='button' onClick={addStartupEnvVar}>+ Add Variable</Button>
                                    </div>
                                    {sEnvVars.map((v, i) => (
                                        <div key={i} className='flex gap-2 mb-2'>
                                            <input
                                                type='text'
                                                value={v.key}
                                                onChange={(e) => updateStartupEnvVar(i, 'key', e.target.value)}
                                                className={inputClass}
                                                placeholder='KEY'
                                            />
                                            <input
                                                type='text'
                                                value={v.value}
                                                onChange={(e) => updateStartupEnvVar(i, 'value', e.target.value)}
                                                className={inputClass}
                                                placeholder='value'
                                            />
                                            <Button variant='ghost' size='sm' type='button' onClick={() => removeStartupEnvVar(i)}>×</Button>
                                        </div>
                                    ))}
                                </div>

                                <div className='flex justify-end'>
                                <Button variant='default' onClick={handleStartupSave} disabled={startupSaving}>{startupSaving ? 'Saving...' : 'Save Startup'}</Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Databases Tab */}
                {activeTab === 'databases' && (
                    <div className='space-y-6'>
                        <div className='bg-mocha-500 border border-mocha-400 rounded-lg overflow-hidden'>
                            <div className='px-6 py-4 border-b border-mocha-400'>
                                <h3 className='text-cream-400 font-medium'>Databases</h3>
                            </div>
                            <table className='w-full text-sm'>
                                <thead>
                                    <tr className='border-b border-mocha-400'>
                                        <th className='text-left px-6 py-3 text-mocha-200 font-medium'>Database</th>
                                        <th className='text-left px-6 py-3 text-mocha-200 font-medium'>Username</th>
                                        <th className='text-left px-6 py-3 text-mocha-200 font-medium'>Host ID</th>
                                        <th className='text-right px-6 py-3 text-mocha-200 font-medium'>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {!databases ? (
                                        <tr>
                                            <td colSpan={4} className='text-center py-6 text-mocha-200'>
                                                <Spinner size='small' />
                                            </td>
                                        </tr>
                                    ) : databases.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className='text-center py-6 text-mocha-200'>
                                                No databases.
                                            </td>
                                        </tr>
                                    ) : (
                                        databases.map((db) => (
                                            <tr
                                                key={db.id}
                                                className='border-b border-mocha-400 last:border-0 hover:bg-mocha-400/20'
                                            >
                                                <td className='px-6 py-3 text-cream-400'>{db.database}</td>
                                                <td className='px-6 py-3 text-mocha-100'>{db.username}</td>
                                                <td className='px-6 py-3 text-mocha-100'>#{db.hostId}</td>
                                                <td className='px-6 py-3 text-right'>
                                                    <Button variant='attention' size='sm' onClick={() => setConfirmDeleteDb(db.id)}>Delete</Button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className='bg-mocha-500 border border-mocha-400 rounded-lg p-6'>
                            <h3 className='text-cream-400 font-medium mb-4'>Create Database</h3>
                            {dbError && <div className='text-red-400 text-sm mb-3'>Error: {dbError}</div>}

                            <div className='space-y-4'>
                                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                                    <div>
                                        <label className={labelClass}>Database Host ID *</label>
                                        <input
                                            type='number'
                                            value={dbHostId || ''}
                                            onChange={(e) => setDbHostId(Number(e.target.value))}
                                            className={inputClass}
                                            placeholder='1'
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Database Name</label>
                                        <input
                                            type='text'
                                            value={dbName}
                                            onChange={(e) => setDbName(e.target.value)}
                                            className={inputClass}
                                            placeholder='server1'
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Username</label>
                                        <input
                                            type='text'
                                            value={dbUsername}
                                            onChange={(e) => setDbUsername(e.target.value)}
                                            className={inputClass}
                                            placeholder='user1'
                                        />
                                    </div>
                                </div>

                                <div className='flex justify-end'>
                                <Button variant='default' onClick={handleCreateDatabase} disabled={dbSaving || !dbHostId}>{dbSaving ? 'Creating...' : 'Create Database'}</Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Manage Tab */}
                {activeTab === 'manage' && (
                    <div className='space-y-6'>
                        <div className='bg-mocha-500 border border-mocha-400 rounded-lg p-6'>
                            <h3 className='text-cream-400 font-medium mb-4'>Server Actions</h3>
                            <div className='flex flex-wrap gap-3'>
                                <Button variant='secondary' onClick={() => setConfirmReinstall(true)}>Reinstall Server</Button>

                                {server.suspended ? (
                                    <Button variant='secondary' onClick={() => setConfirmUnsuspend(true)}>Unsuspend Server</Button>
                                ) : (
                                    <Button variant='secondary' onClick={() => setConfirmSuspend(true)}>Suspend Server</Button>
                                )}
                            </div>
                        </div>

                        <div className='bg-mocha-500 border border-red-800/50 rounded-lg p-6'>
                            <h3 className='text-red-400 font-medium mb-2'>Danger Zone</h3>
                            <p className='text-sm text-mocha-200 mb-4'>
                                Deleting this server will permanently remove all data. This action cannot be undone.
                            </p>
                            <Button variant='attention' onClick={() => setConfirmDelete(true)}>Delete Server</Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Confirm dialogs */}
            <Dialog.Confirm
                open={confirmDelete}
                onClose={() => setConfirmDelete(false)}
                onConfirmed={handleDelete}
                title='Delete Server'
                confirm='Delete'
            >
                Are you sure you want to delete this server? This cannot be undone.
            </Dialog.Confirm>

            <Dialog.Confirm
                open={confirmReinstall}
                onClose={() => setConfirmReinstall(false)}
                onConfirmed={handleReinstall}
                title='Reinstall Server'
                confirm='Reinstall'
            >
                This will reinstall the server and may cause downtime. Continue?
            </Dialog.Confirm>

            <Dialog.Confirm
                open={confirmSuspend}
                onClose={() => setConfirmSuspend(false)}
                onConfirmed={handleSuspend}
                title='Suspend Server'
                confirm='Suspend'
            >
                Are you sure you want to suspend this server?
            </Dialog.Confirm>

            <Dialog.Confirm
                open={confirmUnsuspend}
                onClose={() => setConfirmUnsuspend(false)}
                onConfirmed={handleUnsuspend}
                title='Unsuspend Server'
                confirm='Unsuspend'
            >
                Are you sure you want to unsuspend this server?
            </Dialog.Confirm>

            <Dialog.Confirm
                open={confirmDeleteDb !== null}
                onClose={() => setConfirmDeleteDb(null)}
                onConfirmed={handleDeleteDatabase}
                title='Delete Database'
                confirm='Delete'
            >
                Are you sure you want to delete this database?
            </Dialog.Confirm>
        </div>
    );
};

const AdminServersContainer = () => {
    const [page, setPage] = useState(1);
    const [showCreate, setShowCreate] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
    const { data, error, mutate } = useSWR(['admin:servers', page], () => getServers({ page }));

    const handleSuspend = async (id: number) => {
        try {
            await suspendServer(id);
            mutate();
        } catch (e: any) {
            alert(httpErrorToHuman(e));
        }
    };

    const handleUnsuspend = async (id: number) => {
        try {
            await unsuspendServer(id);
            mutate();
        } catch (e: any) {
            alert(httpErrorToHuman(e));
        }
    };

    const handleDelete = async () => {
        if (confirmDelete === null) return;
        const id = confirmDelete;
        setConfirmDelete(null);
        try {
            await deleteServer(id);
            mutate();
        } catch (e: any) {
            alert(httpErrorToHuman(e));
        }
    };

    return (
        <Routes>
            <Route
                index
                element={
                    <div>
                        <MainPageHeader title='Servers'>
                            <Button variant='default' onClick={() => setShowCreate(true)}>Create Server</Button>
                        </MainPageHeader>

                        {error && <div className='text-red-400 mb-4'>Error: {httpErrorToHuman(error)}</div>}

                        {!data ? (
                            <Spinner />
                        ) : (
                            <Pagination data={data} onPageSelect={setPage}>
                                {({ items }) => (
                                    <div className='bg-mocha-500 border border-mocha-400 rounded-lg overflow-hidden'>
                                        <table className='w-full text-sm'>
                                            <thead>
                                                <tr className='border-b border-mocha-400'>
                                                    <th className='text-left px-4 py-3 text-mocha-200 font-medium'>
                                                        Name
                                                    </th>
                                                    <th className='text-left px-4 py-3 text-mocha-200 font-medium'>
                                                        Owner
                                                    </th>
                                                    <th className='text-left px-4 py-3 text-mocha-200 font-medium'>
                                                        Node
                                                    </th>
                                                    <th className='text-left px-4 py-3 text-mocha-200 font-medium'>
                                                        Egg
                                                    </th>
                                                    <th className='text-left px-4 py-3 text-mocha-200 font-medium'>
                                                        Memory
                                                    </th>
                                                    <th className='text-left px-4 py-3 text-mocha-200 font-medium'>
                                                        Disk
                                                    </th>
                                                    <th className='text-left px-4 py-3 text-mocha-200 font-medium'>
                                                        Status
                                                    </th>
                                                    <th className='text-right px-4 py-3 text-mocha-200 font-medium'>
                                                        Actions
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {items.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={8} className='text-center py-8 text-mocha-200'>
                                                            No servers found.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    items.map((server: AdminServer) => (
                                                        <tr
                                                            key={server.id}
                                                            className='border-b border-mocha-400 last:border-0 hover:bg-mocha-400/20'
                                                        >
                                                            <td className='px-4 py-3'>
                                                                <Link
                                                                    to={String(server.id)}
                                                                    className='text-cream-400 font-medium hover:text-cream-200 cursor-pointer'
                                                                >
                                                                    {server.name}
                                                                </Link>
                                                                {server.description && (
                                                                    <p className='text-xs text-mocha-200 truncate max-w-[200px]'>
                                                                        {server.description}
                                                                    </p>
                                                                )}
                                                            </td>
                                                            <td className='px-4 py-3 text-mocha-100 cursor-default'>
                                                                #{server.user}
                                                            </td>
                                                            <td className='px-4 py-3 text-mocha-100 cursor-default'>
                                                                #{server.node}
                                                            </td>
                                                            <td className='px-4 py-3 text-mocha-100 cursor-default'>
                                                                #{server.egg}
                                                            </td>
                                                            <td className='px-4 py-3 text-mocha-100 cursor-default'>
                                                                {server.memory} MB
                                                            </td>
                                                            <td className='px-4 py-3 text-mocha-100 cursor-default'>
                                                                {server.disk} MB
                                                            </td>
                                                            <td className='px-4 py-3'>
                                                                <span
                                                                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium cursor-default ${
                                                                        server.suspended
                                                                            ? 'bg-yellow-900/50 text-yellow-400'
                                                                            : 'bg-green-900/50 text-green-400'
                                                                    }`}
                                                                >
                                                                    {server.suspended
                                                                        ? 'Suspended'
                                                                        : server.status || 'Running'}
                                                                </span>
                                                            </td>
                                                            <td className='px-4 py-3 text-right'>
                                                                <div className='flex items-center justify-end gap-2'>
                                                                    <Link
                                                                        to={String(server.id)}
                                                                        className='text-xs text-cream-400 hover:text-cream-500 cursor-pointer'
                                                                    >
                                                                        View
                                                                    </Link>
                                                                    {server.suspended ? (
                                                                        <Button variant='ghost' size='sm' onClick={() => handleUnsuspend(server.id)} title='Unsuspend server'>Unsuspend</Button>
                                                                    ) : (
                                                                        <Button variant='ghost' size='sm' onClick={() => handleSuspend(server.id)} title='Suspend server'>Suspend</Button>
                                                                    )}
                                                                    <Button variant='attention' size='sm' onClick={() => setConfirmDelete(server.id)} title='Delete server'>Delete</Button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </Pagination>
                        )}

                        <CreateServerModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={() => mutate()} />

                        <Dialog.Confirm
                            open={confirmDelete !== null}
                            onClose={() => setConfirmDelete(null)}
                            onConfirmed={handleDelete}
                            title='Delete Server'
                            confirm='Delete'
                        >
                            Are you sure you want to delete this server? This cannot be undone.
                        </Dialog.Confirm>
                    </div>
                }
            />
            <Route path=':id/*' element={<AdminServerViewContainer />} />
        </Routes>
    );
};

export default AdminServersContainer;
