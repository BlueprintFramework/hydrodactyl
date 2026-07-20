import { TrashBin } from '@gravity-ui/icons';
import { useState } from 'react';
import { Link, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import useSWR, { mutate } from 'swr';
import { toast } from 'sonner';
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
import { Dialog } from '@/components/elements/dialog';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import Pagination from '@/components/elements/Pagination';
import Spinner from '@/components/elements/Spinner';
import { Button } from '@/components/ui/button';

const inputClass =
    'w-full bg-mocha-600 border border-mocha-400 rounded px-3 py-2 text-sm text-cream-400 focus:outline-none focus:border-mocha-300 transition-colors';
const labelClass = 'block text-sm text-mocha-200 mb-1';

const CreateNodeModal = ({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) => {
    const { data: locations } = useSWR(open ? 'admin:locations:list' : null, () => getLocations({ page: 1 }));

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

    const resetForm = () => {
        setName('');
        setFqdn('');
        setDescription('');
        setLocationId(0);
        setScheme('https');
        setMemory(1024);
        setDisk(5120);
        setMemoryOverallocate(0);
        setDiskOverallocate(0);
        setDaemonBase('/srv/daemon');
        setDaemonListen(8080);
        setDaemonSftp(2022);
        setIsPublic(true);
        setError('');
    };

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
            resetForm();
            onCreated();
            onClose();
        } catch (e: any) {
            setError(httpErrorToHuman(e));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} title='Create Node'>
            {error && <div className='text-red-400 mb-4 text-sm'>Error: {error}</div>}
            <div className='space-y-4 max-h-[60vh] overflow-y-auto pr-2'>
                <div>
                    <label className={labelClass}>Name *</label>
                    <input type='text' value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder='My Node' />
                </div>
                <div>
                    <label className={labelClass}>FQDN *</label>
                    <input type='text' value={fqdn} onChange={(e) => setFqdn(e.target.value)} className={inputClass} placeholder='node.example.com' />
                </div>
                <div>
                    <label className={labelClass}>Description</label>
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} rows={2} placeholder='Optional' />
                </div>
                <div>
                    <label className={labelClass}>Location *</label>
                    <select value={locationId} onChange={(e) => setLocationId(Number(e.target.value))} className={inputClass}>
                        <option value={0}>Select a location</option>
                        {locations?.items.map((loc) => (
                            <option key={loc.id} value={loc.id}>{loc.short} - {loc.long}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className={labelClass}>Scheme</label>
                    <select value={scheme} onChange={(e) => setScheme(e.target.value)} className={inputClass}>
                        <option value='https'>https</option>
                        <option value='http'>http</option>
                    </select>
                </div>
                <div className='grid grid-cols-2 gap-4'>
                    <div>
                        <label className={labelClass}>Memory (MB)</label>
                        <input type='number' value={memory} onChange={(e) => setMemory(Number(e.target.value))} className={inputClass} min={0} />
                    </div>
                    <div>
                        <label className={labelClass}>Disk (MB)</label>
                        <input type='number' value={disk} onChange={(e) => setDisk(Number(e.target.value))} className={inputClass} min={0} />
                    </div>
                </div>
                <div className='grid grid-cols-2 gap-4'>
                    <div>
                        <label className={labelClass}>Memory Overallocate %</label>
                        <input type='number' value={memoryOverallocate} onChange={(e) => setMemoryOverallocate(Number(e.target.value))} className={inputClass} min={0} max={100} />
                    </div>
                    <div>
                        <label className={labelClass}>Disk Overallocate %</label>
                        <input type='number' value={diskOverallocate} onChange={(e) => setDiskOverallocate(Number(e.target.value))} className={inputClass} min={0} max={100} />
                    </div>
                </div>
                <div>
                    <label className={labelClass}>Daemon Base</label>
                    <input type='text' value={daemonBase} onChange={(e) => setDaemonBase(e.target.value)} className={inputClass} />
                </div>
                <div className='grid grid-cols-2 gap-4'>
                    <div>
                        <label className={labelClass}>Daemon Listen Port</label>
                        <input type='number' value={daemonListen} onChange={(e) => setDaemonListen(Number(e.target.value))} className={inputClass} min={1} max={65535} />
                    </div>
                    <div>
                        <label className={labelClass}>Daemon SFTP Port</label>
                        <input type='number' value={daemonSftp} onChange={(e) => setDaemonSftp(Number(e.target.value))} className={inputClass} min={1} max={65535} />
                    </div>
                </div>
                <div className='flex items-center space-x-2'>
                    <input type='checkbox' checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} className='rounded border-mocha-400' id='modal-node-public' />
                    <label htmlFor='modal-node-public' className='text-sm text-mocha-200'>Public</label>
                </div>
            </div>
            <Dialog.Footer>
                <div className='flex items-center gap-3 p-6'>
                    <Button variant='default' onClick={handleSubmit} disabled={isSubmitting || !name || !fqdn || !locationId}>{isSubmitting ? 'Creating...' : 'Create Node'}</Button>
                    <Button variant='secondary' onClick={onClose}>Cancel</Button>
                </div>
            </Dialog.Footer>
        </Dialog>
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
    const { data: locations } = useSWR('admin:locations:list', () => getLocations({ page: 1 }));
    const [activeTab, setActiveTab] = useState<'overview' | 'allocations' | 'settings'>('overview');

    if (nodeError) return <div className='text-red-400 p-4'>Error: {httpErrorToHuman(nodeError)}</div>;
    if (!node) return <Spinner />;

    return (
        <div>
            <MainPageHeader title={node.name}>
                <Link to='..' className='text-sm text-mocha-200 hover:text-cream-400 transition-colors'>
                    Back to Nodes
                </Link>
            </MainPageHeader>

            <div className='flex items-center space-x-1 border-b border-mocha-400 overflow-x-auto'>
                {(['overview', 'allocations', 'settings'] as const).map((tab) => (
                    <Button
                        key={tab}
                        variant='ghost'
                        onClick={() => setActiveTab(tab)}
                        className={`border-b-2 rounded-none ${
                            activeTab === tab
                                ? 'text-cream-400 border-cream-400'
                                : 'text-mocha-200 hover:text-mocha-100 border-transparent'
                        }`}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </Button>
                ))}
            </div>

            <div className='mt-4'>
                {activeTab === 'overview' && (
                    <OverviewTab node={node} onUpdate={mutateNode} locations={locations?.items || []} />
                )}
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
                    <SettingsTab node={node} onUpdate={mutateNode} onDelete={() => navigate('/admin/nodes')} locations={locations?.items || []} />
                )}
            </div>
        </div>
    );
};

const OverviewTab = ({ node, onUpdate, locations }: { node: AdminNode; onUpdate: () => Promise<unknown>; locations: { id: number; short: string; long: string }[] }) => {
    const [editing, setEditing] = useState(false);
    const [formInit, setFormInit] = useState(false);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [fqdn, setFqdn] = useState('');
    const [scheme, setScheme] = useState('https');
    const [memory, setMemory] = useState(0);
    const [disk, setDisk] = useState(0);
    const [memoryOverallocate, setMemoryOverallocate] = useState(0);
    const [diskOverallocate, setDiskOverallocate] = useState(0);
    const [isPublic, setIsPublic] = useState(true);
    const [behindProxy, setBehindProxy] = useState(false);
    const [isMaintenance, setIsMaintenance] = useState(false);
    const [locationId, setLocationId] = useState(node.locationId);
    const [saving, setSaving] = useState(false);

    const syncFromNode = () => {
        setName(node.name);
        setDescription(node.description);
        setFqdn(node.fqdn);
        setScheme(node.scheme);
        setMemory(node.memory);
        setDisk(node.disk);
        setMemoryOverallocate(node.memoryOverallocate);
        setDiskOverallocate(node.diskOverallocate);
        setIsPublic(node.public);
        setBehindProxy(node.behindProxy);
        setIsMaintenance(node.maintenanceMode);
        setLocationId(node.locationId);
    };

    if (!formInit) {
        syncFromNode();
        setFormInit(true);
    }

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateNode(node.id, {
                name,
                description,
                fqdn,
                scheme,
                memory,
                disk,
                memory_overallocate: memoryOverallocate,
                disk_overallocate: diskOverallocate,
                public: isPublic,
                behind_proxy: behindProxy,
                maintenance_mode: isMaintenance,
                location_id: locationId,
            });
            await onUpdate();
            setEditing(false);
            toast.success('Node updated successfully');
        } catch (e: any) {
            toast.error(httpErrorToHuman(e));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className='space-y-6'>
            {/* General Settings Card */}
            <div className='bg-mocha-500 border border-mocha-400 rounded-xl p-6'>
                <div className='flex items-center justify-between mb-6'>
                    <div>
                        <h3 className='text-cream-400 font-semibold text-lg'>General Settings</h3>
                        <p className='text-mocha-200 text-sm mt-1'>Basic node configuration and identification</p>
                    </div>
                    {!editing && (
                        <Button variant='secondary' onClick={() => setEditing(true)}>Edit Settings</Button>
                    )}
                </div>

                {editing ? (
                    <div className='space-y-5'>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
                            <div>
                                <label className={labelClass}>Node Name *</label>
                                <input type='text' value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder='My Node' />
                            </div>
                            <div>
                                <label className={labelClass}>Location *</label>
                                <select value={locationId} onChange={(e) => setLocationId(Number(e.target.value))} className={inputClass}>
                                    {locations.map((loc) => (
                                        <option key={loc.id} value={loc.id}>{loc.short} - {loc.long}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className={labelClass}>Description</label>
                            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} rows={3} placeholder='Optional description for this node' />
                        </div>

                        <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
                            <div>
                                <label className={labelClass}>Public FQDN *</label>
                                <input type='text' value={fqdn} onChange={(e) => setFqdn(e.target.value)} className={inputClass} placeholder='node.example.com' />
                            </div>
                            <div>
                                <label className={labelClass}>Connection Scheme</label>
                                <select value={scheme} onChange={(e) => setScheme(e.target.value)} className={inputClass}>
                                    <option value='https'>HTTPS (Recommended)</option>
                                    <option value='http'>HTTP</option>
                                </select>
                            </div>
                        </div>

                        <div className='flex items-center gap-6 pt-2'>
                            <div className='flex items-center space-x-2'>
                                <input type='checkbox' checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} className='rounded border-mocha-400 w-4 h-4' id='ov-public' />
                                <label htmlFor='ov-public' className='text-sm text-cream-400 cursor-pointer'>Public Node</label>
                            </div>
                            <div className='flex items-center space-x-2'>
                                <input type='checkbox' checked={behindProxy} onChange={(e) => setBehindProxy(e.target.checked)} className='rounded border-mocha-400 w-4 h-4' id='ov-proxy' />
                                <label htmlFor='ov-proxy' className='text-sm text-cream-400 cursor-pointer'>Behind Proxy</label>
                            </div>
                            <div className='flex items-center space-x-2'>
                                <input type='checkbox' checked={isMaintenance} onChange={(e) => setIsMaintenance(e.target.checked)} className='rounded border-mocha-400 w-4 h-4' id='ov-maintenance' />
                                <label htmlFor='ov-maintenance' className='text-sm text-cream-400 cursor-pointer'>Maintenance Mode</label>
                            </div>
                        </div>

                        <div className='flex items-center gap-3 pt-2'>
                            <Button variant='default' onClick={handleSave} disabled={saving || !name || !fqdn}>{saving ? 'Saving...' : 'Save Changes'}</Button>
                            <Button variant='secondary' onClick={() => { syncFromNode(); setEditing(false); }}>Cancel</Button>
                        </div>
                    </div>
                ) : (
                    <div className='space-y-4'>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
                            <div className='bg-mocha-600/50 rounded-lg p-4'>
                                <span className='text-mocha-200 text-xs uppercase tracking-wider'>Node Name</span>
                                <p className='text-cream-400 font-medium mt-1'>{node.name}</p>
                            </div>
                            <div className='bg-mocha-600/50 rounded-lg p-4'>
                                <span className='text-mocha-200 text-xs uppercase tracking-wider'>Location</span>
                                <p className='text-cream-400 font-medium mt-1'>Location #{node.locationId}</p>
                            </div>
                            <div className='bg-mocha-600/50 rounded-lg p-4'>
                                <span className='text-mocha-200 text-xs uppercase tracking-wider'>Public FQDN</span>
                                <p className='text-cream-400 font-medium mt-1'>
                                    <code className='text-sm'>{node.scheme}://{node.fqdn}</code>
                                </p>
                            </div>
                            <div className='bg-mocha-600/50 rounded-lg p-4'>
                                <span className='text-mocha-200 text-xs uppercase tracking-wider'>Status</span>
                                <p className='mt-1'>
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${
                                        node.maintenanceMode
                                            ? 'bg-yellow-900/50 text-yellow-400 border border-yellow-700/50'
                                            : 'bg-green-900/50 text-green-400 border border-green-700/50'
                                    }`}>
                                        {node.maintenanceMode ? 'Maintenance Mode' : 'Active'}
                                    </span>
                                </p>
                            </div>
                        </div>

                        {node.description && (
                            <div className='bg-mocha-600/30 rounded-lg p-4'>
                                <span className='text-mocha-200 text-xs uppercase tracking-wider'>Description</span>
                                <p className='text-cream-400 mt-2'>{node.description}</p>
                            </div>
                        )}

                        <div className='flex flex-wrap gap-4 pt-2'>
                            <div className='flex items-center gap-2'>
                                <span className='text-mocha-200 text-sm'>Public:</span>
                                <span className='text-cream-400 text-sm font-medium'>{node.public ? 'Yes' : 'No'}</span>
                            </div>
                            <div className='flex items-center gap-2'>
                                <span className='text-mocha-200 text-sm'>Behind Proxy:</span>
                                <span className='text-cream-400 text-sm font-medium'>{node.behindProxy ? 'Yes' : 'No'}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Resource Allocation Card */}
            <div className='bg-mocha-500 border border-mocha-400 rounded-xl p-6'>
                <h3 className='text-cream-400 font-semibold text-lg mb-4'>Resource Allocation</h3>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
                    <div className='bg-mocha-600/50 rounded-lg p-4'>
                        <span className='text-mocha-200 text-xs uppercase tracking-wider'>Memory</span>
                        <p className='text-cream-400 font-medium mt-1'>{node.memory} MB</p>
                        <p className='text-mocha-200 text-xs mt-1'>{node.memoryOverallocate}% overallocate allowed</p>
                    </div>
                    <div className='bg-mocha-600/50 rounded-lg p-4'>
                        <span className='text-mocha-200 text-xs uppercase tracking-wider'>Disk Space</span>
                        <p className='text-cream-400 font-medium mt-1'>{node.disk} MB</p>
                        <p className='text-mocha-200 text-xs mt-1'>{node.diskOverallocate}% overallocate allowed</p>
                    </div>
                </div>
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
    const [confirmDeleteAlloc, setConfirmDeleteAlloc] = useState<number | null>(null);

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

    const handleDelete = async () => {
        if (confirmDeleteAlloc === null) return;
        const allocId = confirmDeleteAlloc;
        setConfirmDeleteAlloc(null);
        try {
            await deleteAllocation(nodeId, allocId);
            await onRefresh();
        } catch (e: any) {
            alert(httpErrorToHuman(e));
        }
    };

    return (
        <div className='space-y-4'>
            {error ? <div className='text-red-400 text-sm'>Error: {httpErrorToHuman(error as any)}</div> : null}

            <div className='bg-mocha-500 border border-mocha-400 rounded-lg p-6'>
                <h3 className='text-cream-400 font-medium mb-4'>Add Allocation</h3>
                {addError && <div className='text-red-400 text-sm mb-3'>Error: {addError}</div>}
                <div className='grid grid-cols-3 gap-3 mb-3'>
                    <div>
                        <label className={labelClass}>IP Address *</label>
                        <input type='text' value={ip} onChange={(e) => setIp(e.target.value)} className={inputClass} placeholder='0.0.0.0' />
                    </div>
                    <div>
                        <label className={labelClass}>Port *</label>
                        <input type='number' value={port} onChange={(e) => setPort(Number(e.target.value))} className={inputClass} min={1} max={65535} />
                    </div>
                    <div>
                        <label className={labelClass}>Alias</label>
                        <input type='text' value={alias} onChange={(e) => setAlias(e.target.value)} className={inputClass} placeholder='Optional' />
                    </div>
                </div>
                <Button variant='default' onClick={handleAdd} disabled={adding || !ip || !port}>{adding ? 'Adding...' : 'Add Allocation'}</Button>
            </div>

            <div className='bg-mocha-500 border border-mocha-400 rounded-lg overflow-hidden'>
                <table className='w-full text-sm'>
                    <thead>
                        <tr className='border-b border-mocha-400'>
                            <th className='text-left px-4 py-3 text-mocha-200 font-medium'>IP</th>
                            <th className='text-left px-4 py-3 text-mocha-200 font-medium'>Port</th>
                            <th className='text-left px-4 py-3 text-mocha-200 font-medium'>Alias</th>
                            <th className='text-left px-4 py-3 text-mocha-200 font-medium'>Assigned Server</th>
                            <th className='text-right px-4 py-3 text-mocha-200 font-medium'>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={5} className='text-center py-8 text-mocha-200'>Loading...</td>
                            </tr>
                        ) : !allocations || allocations.length === 0 ? (
                            <tr>
                                <td colSpan={5} className='text-center py-8 text-mocha-200'>No allocations found.</td>
                            </tr>
                        ) : (
                            allocations.map((alloc) => (
                                <tr key={alloc.id} className='border-b border-mocha-400 last:border-0 hover:bg-mocha-400/20'>
                                    <td className='px-4 py-3 text-cream-400 font-mono'>{alloc.ip}</td>
                                    <td className='px-4 py-3 text-cream-400 font-mono'>{alloc.port}</td>
                                    <td className='px-4 py-3 text-mocha-100'>{alloc.alias || '-'}</td>
                                    <td className='px-4 py-3 text-mocha-100'>
                                        {alloc.serverId ? `#${alloc.serverId}` : 'Unassigned'}
                                    </td>
                                    <td className='px-4 py-3 text-right'>
                                        {!alloc.serverId && (
                                            <Button variant='attention' size='sm' onClick={() => setConfirmDeleteAlloc(alloc.id)} title='Delete allocation'><TrashBin fill='currentColor' className='w-4 h-4' /></Button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <Dialog.Confirm
                open={confirmDeleteAlloc !== null}
                onClose={() => setConfirmDeleteAlloc(null)}
                onConfirmed={handleDelete}
                title='Delete Allocation'
                confirm='Delete'
            >
                Are you sure you want to delete this allocation?
            </Dialog.Confirm>
        </div>
    );
};

const SettingsTab = ({
    node,
    onUpdate,
    onDelete,
    locations,
}: {
    node: AdminNode;
    onUpdate: () => Promise<unknown>;
    onDelete: () => void;
    locations: { id: number; short: string; long: string }[];
}) => {
    const [formInit, setFormInit] = useState(false);
    const [name, setName] = useState('');
    const [fqdn, setFqdn] = useState('');
    const [locationId, setLocationId] = useState(node.locationId);
    const [memory, setMemory] = useState(0);
    const [disk, setDisk] = useState(0);
    const [memoryOverallocate, setMemoryOverallocate] = useState(0);
    const [diskOverallocate, setDiskOverallocate] = useState(0);
    const [daemonBase, setDaemonBase] = useState('');
    const [daemonListen, setDaemonListen] = useState(0);
    const [daemonSftp, setDaemonSftp] = useState(0);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);

    if (!formInit) {
        setName(node.name);
        setFqdn(node.fqdn);
        setLocationId(node.locationId);
        setMemory(node.memory);
        setDisk(node.disk);
        setMemoryOverallocate(node.memoryOverallocate);
        setDiskOverallocate(node.diskOverallocate);
        setDaemonBase(node.daemonBase);
        setDaemonListen(node.daemonListen);
        setDaemonSftp(node.daemonSftp);
        setFormInit(true);
    }

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
                location_id: locationId,
            });
            await onUpdate();
            toast.success('Node settings saved successfully');
        } catch (e: any) {
            toast.error(httpErrorToHuman(e));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        setShowDeleteConfirm(false);
        setDeleting(true);
        try {
            await deleteNode(node.id);
            onDelete();
            toast.success('Node deleted successfully');
        } catch (e: any) {
            toast.error(httpErrorToHuman(e));
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className='space-y-6'>
            {/* Node Identity Card */}
            <div className='bg-mocha-500 border border-mocha-400 rounded-xl p-6'>
                <div className='flex items-center gap-3 mb-6'>
                    <div className='w-10 h-10 bg-mocha-400 rounded-lg flex items-center justify-center'>
                        <svg className='w-5 h-5 text-cream-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01' />
                        </svg>
                    </div>
                    <div>
                        <h3 className='text-cream-400 font-semibold text-lg'>Node Identity</h3>
                        <p className='text-mocha-200 text-sm'>Basic information and location</p>
                    </div>
                </div>

                <div className='space-y-4'>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <div>
                            <label className={labelClass}>Node Name *</label>
                            <input type='text' value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder='My Node' />
                        </div>
                        <div>
                            <label className={labelClass}>Location *</label>
                            <select value={locationId} onChange={(e) => setLocationId(Number(e.target.value))} className={inputClass}>
                                {locations.map((loc) => (
                                    <option key={loc.id} value={loc.id}>{loc.short} - {loc.long}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className={labelClass}>Public FQDN *</label>
                        <input type='text' value={fqdn} onChange={(e) => setFqdn(e.target.value)} className={inputClass} placeholder='node.example.com' />
                        <p className='text-mocha-200 text-xs mt-1.5'>The domain name that will be used to connect to this node</p>
                    </div>
                </div>
            </div>

            {/* Resource Limits Card */}
            <div className='bg-mocha-500 border border-mocha-400 rounded-xl p-6'>
                <div className='flex items-center gap-3 mb-6'>
                    <div className='w-10 h-10 bg-mocha-400 rounded-lg flex items-center justify-center'>
                        <svg className='w-5 h-5 text-cream-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z' />
                        </svg>
                    </div>
                    <div>
                        <h3 className='text-cream-400 font-semibold text-lg'>Resource Limits</h3>
                        <p className='text-mocha-200 text-sm'>Memory and disk allocation settings</p>
                    </div>
                </div>

                <div className='space-y-4'>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <div>
                            <label className={labelClass}>Memory (MB)</label>
                            <input type='number' value={memory} onChange={(e) => setMemory(Number(e.target.value))} className={inputClass} min={0} />
                            <p className='text-mocha-200 text-xs mt-1.5'>Total memory available for servers</p>
                        </div>
                        <div>
                            <label className={labelClass}>Disk Space (MB)</label>
                            <input type='number' value={disk} onChange={(e) => setDisk(Number(e.target.value))} className={inputClass} min={0} />
                            <p className='text-mocha-200 text-xs mt-1.5'>Total disk space available for servers</p>
                        </div>
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <div>
                            <label className={labelClass}>Memory Overallocate %</label>
                            <input type='number' value={memoryOverallocate} onChange={(e) => setMemoryOverallocate(Number(e.target.value))} className={inputClass} min={0} max={100} />
                            <p className='text-mocha-200 text-xs mt-1.5'>Percentage of memory that can be over-allocated (-1 to disable)</p>
                        </div>
                        <div>
                            <label className={labelClass}>Disk Overallocate %</label>
                            <input type='number' value={diskOverallocate} onChange={(e) => setDiskOverallocate(Number(e.target.value))} className={inputClass} min={0} max={100} />
                            <p className='text-mocha-200 text-xs mt-1.5'>Percentage of disk that can be over-allocated (-1 to disable)</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Daemon Configuration Card */}
            <div className='bg-mocha-500 border border-mocha-400 rounded-xl p-6'>
                <div className='flex items-center gap-3 mb-6'>
                    <div className='w-10 h-10 bg-mocha-400 rounded-lg flex items-center justify-center'>
                        <svg className='w-5 h-5 text-cream-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' />
                        </svg>
                    </div>
                    <div>
                        <h3 className='text-cream-400 font-semibold text-lg'>Daemon Configuration</h3>
                        <p className='text-mocha-200 text-sm'>Wings daemon connection settings</p>
                    </div>
                </div>

                <div className='space-y-4'>
                    <div>
                        <label className={labelClass}>Daemon Base Path</label>
                        <input type='text' value={daemonBase} onChange={(e) => setDaemonBase(e.target.value)} className={inputClass} placeholder='/srv/daemon' />
                        <p className='text-mocha-200 text-xs mt-1.5'>Base directory where daemon data is stored</p>
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <div>
                            <label className={labelClass}>Daemon Listen Port *</label>
                            <input type='number' value={daemonListen} onChange={(e) => setDaemonListen(Number(e.target.value))} className={inputClass} min={1} max={65535} />
                            <p className='text-mocha-200 text-xs mt-1.5'>Port for daemon API communication</p>
                        </div>
                        <div>
                            <label className={labelClass}>Daemon SFTP Port *</label>
                            <input type='number' value={daemonSftp} onChange={(e) => setDaemonSftp(Number(e.target.value))} className={inputClass} min={1} max={65535} />
                            <p className='text-mocha-200 text-xs mt-1.5'>Port for SFTP file management</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className='flex items-center gap-3'>
                <Button variant='default' onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
            </div>

            {/* Danger Zone */}
            <div className='bg-mocha-500 border-2 border-red-800/50 rounded-xl p-6'>
                <div className='flex items-center gap-3 mb-4'>
                    <div className='w-10 h-10 bg-red-900/50 rounded-lg flex items-center justify-center'>
                        <svg className='w-5 h-5 text-red-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' />
                        </svg>
                    </div>
                    <div>
                        <h3 className='text-red-400 font-semibold text-lg'>Danger Zone</h3>
                        <p className='text-mocha-200 text-sm'>Irreversible actions</p>
                    </div>
                </div>

                <p className='text-sm text-mocha-200 mb-4'>
                    Permanently delete this node and all associated data including allocations. This action cannot be undone.
                </p>
                <Button variant='attention' onClick={() => setShowDeleteConfirm(true)} disabled={deleting}>{deleting ? 'Deleting...' : 'Delete Node'}</Button>
            </div>

            <Dialog.Confirm
                open={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirmed={handleDelete}
                title='Delete Node'
                confirm='Delete'
            >
                Are you sure you want to permanently delete this node? This cannot be undone.
            </Dialog.Confirm>
        </div>
    );
};

const AdminNodesContainer = () => {
    const [page, setPage] = useState(1);
    const [showCreate, setShowCreate] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
    const { data, error, mutate } = useSWR(['admin:nodes', page], () => getNodes({ page }));

    const handleDelete = async () => {
        if (confirmDelete === null) return;
        const id = confirmDelete;
        setConfirmDelete(null);
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
                            <Button variant='default' onClick={() => setShowCreate(true)}>Create Node</Button>
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
                                                    <th className='text-left px-4 py-3 text-mocha-200 font-medium'>Name</th>
                                                    <th className='text-left px-4 py-3 text-mocha-200 font-medium'>FQDN</th>
                                                    <th className='text-left px-4 py-3 text-mocha-200 font-medium'>Location</th>
                                                    <th className='text-left px-4 py-3 text-mocha-200 font-medium'>Memory</th>
                                                    <th className='text-left px-4 py-3 text-mocha-200 font-medium'>Disk</th>
                                                    <th className='text-left px-4 py-3 text-mocha-200 font-medium'>Status</th>
                                                    <th className='text-right px-4 py-3 text-mocha-200 font-medium'>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {items.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={7} className='text-center py-8 text-mocha-200'>No nodes found.</td>
                                                    </tr>
                                                ) : (
                                                    items.map((node: AdminNode) => (
                                                        <tr key={node.id} className='border-b border-mocha-400 last:border-0 hover:bg-mocha-400/20'>
                                                            <td className='px-4 py-3'>
                                                                <Link to={String(node.id)} className='text-cream-400 font-medium hover:text-cream-200 cursor-pointer'>
                                                                    {node.name}
                                                                </Link>
                                                            </td>
                                                            <td className='px-4 py-3'>
                                                                <code className='text-cream-400 text-xs'>
                                                                    {node.scheme}://{node.fqdn}:{node.daemonListen}
                                                                </code>
                                                            </td>
                                                            <td className='px-4 py-3 text-mocha-100'>#{node.locationId}</td>
                                                            <td className='px-4 py-3 text-mocha-100'>{node.memory} MB</td>
                                                            <td className='px-4 py-3 text-mocha-100'>{node.disk} MB</td>
                                                            <td className='px-4 py-3'>
                                                                <span
                                                                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
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
                                                                    <Link to={String(node.id)} className='text-xs text-cream-400 hover:text-cream-500 cursor-pointer'>
                                                                        View
                                                                    </Link>
                                                                    <Button variant='attention' size='sm' onClick={() => setConfirmDelete(node.id)} title='Delete node'><TrashBin fill='currentColor' className='w-4 h-4' /></Button>
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

                        <CreateNodeModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={() => mutate()} />

                        <Dialog.Confirm
                            open={confirmDelete !== null}
                            onClose={() => setConfirmDelete(null)}
                            onConfirmed={handleDelete}
                            title='Delete Node'
                            confirm='Delete'
                        >
                            Are you sure you want to delete this node?
                        </Dialog.Confirm>
                    </div>
                }
            />
            <Route path=':id/*' element={<AdminNodeViewContainer />} />
        </Routes>
    );
};

export default AdminNodesContainer;
