import { TrashBin } from '@gravity-ui/icons';
import { useEffect, useState } from 'react';
import { Link, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import useSWR from 'swr';
import { getLocations } from '@/api/admin/locations';
import {
    type AdminAllocation,
    type AdminNode,
    createAllocation,
    createNode,
    deleteAllocation,
    deleteNode,
    getNode,
    getNodeAllocations,
    getNodes,
    updateNode,
} from '@/api/admin/nodes';
import { httpErrorToHuman } from '@/api/http';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import Pagination from '@/components/elements/Pagination';
import Spinner from '@/components/elements/Spinner';

const AdminNodeCreate = () => {
    const navigate = useNavigate();
    const { data: locations } = useSWR('admin:locations:list', () => getLocations({ page: 1 }));

    const [name, setName] = useState('');
    const [fqdn, setFqdn] = useState('');
    const [description, setDescription] = useState('');
    const [locationId, setLocationId] = useState<number>(0);
    const [scheme, setScheme] = useState('https');
    const [memory, setMemory] = useState(1024);
    const [disk, setDisk] = useState(5120);
    const [memoryOverallocate, setMemoryOverallocate] = useState(0);
    const [diskOverallocate, setDiskOverallocate] = useState(0);
    const [daemonBase, setDaemonBase] = useState('/srv/daemon');
    const [daemonListen, setDaemonListen] = useState(8080);
    const [daemonSftp, setDaemonSftp] = useState(2022);
    const [isPublic, setIsPublic] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        setError('');
        setIsSubmitting(true);
        try {
            await createNode({
                name,
                fqdn,
                description,
                location_id: locationId,
                scheme,
                memory,
                disk,
                memory_overallocate: memoryOverallocate,
                disk_overallocate: diskOverallocate,
                daemon_base: daemonBase,
                daemon_listen: daemonListen,
                daemon_sftp: daemonSftp,
                public: isPublic,
            });
            navigate('..');
        } catch (e: any) {
            setError(httpErrorToHuman(e));
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputClass =
        'w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500 transition-colors';

    return (
        <div>
            <MainPageHeader title='Create Node' />

            <div className='bg-[#1a1a1a] border border-gray-800 rounded-lg p-6 max-w-2xl'>
                {error && <div className='text-red-400 mb-4 text-sm'>Error: {error}</div>}

                <div className='space-y-4'>
                    <div>
                        <label className='block text-sm text-gray-400 mb-1'>Name *</label>
                        <input
                            type='text'
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className={inputClass}
                            placeholder='My Node'
                        />
                    </div>

                    <div>
                        <label className='block text-sm text-gray-400 mb-1'>FQDN *</label>
                        <input
                            type='text'
                            value={fqdn}
                            onChange={(e) => setFqdn(e.target.value)}
                            className={inputClass}
                            placeholder='node.example.com'
                        />
                    </div>

                    <div>
                        <label className='block text-sm text-gray-400 mb-1'>Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className={inputClass}
                            rows={2}
                            placeholder='Optional description'
                        />
                    </div>

                    <div>
                        <label className='block text-sm text-gray-400 mb-1'>Location *</label>
                        <select
                            value={locationId}
                            onChange={(e) => setLocationId(Number(e.target.value))}
                            className={inputClass}
                        >
                            <option value={0}>Select a location</option>
                            {locations?.items.map((loc) => (
                                <option key={loc.id} value={loc.id}>
                                    {loc.short} - {loc.long}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className='block text-sm text-gray-400 mb-1'>Scheme</label>
                        <select value={scheme} onChange={(e) => setScheme(e.target.value)} className={inputClass}>
                            <option value='https'>https</option>
                            <option value='http'>http</option>
                        </select>
                    </div>

                    <div className='grid grid-cols-2 gap-4'>
                        <div>
                            <label className='block text-sm text-gray-400 mb-1'>Memory (MB)</label>
                            <input
                                type='number'
                                value={memory}
                                onChange={(e) => setMemory(Number(e.target.value))}
                                className={inputClass}
                                min={0}
                            />
                        </div>
                        <div>
                            <label className='block text-sm text-gray-400 mb-1'>Disk (MB)</label>
                            <input
                                type='number'
                                value={disk}
                                onChange={(e) => setDisk(Number(e.target.value))}
                                className={inputClass}
                                min={0}
                            />
                        </div>
                    </div>

                    <div className='grid grid-cols-2 gap-4'>
                        <div>
                            <label className='block text-sm text-gray-400 mb-1'>Memory Overallocate %</label>
                            <input
                                type='number'
                                value={memoryOverallocate}
                                onChange={(e) => setMemoryOverallocate(Number(e.target.value))}
                                className={inputClass}
                                min={0}
                                max={100}
                            />
                        </div>
                        <div>
                            <label className='block text-sm text-gray-400 mb-1'>Disk Overallocate %</label>
                            <input
                                type='number'
                                value={diskOverallocate}
                                onChange={(e) => setDiskOverallocate(Number(e.target.value))}
                                className={inputClass}
                                min={0}
                                max={100}
                            />
                        </div>
                    </div>

                    <div>
                        <label className='block text-sm text-gray-400 mb-1'>Daemon Base</label>
                        <input
                            type='text'
                            value={daemonBase}
                            onChange={(e) => setDaemonBase(e.target.value)}
                            className={inputClass}
                        />
                    </div>

                    <div className='grid grid-cols-2 gap-4'>
                        <div>
                            <label className='block text-sm text-gray-400 mb-1'>Daemon Listen Port</label>
                            <input
                                type='number'
                                value={daemonListen}
                                onChange={(e) => setDaemonListen(Number(e.target.value))}
                                className={inputClass}
                                min={1}
                                max={65535}
                            />
                        </div>
                        <div>
                            <label className='block text-sm text-gray-400 mb-1'>Daemon SFTP Port</label>
                            <input
                                type='number'
                                value={daemonSftp}
                                onChange={(e) => setDaemonSftp(Number(e.target.value))}
                                className={inputClass}
                                min={1}
                                max={65535}
                            />
                        </div>
                    </div>

                    <div className='flex items-center space-x-2'>
                        <input
                            type='checkbox'
                            checked={isPublic}
                            onChange={(e) => setIsPublic(e.target.checked)}
                            className='rounded border-gray-700'
                            id='node-public'
                        />
                        <label htmlFor='node-public' className='text-sm text-gray-400'>
                            Public
                        </label>
                    </div>

                    <div className='flex items-center space-x-3 pt-2'>
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || !name || !fqdn || !locationId}
                            className='px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm rounded transition-colors'
                        >
                            {isSubmitting ? 'Creating...' : 'Create Node'}
                        </button>
                        <Link
                            to='..'
                            className='px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm rounded transition-colors'
                        >
                            Cancel
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

const AdminNodeViewContainer = () => {
    const { id } = useParams<{ id: string }>();
    const nodeId = Number(id);
    const navigate = useNavigate();

    const { data: node, error: nodeError, mutate: mutateNode } = useSWR(['admin:node', nodeId], () => getNode(nodeId));
    const {
        data: allocations,
        error: allocError,
        mutate: mutateAllocations,
    } = useSWR(['admin:node:allocations', nodeId], () => getNodeAllocations(nodeId));

    const [activeTab, setActiveTab] = useState<'overview' | 'allocations' | 'settings'>('overview');

    if (nodeError) return <div className='text-red-400 p-4'>Error: {httpErrorToHuman(nodeError)}</div>;
    if (!node) return <Spinner />;

    return (
        <div>
            <MainPageHeader title={node.name}>
                <Link to='..' className='text-sm text-gray-400 hover:text-gray-200 transition-colors'>
                    Back to Nodes
                </Link>
            </MainPageHeader>

            <div className='flex items-center space-x-1 border-b border-gray-800 overflow-x-auto'>
                {(['overview', 'allocations', 'settings'] as const).map((tab) => (
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
                {activeTab === 'overview' && <OverviewTab node={node} onUpdate={mutateNode} />}
                {activeTab === 'allocations' && (
                    <AllocationsTab
                        nodeId={nodeId}
                        allocations={allocations}
                        loading={!allocations && !allocError}
                        error={allocError}
                        onRefresh={mutateAllocations}
                    />
                )}
                {activeTab === 'settings' && (
                    <SettingsTab node={node} onUpdate={mutateNode} onDelete={() => navigate('/admin/nodes')} />
                )}
            </div>
        </div>
    );
};

const OverviewTab = ({ node, onUpdate }: { node: AdminNode; onUpdate: () => Promise<unknown> }) => {
    const [editing, setEditing] = useState(false);
    const [name, setName] = useState(node.name);
    const [description, setDescription] = useState(node.description);
    const [isMaintenance, setIsMaintenance] = useState(node.maintenanceMode);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        setName(node.name);
        setDescription(node.description);
        setIsMaintenance(node.maintenanceMode);
    }, [node]);

    const handleSave = async () => {
        setError('');
        setSaving(true);
        try {
            await updateNode(node.id, { name, description, maintenance_mode: isMaintenance });
            await onUpdate();
            setEditing(false);
        } catch (e: any) {
            setError(httpErrorToHuman(e));
        } finally {
            setSaving(false);
        }
    };

    const inputClass =
        'w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500 transition-colors';

    return (
        <div className='space-y-4'>
            {error && <div className='text-red-400 text-sm'>Error: {error}</div>}

            <div className='bg-[#1a1a1a] border border-gray-800 rounded-lg p-6'>
                <div className='flex items-center justify-between mb-4'>
                    <h3 className='text-gray-200 font-medium'>Node Information</h3>
                    <button
                        onClick={() => setEditing(!editing)}
                        className='text-xs text-blue-400 hover:text-blue-300 transition-colors'
                    >
                        {editing ? 'Cancel' : 'Edit'}
                    </button>
                </div>

                {editing ? (
                    <div className='space-y-3'>
                        <div>
                            <label className='block text-sm text-gray-400 mb-1'>Name</label>
                            <input
                                type='text'
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className='block text-sm text-gray-400 mb-1'>Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className={inputClass}
                                rows={2}
                            />
                        </div>
                        <div className='flex items-center space-x-2'>
                            <input
                                type='checkbox'
                                checked={isMaintenance}
                                onChange={(e) => setIsMaintenance(e.target.checked)}
                                className='rounded border-gray-700'
                                id='maintenance'
                            />
                            <label htmlFor='maintenance' className='text-sm text-gray-400'>
                                Maintenance Mode
                            </label>
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className='px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm rounded transition-colors'
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                ) : (
                    <div className='space-y-3 text-sm'>
                        <div className='grid grid-cols-2 gap-4'>
                            <div>
                                <span className='text-gray-500'>Name</span>
                                <p className='text-gray-200'>{node.name}</p>
                            </div>
                            <div>
                                <span className='text-gray-500'>FQDN</span>
                                <p className='text-gray-200'>
                                    <code className='text-blue-400'>
                                        {node.scheme}://{node.fqdn}:{node.daemonListen}
                                    </code>
                                </p>
                            </div>
                            <div>
                                <span className='text-gray-500'>Location</span>
                                <p className='text-gray-200'>#{node.locationId}</p>
                            </div>
                            <div>
                                <span className='text-gray-500'>Memory</span>
                                <p className='text-gray-200'>
                                    {node.memory} MB ({node.memoryOverallocate}% overallocate)
                                </p>
                            </div>
                            <div>
                                <span className='text-gray-500'>Disk</span>
                                <p className='text-gray-200'>
                                    {node.disk} MB ({node.diskOverallocate}% overallocate)
                                </p>
                            </div>
                            <div>
                                <span className='text-gray-500'>Servers</span>
                                <p className='text-gray-200'>{node.serversCount}</p>
                            </div>
                            <div>
                                <span className='text-gray-500'>Status</span>
                                <p>
                                    <span
                                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                            node.maintenanceMode
                                                ? 'bg-yellow-900/50 text-yellow-400'
                                                : 'bg-green-900/50 text-green-400'
                                        }`}
                                    >
                                        {node.maintenanceMode ? 'Maintenance Mode' : 'Active'}
                                    </span>
                                </p>
                            </div>
                        </div>
                        {node.description && (
                            <div>
                                <span className='text-gray-500'>Description</span>
                                <p className='text-gray-200'>{node.description}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

const AllocationsTab = ({
    nodeId,
    allocations,
    loading,
    error,
    onRefresh,
}: {
    nodeId: number;
    allocations: AdminAllocation[] | undefined;
    loading: boolean;
    error: unknown;
    onRefresh: () => Promise<unknown>;
}) => {
    const [ip, setIp] = useState('');
    const [port, setPort] = useState<number>(25565);
    const [alias, setAlias] = useState('');
    const [adding, setAdding] = useState(false);
    const [addError, setAddError] = useState('');

    const handleAdd = async () => {
        setAddError('');
        setAdding(true);
        try {
            await createAllocation(nodeId, {
                ip,
                port,
                ...(alias ? { alias } : {}),
            });
            setIp('');
            setPort(25565);
            setAlias('');
            await onRefresh();
        } catch (e: any) {
            setAddError(httpErrorToHuman(e));
        } finally {
            setAdding(false);
        }
    };

    const handleDelete = async (allocId: number) => {
        if (!confirm('Delete this allocation?')) return;
        try {
            await deleteAllocation(nodeId, allocId);
            await onRefresh();
        } catch (e: any) {
            alert(httpErrorToHuman(e));
        }
    };

    const inputClass =
        'w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500 transition-colors';

    return (
        <div className='space-y-4'>
            {error ? <div className='text-red-400 text-sm'>Error: {httpErrorToHuman(error as any)}</div> : null}

            <div className='bg-[#1a1a1a] border border-gray-800 rounded-lg p-6'>
                <h3 className='text-gray-200 font-medium mb-4'>Add Allocation</h3>
                {addError && <div className='text-red-400 text-sm mb-3'>Error: {addError}</div>}
                <div className='grid grid-cols-3 gap-3 mb-3'>
                    <div>
                        <label className='block text-sm text-gray-400 mb-1'>IP Address *</label>
                        <input
                            type='text'
                            value={ip}
                            onChange={(e) => setIp(e.target.value)}
                            className={inputClass}
                            placeholder='0.0.0.0'
                        />
                    </div>
                    <div>
                        <label className='block text-sm text-gray-400 mb-1'>Port *</label>
                        <input
                            type='number'
                            value={port}
                            onChange={(e) => setPort(Number(e.target.value))}
                            className={inputClass}
                            min={1}
                            max={65535}
                        />
                    </div>
                    <div>
                        <label className='block text-sm text-gray-400 mb-1'>Alias</label>
                        <input
                            type='text'
                            value={alias}
                            onChange={(e) => setAlias(e.target.value)}
                            className={inputClass}
                            placeholder='Optional'
                        />
                    </div>
                </div>
                <button
                    onClick={handleAdd}
                    disabled={adding || !ip || !port}
                    className='px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm rounded transition-colors'
                >
                    {adding ? 'Adding...' : 'Add Allocation'}
                </button>
            </div>

            <div className='bg-[#1a1a1a] border border-gray-800 rounded-lg overflow-hidden'>
                <table className='w-full text-sm'>
                    <thead>
                        <tr className='border-b border-gray-800'>
                            <th className='text-left px-4 py-3 text-gray-500 font-medium'>IP</th>
                            <th className='text-left px-4 py-3 text-gray-500 font-medium'>Port</th>
                            <th className='text-left px-4 py-3 text-gray-500 font-medium'>Alias</th>
                            <th className='text-left px-4 py-3 text-gray-500 font-medium'>Assigned Server</th>
                            <th className='text-right px-4 py-3 text-gray-500 font-medium'>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={5} className='text-center py-8 text-gray-500'>
                                    Loading...
                                </td>
                            </tr>
                        ) : !allocations || allocations.length === 0 ? (
                            <tr>
                                <td colSpan={5} className='text-center py-8 text-gray-500'>
                                    No allocations found.
                                </td>
                            </tr>
                        ) : (
                            allocations.map((alloc) => (
                                <tr
                                    key={alloc.id}
                                    className='border-b border-gray-800 last:border-0 hover:bg-white/[0.02]'
                                >
                                    <td className='px-4 py-3 text-gray-200 font-mono'>{alloc.ip}</td>
                                    <td className='px-4 py-3 text-gray-200 font-mono'>{alloc.port}</td>
                                    <td className='px-4 py-3 text-gray-300'>{alloc.alias || '-'}</td>
                                    <td className='px-4 py-3 text-gray-300'>
                                        {alloc.serverId ? `#${alloc.serverId}` : 'Unassigned'}
                                    </td>
                                    <td className='px-4 py-3 text-right'>
                                        {!alloc.serverId && (
                                            <button
                                                onClick={() => handleDelete(alloc.id)}
                                                className='text-xs text-red-400 hover:text-red-300 cursor-pointer p-1'
                                                title='Delete allocation'
                                            >
                                                <TrashBin fill='currentColor' className='w-4 h-4' />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const SettingsTab = ({
    node,
    onUpdate,
    onDelete,
}: {
    node: AdminNode;
    onUpdate: () => Promise<unknown>;
    onDelete: () => void;
}) => {
    const [name, setName] = useState(node.name);
    const [fqdn, setFqdn] = useState(node.fqdn);
    const [memory, setMemory] = useState(node.memory);
    const [disk, setDisk] = useState(node.disk);
    const [memoryOverallocate, setMemoryOverallocate] = useState(node.memoryOverallocate);
    const [diskOverallocate, setDiskOverallocate] = useState(node.diskOverallocate);
    const [daemonBase, setDaemonBase] = useState(node.daemonBase);
    const [daemonListen, setDaemonListen] = useState(node.daemonListen);
    const [daemonSftp, setDaemonSftp] = useState(node.daemonSftp);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        setName(node.name);
        setFqdn(node.fqdn);
        setMemory(node.memory);
        setDisk(node.disk);
        setMemoryOverallocate(node.memoryOverallocate);
        setDiskOverallocate(node.diskOverallocate);
        setDaemonBase(node.daemonBase);
        setDaemonListen(node.daemonListen);
        setDaemonSftp(node.daemonSftp);
    }, [node]);

    const handleSave = async () => {
        setError('');
        setSaving(true);
        try {
            await updateNode(node.id, {
                name,
                fqdn,
                memory,
                disk,
                memory_overallocate: memoryOverallocate,
                disk_overallocate: diskOverallocate,
                daemon_base: daemonBase,
                daemon_listen: daemonListen,
                daemon_sftp: daemonSftp,
            });
            await onUpdate();
        } catch (e: any) {
            setError(httpErrorToHuman(e));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to permanently delete this node? This cannot be undone.')) return;
        setDeleting(true);
        try {
            await deleteNode(node.id);
            onDelete();
        } catch (e: any) {
            alert(httpErrorToHuman(e));
        } finally {
            setDeleting(false);
        }
    };

    const inputClass =
        'w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500 transition-colors';

    return (
        <div className='space-y-6'>
            {error && <div className='text-red-400 text-sm'>Error: {error}</div>}

            <div className='bg-[#1a1a1a] border border-gray-800 rounded-lg p-6'>
                <h3 className='text-gray-200 font-medium mb-4'>Node Configuration</h3>
                <div className='space-y-4'>
                    <div className='grid grid-cols-2 gap-4'>
                        <div>
                            <label className='block text-sm text-gray-400 mb-1'>Name</label>
                            <input
                                type='text'
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className='block text-sm text-gray-400 mb-1'>FQDN</label>
                            <input
                                type='text'
                                value={fqdn}
                                onChange={(e) => setFqdn(e.target.value)}
                                className={inputClass}
                            />
                        </div>
                    </div>
                    <div className='grid grid-cols-2 gap-4'>
                        <div>
                            <label className='block text-sm text-gray-400 mb-1'>Memory (MB)</label>
                            <input
                                type='number'
                                value={memory}
                                onChange={(e) => setMemory(Number(e.target.value))}
                                className={inputClass}
                                min={0}
                            />
                        </div>
                        <div>
                            <label className='block text-sm text-gray-400 mb-1'>Disk (MB)</label>
                            <input
                                type='number'
                                value={disk}
                                onChange={(e) => setDisk(Number(e.target.value))}
                                className={inputClass}
                                min={0}
                            />
                        </div>
                    </div>
                    <div className='grid grid-cols-2 gap-4'>
                        <div>
                            <label className='block text-sm text-gray-400 mb-1'>Memory Overallocate %</label>
                            <input
                                type='number'
                                value={memoryOverallocate}
                                onChange={(e) => setMemoryOverallocate(Number(e.target.value))}
                                className={inputClass}
                                min={0}
                                max={100}
                            />
                        </div>
                        <div>
                            <label className='block text-sm text-gray-400 mb-1'>Disk Overallocate %</label>
                            <input
                                type='number'
                                value={diskOverallocate}
                                onChange={(e) => setDiskOverallocate(Number(e.target.value))}
                                className={inputClass}
                                min={0}
                                max={100}
                            />
                        </div>
                    </div>
                    <div>
                        <label className='block text-sm text-gray-400 mb-1'>Daemon Base</label>
                        <input
                            type='text'
                            value={daemonBase}
                            onChange={(e) => setDaemonBase(e.target.value)}
                            className={inputClass}
                        />
                    </div>
                    <div className='grid grid-cols-2 gap-4'>
                        <div>
                            <label className='block text-sm text-gray-400 mb-1'>Daemon Listen Port</label>
                            <input
                                type='number'
                                value={daemonListen}
                                onChange={(e) => setDaemonListen(Number(e.target.value))}
                                className={inputClass}
                                min={1}
                                max={65535}
                            />
                        </div>
                        <div>
                            <label className='block text-sm text-gray-400 mb-1'>Daemon SFTP Port</label>
                            <input
                                type='number'
                                value={daemonSftp}
                                onChange={(e) => setDaemonSftp(Number(e.target.value))}
                                className={inputClass}
                                min={1}
                                max={65535}
                            />
                        </div>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className='px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm rounded transition-colors'
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>

            <div className='bg-[#1a1a1a] border border-red-800/50 rounded-lg p-6'>
                <h3 className='text-red-400 font-medium mb-2'>Danger Zone</h3>
                <p className='text-sm text-gray-500 mb-4'>
                    Permanently delete this node and all associated data. This action cannot be undone.
                </p>
                <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className='px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-sm rounded transition-colors'
                >
                    {deleting ? 'Deleting...' : 'Delete Node'}
                </button>
            </div>
        </div>
    );
};

const AdminNodesContainer = () => {
    const [page, setPage] = useState(1);
    const { data, error, mutate } = useSWR(['admin:nodes', page], () => getNodes({ page }));

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this node?')) return;
        try {
            await deleteNode(id);
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
                        <MainPageHeader title='Nodes'>
                            <Link
                                to='new'
                                className='px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded transition-colors cursor-pointer'
                            >
                                Create Node
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
                                                        FQDN
                                                    </th>
                                                    <th className='text-left px-4 py-3 text-gray-500 font-medium'>
                                                        Location
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
                                                            No nodes found.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    items.map((node: AdminNode) => (
                                                        <tr
                                                            key={node.id}
                                                            className='border-b border-gray-800 last:border-0 hover:bg-white/[0.02]'
                                                        >
                                                            <td className='px-4 py-3'>
                                                                <Link
                                                                    to={String(node.id)}
                                                                    className='text-gray-200 font-medium hover:text-gray-100 cursor-pointer'
                                                                >
                                                                    {node.name}
                                                                </Link>
                                                            </td>
                                                            <td className='px-4 py-3'>
                                                                <code className='text-blue-400 text-xs'>
                                                                    {node.scheme}://{node.fqdn}:{node.daemonListen}
                                                                </code>
                                                            </td>
                                                            <td className='px-4 py-3 text-gray-300 cursor-default'>
                                                                #{node.locationId}
                                                            </td>
                                                            <td className='px-4 py-3 text-gray-300 cursor-default'>
                                                                {node.memory} MB
                                                            </td>
                                                            <td className='px-4 py-3 text-gray-300 cursor-default'>
                                                                {node.disk} MB
                                                            </td>
                                                            <td className='px-4 py-3'>
                                                                <span
                                                                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium cursor-default ${
                                                                        node.maintenanceMode
                                                                            ? 'bg-yellow-900/50 text-yellow-400'
                                                                            : 'bg-green-900/50 text-green-400'
                                                                    }`}
                                                                >
                                                                    {node.maintenanceMode ? 'Maintenance' : 'Active'}
                                                                </span>
                                                            </td>
                                                            <td className='px-4 py-3 text-right'>
                                                                <div className='flex items-center justify-end gap-2'>
                                                                    <Link
                                                                        to={String(node.id)}
                                                                        className='text-xs text-blue-400 hover:text-blue-300 cursor-pointer'
                                                                    >
                                                                        View
                                                                    </Link>
                                                                    <button
                                                                        onClick={() => handleDelete(node.id)}
                                                                        className='text-xs text-red-400 hover:text-red-300 cursor-pointer p-1'
                                                                        title='Delete node'
                                                                    >
                                                                        <TrashBin
                                                                            fill='currentColor'
                                                                            className='w-4 h-4'
                                                                        />
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
            <Route path='new' element={<AdminNodeCreate />} />
            <Route path=':id/*' element={<AdminNodeViewContainer />} />
        </Routes>
    );
};

export default AdminNodesContainer;
