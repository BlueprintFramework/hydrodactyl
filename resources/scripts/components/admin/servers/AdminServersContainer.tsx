import { useState } from 'react';
import { Link, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import useSWR from 'swr';
import { getEggVariables, getNestEggs, getNests } from '@/api/admin/nests';
import { getNodes } from '@/api/admin/nodes';
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
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import Pagination from '@/components/elements/Pagination';
import Spinner from '@/components/elements/Spinner';

const inputClass =
    'w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500 transition-colors';
const labelClass = 'block text-sm text-gray-400 mb-1';

const AdminServerCreate = () => {
    const navigate = useNavigate();

    const [nestId, setNestId] = useState<number>(0);
    const [eggId, setEggId] = useState<number>(0);

    const { data: nests } = useSWR('admin:nests', () => getNests());
    const { data: eggData } = useSWR(nestId ? ['admin:nest:eggs', nestId] : null, () => getNestEggs(nestId));
    const { data: nodeData } = useSWR('admin:nodes', () => getNodes());
    const [nodeId, setNodeId] = useState<number>(0);
    const [name, setName] = useState('');
    const [userId, setUserId] = useState<number>(0);
    const [memory, setMemory] = useState<number>(0);
    const [swap, setSwap] = useState<number>(0);
    const [disk, setDisk] = useState<number>(0);
    const [cpu, setCpu] = useState<number>(0);
    const [io, setIo] = useState<number>(500);
    const [startupCommand, setStartupCommand] = useState('');
    const [dockerImage, setDockerImage] = useState('');
    const [envVars, setEnvVars] = useState<{ key: string; value: string }[]>([]);
    const [databases, setDatabases] = useState<number>(0);
    const [allocations, setAllocations] = useState<number>(0);
    const [backups, setBackups] = useState<number>(0);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        setError('');
        setSaving(true);
        try {
            const environment: Record<string, string> = {};
            envVars.forEach(({ key, value }) => {
                if (key.trim()) environment[key.trim()] = value;
            });
            await createServer({
                name,
                user: userId,
                egg: eggId,
                docker_image: dockerImage || undefined,
                startup_command: startupCommand || undefined,
                environment: Object.keys(environment).length > 0 ? environment : undefined,
                memory: memory || undefined,
                swap: swap || undefined,
                disk: disk || undefined,
                io: io || undefined,
                cpu: cpu || undefined,
                feature_limits: {
                    databases: databases || undefined,
                    allocations: allocations || undefined,
                    backups: backups || undefined,
                },
            });
            navigate('..');
        } catch (e: any) {
            setError(httpErrorToHuman(e as { response?: { data?: unknown }; message?: string }));
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
        <div>
            <MainPageHeader title='Create Server' />

            <div className='bg-[#1a1a1a] border border-gray-800 rounded-lg p-6 max-w-3xl'>
                {error && <div className='text-red-400 mb-4 text-sm'>Error: {error}</div>}

                <div className='space-y-6'>
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
                            <div>
                                <h3 className='text-gray-200 font-medium mb-3'>Configure Server</h3>
                                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
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
                                        <label className={labelClass}>User ID *</label>
                                        <input
                                            type='number'
                                            value={userId || ''}
                                            onChange={(e) => setUserId(Number(e.target.value))}
                                            className={inputClass}
                                            placeholder='1'
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Memory (MB)</label>
                                        <input
                                            type='number'
                                            value={memory || ''}
                                            onChange={(e) => setMemory(Number(e.target.value))}
                                            className={inputClass}
                                            placeholder='1024'
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Disk (MB)</label>
                                        <input
                                            type='number'
                                            value={disk || ''}
                                            onChange={(e) => setDisk(Number(e.target.value))}
                                            className={inputClass}
                                            placeholder='10240'
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>CPU (%)</label>
                                        <input
                                            type='number'
                                            value={cpu || ''}
                                            onChange={(e) => setCpu(Number(e.target.value))}
                                            className={inputClass}
                                            placeholder='100'
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>IO Weight</label>
                                        <input
                                            type='number'
                                            value={io}
                                            onChange={(e) => setIo(Number(e.target.value))}
                                            className={inputClass}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Swap (MB)</label>
                                        <input
                                            type='number'
                                            value={swap || ''}
                                            onChange={(e) => setSwap(Number(e.target.value))}
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
                                        />
                                    </div>
                                    <div className='md:col-span-2'>
                                        <label className={labelClass}>Docker Image</label>
                                        <input
                                            type='text'
                                            value={dockerImage}
                                            onChange={(e) => setDockerImage(e.target.value)}
                                            className={inputClass}
                                        />
                                    </div>
                                </div>

                                <div className='mt-4'>
                                    <div className='flex items-center justify-between mb-2'>
                                        <label className='text-sm text-gray-400 font-medium'>
                                            Environment Variables
                                        </label>
                                        <button
                                            type='button'
                                            onClick={addEnvVar}
                                            className='text-xs text-blue-400 hover:text-blue-300'
                                        >
                                            + Add Variable
                                        </button>
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
                                            <button
                                                type='button'
                                                onClick={() => removeEnvVar(i)}
                                                className='text-red-400 hover:text-red-300 px-2'
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h3 className='text-gray-200 font-medium mb-3'>Feature Limits</h3>
                                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                                    <div>
                                        <label className={labelClass}>Databases</label>
                                        <input
                                            type='number'
                                            value={databases || ''}
                                            onChange={(e) => setDatabases(Number(e.target.value))}
                                            className={inputClass}
                                            placeholder='0'
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Allocations</label>
                                        <input
                                            type='number'
                                            value={allocations || ''}
                                            onChange={(e) => setAllocations(Number(e.target.value))}
                                            className={inputClass}
                                            placeholder='0'
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Backups</label>
                                        <input
                                            type='number'
                                            value={backups || ''}
                                            onChange={(e) => setBackups(Number(e.target.value))}
                                            className={inputClass}
                                            placeholder='0'
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className='flex items-center space-x-3 pt-2'>
                                <button
                                    onClick={handleSubmit}
                                    disabled={saving || !name || !userId || !eggId}
                                    className='px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm rounded transition-colors'
                                >
                                    {saving ? 'Creating...' : 'Create Server'}
                                </button>
                                <Link
                                    to='..'
                                    className='px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm rounded transition-colors'
                                >
                                    Cancel
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
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
        getEggVariables(details!.nestId, details!.eggId),
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

    // Manage state
    const [manageAction, setManageAction] = useState<string | null>(null);

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
            setDetailsError(httpErrorToHuman(e as { response?: { data?: unknown }; message?: string }));
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
            setBuildError(httpErrorToHuman(e as { response?: { data?: unknown }; message?: string }));
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
            setStartupError(httpErrorToHuman(e as { response?: { data?: unknown }; message?: string }));
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
            setDbError(httpErrorToHuman(e as { response?: { data?: unknown }; message?: string }));
        } finally {
            setDbSaving(false);
        }
    };

    const handleDeleteDatabase = async (dbId: number) => {
        if (!confirm('Delete this database?')) return;
        try {
            await deleteServerDatabase(serverId, dbId);
            mutateDatabases();
        } catch (e: any) {
            alert(httpErrorToHuman(e as { response?: { data?: unknown }; message?: string }));
        }
    };

    const handleReinstall = async () => {
        setManageAction('reinstall');
        try {
            await reinstallServer(serverId);
            mutateServer();
        } catch (e: any) {
            alert(httpErrorToHuman(e as { response?: { data?: unknown }; message?: string }));
        } finally {
            setManageAction(null);
        }
    };

    const handleSuspend = async () => {
        setManageAction('suspend');
        try {
            await suspendServer(serverId);
            mutateServer();
        } catch (e: any) {
            alert(httpErrorToHuman(e as { response?: { data?: unknown }; message?: string }));
        } finally {
            setManageAction(null);
        }
    };

    const handleUnsuspend = async () => {
        setManageAction('unsuspend');
        try {
            await unsuspendServer(serverId);
            mutateServer();
        } catch (e: any) {
            alert(httpErrorToHuman(e as { response?: { data?: unknown }; message?: string }));
        } finally {
            setManageAction(null);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this server? This cannot be undone.')) return;
        setManageAction('delete');
        try {
            await deleteServer(serverId);
            navigate('/admin/servers');
        } catch (e: any) {
            alert(httpErrorToHuman(e as { response?: { data?: unknown }; message?: string }));
        } finally {
            setManageAction(null);
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
                <Link to='..' className='text-sm text-gray-400 hover:text-gray-200 transition-colors'>
                    Back to Servers
                </Link>
            </MainPageHeader>

            <div className='flex items-center space-x-1 border-b border-gray-800 overflow-x-auto'>
                {tabs.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                            activeTab === tab
                                ? 'border-blue-500 text-blue-400'
                                : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-600'
                        }`}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            <div className='mt-4'>
                {/* Details Tab */}
                {activeTab === 'details' && (
                    <div className='space-y-6'>
                        <div className='bg-[#1a1a1a] border border-gray-800 rounded-lg p-6'>
                            <h3 className='text-gray-200 font-medium mb-4'>Server Information</h3>
                            <div className='grid grid-cols-2 md:grid-cols-3 gap-4 text-sm'>
                                <div>
                                    <span className='text-gray-500'>UUID</span>
                                    <p className='text-gray-200 font-mono text-xs'>{server.uuid}</p>
                                </div>
                                <div>
                                    <span className='text-gray-500'>Owner</span>
                                    <p className='text-gray-200'>
                                        #{details.userId}
                                        {details.user?.username && ` (${details.user.username})`}
                                    </p>
                                </div>
                                <div>
                                    <span className='text-gray-500'>Node</span>
                                    <p className='text-gray-200'>
                                        #{details.nodeId}
                                        {details.node?.name && ` (${details.node.name})`}
                                    </p>
                                </div>
                                <div>
                                    <span className='text-gray-500'>Egg</span>
                                    <p className='text-gray-200'>
                                        #{details.eggId}
                                        {details.egg?.name && ` (${details.egg.name})`}
                                    </p>
                                </div>
                                <div>
                                    <span className='text-gray-500'>Image</span>
                                    <p className='text-gray-200 font-mono text-xs'>{details.image}</p>
                                </div>
                                <div>
                                    <span className='text-gray-500'>Created</span>
                                    <p className='text-gray-200'>{new Date(details.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </div>

                        <div className='bg-[#1a1a1a] border border-gray-800 rounded-lg p-6'>
                            <h3 className='text-gray-200 font-medium mb-4'>Edit Details</h3>
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
                                        <label className='text-sm text-gray-400 font-medium'>
                                            Environment Variables
                                        </label>
                                        <button
                                            type='button'
                                            onClick={addDetailsEnvVar}
                                            className='text-xs text-blue-400 hover:text-blue-300'
                                        >
                                            + Add Variable
                                        </button>
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
                                            <button
                                                type='button'
                                                onClick={() => removeDetailsEnvVar(i)}
                                                className='text-red-400 hover:text-red-300 px-2'
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <div className='flex justify-end'>
                                    <button
                                        onClick={handleDetailsSave}
                                        disabled={detailsSaving}
                                        className='px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm rounded transition-colors'
                                    >
                                        {detailsSaving ? 'Saving...' : 'Save Details'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Build Tab */}
                {activeTab === 'build' && (
                    <div className='bg-[#1a1a1a] border border-gray-800 rounded-lg p-6'>
                        <h3 className='text-gray-200 font-medium mb-4'>Build Configuration</h3>
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
                                    className='rounded border-gray-700'
                                />
                                <label htmlFor='oomKill' className='text-sm text-gray-400'>
                                    Enable OOM Kill
                                </label>
                            </div>

                            <div className='flex justify-end'>
                                <button
                                    onClick={handleBuildSave}
                                    disabled={buildSaving}
                                    className='px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm rounded transition-colors'
                                >
                                    {buildSaving ? 'Saving...' : 'Save Build'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Startup Tab */}
                {activeTab === 'startup' && (
                    <div className='space-y-6'>
                        {eggVars && eggVars.length > 0 && (
                            <div className='bg-[#1a1a1a] border border-gray-800 rounded-lg p-4'>
                                <h4 className='text-sm text-gray-400 font-medium mb-2'>Egg Variable Defaults</h4>
                                <div className='space-y-1'>
                                    {eggVars.map((v) => (
                                        <div key={v.id} className='text-xs text-gray-500'>
                                            <span className='text-gray-400 font-mono'>{v.envVariable}</span>:{' '}
                                            {v.defaultValue || '(empty)'}
                                            {v.description && <span className='ml-2'>- {v.description}</span>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className='bg-[#1a1a1a] border border-gray-800 rounded-lg p-6'>
                            <h3 className='text-gray-200 font-medium mb-4'>Startup Configuration</h3>
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
                                        <label className='text-sm text-gray-400 font-medium'>
                                            Environment Variables
                                        </label>
                                        <button
                                            type='button'
                                            onClick={addStartupEnvVar}
                                            className='text-xs text-blue-400 hover:text-blue-300'
                                        >
                                            + Add Variable
                                        </button>
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
                                            <button
                                                type='button'
                                                onClick={() => removeStartupEnvVar(i)}
                                                className='text-red-400 hover:text-red-300 px-2'
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <div className='flex justify-end'>
                                    <button
                                        onClick={handleStartupSave}
                                        disabled={startupSaving}
                                        className='px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm rounded transition-colors'
                                    >
                                        {startupSaving ? 'Saving...' : 'Save Startup'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Databases Tab */}
                {activeTab === 'databases' && (
                    <div className='space-y-6'>
                        <div className='bg-[#1a1a1a] border border-gray-800 rounded-lg overflow-hidden'>
                            <div className='px-6 py-4 border-b border-gray-800'>
                                <h3 className='text-gray-200 font-medium'>Databases</h3>
                            </div>
                            <table className='w-full text-sm'>
                                <thead>
                                    <tr className='border-b border-gray-800'>
                                        <th className='text-left px-6 py-3 text-gray-500 font-medium'>Database</th>
                                        <th className='text-left px-6 py-3 text-gray-500 font-medium'>Username</th>
                                        <th className='text-left px-6 py-3 text-gray-500 font-medium'>Host ID</th>
                                        <th className='text-right px-6 py-3 text-gray-500 font-medium'>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {!databases ? (
                                        <tr>
                                            <td colSpan={4} className='text-center py-8 text-gray-500'>
                                                Loading...
                                            </td>
                                        </tr>
                                    ) : databases.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className='text-center py-8 text-gray-500'>
                                                No databases configured.
                                            </td>
                                        </tr>
                                    ) : (
                                        databases.map((db) => (
                                            <tr
                                                key={db.id}
                                                className='border-b border-gray-800 last:border-0 hover:bg-white/[0.02]'
                                            >
                                                <td className='px-6 py-3 text-gray-200 font-mono text-xs'>
                                                    {db.database}
                                                </td>
                                                <td className='px-6 py-3 text-gray-300 font-mono text-xs'>
                                                    {db.username}
                                                </td>
                                                <td className='px-6 py-3 text-gray-400'>#{db.hostId}</td>
                                                <td className='px-6 py-3 text-right'>
                                                    <button
                                                        onClick={() => handleDeleteDatabase(db.id)}
                                                        className='text-xs text-red-400 hover:text-red-300'
                                                    >
                                                        Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className='bg-[#1a1a1a] border border-gray-800 rounded-lg p-6'>
                            <h3 className='text-gray-200 font-medium mb-4'>Create Database</h3>
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
                                    <button
                                        onClick={handleCreateDatabase}
                                        disabled={dbSaving || !dbHostId}
                                        className='px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm rounded transition-colors'
                                    >
                                        {dbSaving ? 'Creating...' : 'Create Database'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Manage Tab */}
                {activeTab === 'manage' && (
                    <div className='space-y-6'>
                        <div className='bg-[#1a1a1a] border border-gray-800 rounded-lg p-6'>
                            <h3 className='text-gray-200 font-medium mb-4'>Server Actions</h3>
                            <div className='flex flex-wrap gap-3'>
                                <button
                                    onClick={handleReinstall}
                                    disabled={manageAction === 'reinstall'}
                                    className='px-4 py-2 bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 text-white text-sm rounded transition-colors'
                                >
                                    {manageAction === 'reinstall' ? 'Reinstalling...' : 'Reinstall Server'}
                                </button>

                                {server.suspended ? (
                                    <button
                                        onClick={handleUnsuspend}
                                        disabled={manageAction === 'unsuspend'}
                                        className='px-4 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-sm rounded transition-colors'
                                    >
                                        {manageAction === 'unsuspend' ? 'Unsuspending...' : 'Unsuspend Server'}
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleSuspend}
                                        disabled={manageAction === 'suspend'}
                                        className='px-4 py-2 bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 text-white text-sm rounded transition-colors'
                                    >
                                        {manageAction === 'suspend' ? 'Suspending...' : 'Suspend Server'}
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className='bg-[#1a1a1a] border border-red-800/50 rounded-lg p-6'>
                            <h3 className='text-red-400 font-medium mb-2'>Danger Zone</h3>
                            <p className='text-sm text-gray-500 mb-4'>
                                Deleting this server will permanently remove all data. This action cannot be undone.
                            </p>
                            <button
                                onClick={handleDelete}
                                disabled={manageAction === 'delete'}
                                className='px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-sm rounded transition-colors'
                            >
                                {manageAction === 'delete' ? 'Deleting...' : 'Delete Server'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const AdminServersContainer = () => {
    const [page, setPage] = useState(1);
    const { data, error, mutate } = useSWR(['admin:servers', page], () => getServers({ page }));

    const handleSuspend = async (id: number) => {
        try {
            await suspendServer(id);
            mutate();
        } catch (e: any) {
            alert(httpErrorToHuman(e as { response?: { data?: unknown }; message?: string }));
        }
    };

    const handleUnsuspend = async (id: number) => {
        try {
            await unsuspendServer(id);
            mutate();
        } catch (e: any) {
            alert(httpErrorToHuman(e as { response?: { data?: unknown }; message?: string }));
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this server?')) return;
        try {
            await deleteServer(id);
            mutate();
        } catch (e: any) {
            alert(httpErrorToHuman(e as { response?: { data?: unknown }; message?: string }));
        }
    };

    return (
        <Routes>
            <Route
                index
                element={
                    <div>
                        <MainPageHeader title='Servers'>
                            <Link
                                to='new'
                                className='px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded transition-colors cursor-pointer'
                            >
                                Create Server
                            </Link>
                        </MainPageHeader>

                        {error && <div className='text-red-400 mb-4'>Error: {httpErrorToHuman(error)}</div>}

                        {!data ? (
                            <Spinner />
                        ) : (
                            <Pagination data={data} onPageSelect={setPage}>
                                {({ items }) => (
                                    <div className='bg-[#1a1a1a] border border-gray-800 rounded-lg overflow-hidden'>
                                        <table className='w-full text-sm'>
                                            <thead>
                                                <tr className='border-b border-gray-800'>
                                                    <th className='text-left px-4 py-3 text-gray-500 font-medium'>
                                                        Name
                                                    </th>
                                                    <th className='text-left px-4 py-3 text-gray-500 font-medium'>
                                                        Owner
                                                    </th>
                                                    <th className='text-left px-4 py-3 text-gray-500 font-medium'>
                                                        Node
                                                    </th>
                                                    <th className='text-left px-4 py-3 text-gray-500 font-medium'>
                                                        Memory
                                                    </th>
                                                    <th className='text-left px-4 py-3 text-gray-500 font-medium'>
                                                        Disk
                                                    </th>
                                                    <th className='text-left px-4 py-3 text-gray-500 font-medium'>
                                                        Status
                                                    </th>
                                                    <th className='text-right px-4 py-3 text-gray-500 font-medium'>
                                                        Actions
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {items.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={7} className='text-center py-8 text-gray-500'>
                                                            No servers found.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    items.map((server: AdminServer) => (
                                                        <tr
                                                            key={server.id}
                                                            className='border-b border-gray-800 last:border-0 hover:bg-white/[0.02]'
                                                        >
                                                            <td className='px-4 py-3'>
                                                                <Link
                                                                    to={String(server.id)}
                                                                    className='text-gray-200 font-medium hover:text-gray-100 cursor-pointer'
                                                                >
                                                                    {server.name}
                                                                </Link>
                                                                {server.description && (
                                                                    <div className='text-xs text-gray-600 mt-0.5'>
                                                                        {server.description}
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td className='px-4 py-3 text-gray-300'>#{server.user}</td>
                                                            <td className='px-4 py-3 text-gray-300'>#{server.node}</td>
                                                            <td className='px-4 py-3 text-gray-300'>
                                                                {server.memory} MB
                                                            </td>
                                                            <td className='px-4 py-3 text-gray-300'>
                                                                {server.disk} MB
                                                            </td>
                                                            <td className='px-4 py-3'>
                                                                <span
                                                                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                                                        server.suspended
                                                                            ? 'bg-yellow-900/50 text-yellow-400'
                                                                            : server.status === 'installing'
                                                                              ? 'bg-blue-900/50 text-blue-400'
                                                                              : 'bg-green-900/50 text-green-400'
                                                                    }`}
                                                                >
                                                                    {server.suspended
                                                                        ? 'Suspended'
                                                                        : server.status || 'Active'}
                                                                </span>
                                                            </td>
                                                            <td className='px-4 py-3 text-right'>
                                                                <div className='flex items-center justify-end gap-2'>
                                                                    <Link
                                                                        to={String(server.id)}
                                                                        className='text-xs text-blue-400 hover:text-blue-300'
                                                                    >
                                                                        View
                                                                    </Link>
                                                                    {server.suspended ? (
                                                                        <button
                                                                            onClick={() => handleUnsuspend(server.id)}
                                                                            className='text-xs text-green-400 hover:text-green-300'
                                                                        >
                                                                            Unsuspend
                                                                        </button>
                                                                    ) : (
                                                                        <button
                                                                            onClick={() => handleSuspend(server.id)}
                                                                            className='text-xs text-yellow-400 hover:text-yellow-300'
                                                                        >
                                                                            Suspend
                                                                        </button>
                                                                    )}
                                                                    <button
                                                                        onClick={() => handleDelete(server.id)}
                                                                        className='text-xs text-red-400 hover:text-red-300'
                                                                    >
                                                                        Delete
                                                                    </button>
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
                    </div>
                }
            />
            <Route path='new' element={<AdminServerCreate />} />
            <Route path=':id/*' element={<AdminServerViewContainer />} />
        </Routes>
    );
};

export default AdminServersContainer;
