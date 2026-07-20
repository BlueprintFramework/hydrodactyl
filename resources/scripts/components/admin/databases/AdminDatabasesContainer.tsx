import { useState } from 'react';
import { Link, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import useSWR from 'swr';
import { toast } from 'sonner';
import {
    type AdminDatabaseHost,
    type CreateDatabaseHostData,
    createDatabaseHost,
    deleteDatabaseHost,
    getDatabaseHost,
    getDatabaseHosts,
    updateDatabaseHost,
} from '@/api/admin/databaseHosts';
import { type AdminNode, getNodes } from '@/api/admin/nodes';
import { httpErrorToHuman } from '@/api/http';
import { Button } from '@/components/ui/button';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import Pagination from '@/components/elements/Pagination';
import Spinner from '@/components/elements/Spinner';

const inputClass =
    'w-full bg-mocha-600 border border-mocha-400 rounded px-3 py-2 text-sm text-cream-400 focus:outline-none focus:border-mocha-300 transition-colors';
const labelClass = 'block text-sm text-mocha-200 mb-1';

const AdminDatabaseHostView = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const hostId = Number(id);

    const {
        data: host,
        error: hostError,
        mutate: hostMutate,
    } = useSWR(['admin:db-host', hostId], () => getDatabaseHost(hostId));

    const [name, setName] = useState('');
    const [hostVal, setHostVal] = useState('');
    const [port, setPort] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [containerImage, setContainerImage] = useState('');
    const [initialized, setInitialized] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    if (host && !initialized) {
        setName(host.name);
        setHostVal(host.host);
        setPort(String(host.port));
        setUsername(host.username);
        setContainerImage(host.containerImage || '');
        setInitialized(true);
    }

    const handleSave = () => {
        setError(null);
        setSuccess(false);
        setSaving(true);

        const data: Partial<CreateDatabaseHostData> = {
            name,
            host: hostVal,
            port: Number(port),
            username,
            container_image: containerImage || undefined,
        };
        if (password) {
            data.password = password;
        }

        updateDatabaseHost(hostId, data)
            .then(() => {
                setSuccess(true);
                hostMutate();
                setTimeout(() => setSuccess(false), 3000);
                toast.success('Database host updated successfully');
            })
            .catch((e) => {
                setError(httpErrorToHuman(e));
                toast.error(httpErrorToHuman(e));
            })
            .finally(() => setSaving(false));
    };

    const handleDelete = () => {
        if (!confirm('Delete this database host? This action cannot be undone.')) return;
        setDeleting(true);
        deleteDatabaseHost(hostId)
            .then(() => {
                navigate('/admin/databases');
                toast.success('Database host deleted successfully');
            })
            .catch((e) => {
                setError(httpErrorToHuman(e));
                toast.error(httpErrorToHuman(e));
                setDeleting(false);
            });
    };

    return (
        <div>
            <MainPageHeader
                title={host?.name || 'Database Host'}
                headChildren={
                    <Link to='/admin/databases' className='text-sm text-mocha-200 hover:text-mocha-100 cursor-pointer'>
                        &larr; Back to Database Hosts
                    </Link>
                }
            >
                <Button variant='default' onClick={handleSave} disabled={saving || deleting}>
                    {saving ? 'Saving...' : 'Save'}
                </Button>
                <Button variant='attention' onClick={handleDelete} disabled={saving || deleting}>
                    {deleting ? 'Deleting...' : 'Delete'}
                </Button>
            </MainPageHeader>

            {(error || hostError) && (
                <div className='text-red-400 mb-4 text-sm'>{error || httpErrorToHuman(hostError)}</div>
            )}
            {success && <div className='text-green-400 mb-4 text-sm'>Database host updated.</div>}

            {!host ? (
                <Spinner />
            ) : (
                <div className='space-y-6'>
                    <div className='bg-mocha-500 border border-mocha-400 rounded-xl p-6'>
                        <div className='flex items-center gap-3 mb-6'>
                            <div className='w-10 h-10 bg-mocha-400 rounded-lg flex items-center justify-center'>
                                <svg className='w-5 h-5 text-cream-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4' />
                                </svg>
                            </div>
                            <div>
                                <h3 className='text-cream-400 font-semibold text-lg'>Container Configuration</h3>
                                <p className='text-mocha-200 text-sm'>Databases run exclusively in Docker/Podman containers</p>
                            </div>
                        </div>

                        <div className='space-y-4'>
                            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                <div>
                                    <label className={labelClass}>Host Name *</label>
                                    <input
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className={inputClass}
                                        placeholder='MySQL Primary'
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Container Image *</label>
                                    <input
                                        value={containerImage}
                                        onChange={(e) => setContainerImage(e.target.value)}
                                        className={inputClass}
                                        placeholder='mysql:8.0'
                                    />
                                    <p className='text-mocha-200 text-xs mt-1.5'>Docker image for the database container</p>
                                </div>
                            </div>

                            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                <div>
                                    <label className={labelClass}>Internal Host *</label>
                                    <input
                                        value={hostVal}
                                        onChange={(e) => setHostVal(e.target.value)}
                                        className={inputClass}
                                        placeholder='127.0.0.1'
                                    />
                                    <p className='text-mocha-200 text-xs mt-1.5'>Internal container IP or hostname</p>
                                </div>
                                <div>
                                    <label className={labelClass}>Port *</label>
                                    <input
                                        type='number'
                                        value={port}
                                        onChange={(e) => setPort(e.target.value)}
                                        className={inputClass}
                                        placeholder='3306'
                                    />
                                </div>
                            </div>

                            <div>
                                <label className={labelClass}>Username *</label>
                                <input
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className={inputClass}
                                    placeholder='root'
                                />
                            </div>

                            <div>
                                <label className={labelClass}>Password (leave empty to keep existing)</label>
                                <input
                                    type='password'
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder='••••••••'
                                    className={inputClass}
                                />
                            </div>
                        </div>
                    </div>

                    <div className='bg-mocha-500/50 border border-mocha-400/50 rounded-xl p-6'>
                        <div className='flex items-center gap-3 mb-4'>
                            <div className='w-10 h-10 bg-mocha-400/50 rounded-lg flex items-center justify-center'>
                                <svg className='w-5 h-5 text-mocha-200' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                                </svg>
                            </div>
                            <div>
                                <h3 className='text-mocha-200 font-semibold'>Host Information</h3>
                                <p className='text-mocha-300 text-xs'>Read-only system information</p>
                            </div>
                        </div>

                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                            <div className='bg-mocha-600/30 rounded-lg p-3'>
                                <span className='text-mocha-200 text-xs uppercase tracking-wider'>Host ID</span>
                                <p className='text-cream-400 font-mono text-sm mt-1'>#{host.id}</p>
                            </div>
                            <div className='bg-mocha-600/30 rounded-lg p-3'>
                                <span className='text-mocha-200 text-xs uppercase tracking-wider'>Node</span>
                                <p className='text-cream-400 text-sm mt-1'>#{host.node ?? 'None'}</p>
                            </div>
                            <div className='bg-mocha-600/30 rounded-lg p-3'>
                                <span className='text-mocha-200 text-xs uppercase tracking-wider'>Created</span>
                                <p className='text-cream-400 text-sm mt-1'>{new Date(host.createdAt).toLocaleDateString()}</p>
                            </div>
                            <div className='bg-mocha-600/30 rounded-lg p-3'>
                                <span className='text-mocha-200 text-xs uppercase tracking-wider'>Updated</span>
                                <p className='text-cream-400 text-sm mt-1'>{new Date(host.updatedAt).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const AdminDatabasesContainer = () => {
    const [page, setPage] = useState(1);
    const { data, error, mutate } = useSWR(['admin:database-hosts', page], () => getDatabaseHosts({ page }));

    const { data: nodesData } = useSWR(['admin:nodes', 1], () => getNodes({ page: 1 }));

    const [showCreate, setShowCreate] = useState(false);
    const [createName, setCreateName] = useState('');
    const [createHost, setCreateHost] = useState('');
    const [createPort, setCreatePort] = useState('3306');
    const [createUsername, setCreateUsername] = useState('');
    const [createPassword, setCreatePassword] = useState('');
    const [createContainerImage, setCreateContainerImage] = useState('');
    const [createNodeId, setCreateNodeId] = useState<string>('');
    const [saving, setSaving] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);

    const handleCreate = () => {
        setCreateError(null);
        setSaving(true);

        const payload: CreateDatabaseHostData = {
            name: createName,
            host: createHost,
            port: Number(createPort),
            username: createUsername,
            password: createPassword,
            container_image: createContainerImage || undefined,
        };
        if (createNodeId) {
            payload.node_id = Number(createNodeId);
        }

        createDatabaseHost(payload)
            .then(() => {
                setShowCreate(false);
                setCreateName('');
                setCreateHost('');
                setCreatePort('3306');
                setCreateUsername('');
                setCreatePassword('');
                setCreateContainerImage('');
                setCreateNodeId('');
                mutate();
                toast.success('Database host created successfully');
            })
            .catch((e) => {
                setCreateError(httpErrorToHuman(e));
                toast.error(httpErrorToHuman(e));
            })
            .finally(() => setSaving(false));
    };

    const handleDelete = (id: number, hostName: string) => {
        if (!confirm(`Delete database host "${hostName}"? This action cannot be undone.`)) return;
        deleteDatabaseHost(id)
            .then(() => {
                mutate();
                toast.success('Database host deleted successfully');
            })
            .catch((e) => toast.error(httpErrorToHuman(e)));
    };

    if (showCreate) {
        return (
            <div>
                <MainPageHeader title='Add Database Host'>
                    <Button variant='secondary' onClick={() => setShowCreate(false)}>Back</Button>
                </MainPageHeader>
                {createError && <div className='text-red-400 mb-4 text-sm'>{createError}</div>}
                <div className='bg-mocha-500 border border-mocha-400 rounded-lg p-6 max-w-2xl'>
                    <div className='bg-mocha-400/20 border border-mocha-400/50 rounded-lg p-4 mb-6'>
                        <div className='flex items-start gap-3'>
                            <svg className='w-5 h-5 text-mocha-200 mt-0.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                            </svg>
                            <div>
                                <p className='text-sm text-cream-400 font-medium'>Container-Based Databases</p>
                                <p className='text-xs text-mocha-200 mt-1'>All databases run exclusively inside Docker/Podman containers for isolation and security.</p>
                            </div>
                        </div>
                    </div>

                    <div className='space-y-4'>
                        <div>
                            <label className={labelClass}>Host Name *</label>
                            <input
                                value={createName}
                                onChange={(e) => setCreateName(e.target.value)}
                                className={inputClass}
                                placeholder='MySQL Primary'
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Container Image *</label>
                            <input
                                value={createContainerImage}
                                onChange={(e) => setCreateContainerImage(e.target.value)}
                                className={inputClass}
                                placeholder='mysql:8.0'
                            />
                            <p className='text-mocha-200 text-xs mt-1.5'>Docker image to use for this database (e.g., mysql:8.0, postgres:15, redis:7)</p>
                        </div>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                            <div>
                                <label className={labelClass}>Internal Host *</label>
                                <input
                                    value={createHost}
                                    onChange={(e) => setCreateHost(e.target.value)}
                                    className={inputClass}
                                    placeholder='127.0.0.1'
                                />
                                <p className='text-mocha-200 text-xs mt-1.5'>Internal container IP or hostname</p>
                            </div>
                            <div>
                                <label className={labelClass}>Port *</label>
                                <input
                                    type='number'
                                    value={createPort}
                                    onChange={(e) => setCreatePort(e.target.value)}
                                    className={inputClass}
                                    placeholder='3306'
                                />
                            </div>
                        </div>
                        <div>
                            <label className={labelClass}>Username *</label>
                            <input
                                value={createUsername}
                                onChange={(e) => setCreateUsername(e.target.value)}
                                className={inputClass}
                                placeholder='root'
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Password *</label>
                            <input
                                type='password'
                                value={createPassword}
                                onChange={(e) => setCreatePassword(e.target.value)}
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Node (Optional)</label>
                            <select
                                value={createNodeId}
                                onChange={(e) => setCreateNodeId(e.target.value)}
                                className={inputClass}
                            >
                                <option value=''>No Node</option>
                                {nodesData?.items?.map((node: AdminNode) => (
                                    <option key={node.id} value={String(node.id)}>
                                        {node.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <Button
                            variant='default'
                            onClick={handleCreate}
                            disabled={saving || !createName || !createHost || !createUsername || !createPassword || !createContainerImage}
                        >
                            {saving ? 'Creating...' : 'Add Database Host'}
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <Routes>
            <Route
                index
                element={
                    <div>
                        <MainPageHeader title='Database Hosts'>
                            <Button variant='default' onClick={() => setShowCreate(true)}>Add Database Host</Button>
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
                                                        Host
                                                    </th>
                                                    <th className='text-left px-4 py-3 text-mocha-200 font-medium'>
                                                        Port
                                                    </th>
                                                    <th className='text-left px-4 py-3 text-mocha-200 font-medium'>
                                                        Node
                                                    </th>
                                                    <th className='text-right px-4 py-3 text-mocha-200 font-medium'>
                                                        Actions
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {items.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={5} className='text-center py-8 text-mocha-200'>
                                                            No database hosts found.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    items.map((dbHost: AdminDatabaseHost) => (
                                                        <tr
                                                            key={dbHost.id}
                                                            className='border-b border-mocha-400 last:border-0 hover:bg-mocha-400/20'
                                                        >
                                                            <td className='px-4 py-3'>
                                                                <Link
                                                                    to={String(dbHost.id)}
                                                                    className='text-cream-400 font-medium hover:text-cream-200 cursor-pointer'
                                                                >
                                                                    {dbHost.name}
                                                                </Link>
                                                            </td>
                                                            <td className='px-4 py-3'>
                                                                <code className='text-cream-400 text-xs'>
                                                                    {dbHost.host}
                                                                </code>
                                                            </td>
                                                            <td className='px-4 py-3 text-mocha-100 cursor-default'>
                                                                {dbHost.port}
                                                            </td>
                                                            <td className='px-4 py-3 text-mocha-100 cursor-default'>
                                                                {dbHost.node !== null ? `#${dbHost.node}` : '—'}
                                                            </td>
                                                            <td className='px-4 py-3 text-right'>
                                                                <div className='flex items-center justify-end gap-2'>
                                                                    <Link
                                                                        to={String(dbHost.id)}
                                                                        className='text-xs text-cream-400 hover:text-cream-500 cursor-pointer'
                                                                    >
                                                                        View
                                                                    </Link>
                                                                    <Button
                                                                        variant='attention'
                                                                        onClick={() =>
                                                                            handleDelete(dbHost.id, dbHost.name)
                                                                        }
                                                                    >
                                                                        Delete
                                                                    </Button>
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
            <Route path=':id/*' element={<AdminDatabaseHostView />} />
        </Routes>
    );
};

export default AdminDatabasesContainer;
