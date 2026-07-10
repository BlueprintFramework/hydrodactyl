import { useState } from 'react';
import { Link, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import useSWR from 'swr';
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
import ButtonV2 from '@/components/elements/ButtonV2';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import Pagination from '@/components/elements/Pagination';
import Spinner from '@/components/elements/Spinner';

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
        };
        if (password) {
            data.password = password;
        }

        updateDatabaseHost(hostId, data)
            .then(() => {
                setSuccess(true);
                hostMutate();
                setTimeout(() => setSuccess(false), 3000);
            })
            .catch((e) => setError(httpErrorToHuman(e)))
            .finally(() => setSaving(false));
    };

    const handleDelete = () => {
        if (!confirm('Delete this database host? This action cannot be undone.')) return;
        setDeleting(true);
        deleteDatabaseHost(hostId)
            .then(() => navigate('/admin/databases'))
            .catch((e) => {
                setError(httpErrorToHuman(e));
                setDeleting(false);
            });
    };

    return (
        <div>
            <MainPageHeader
                title={host?.name || 'Database Host'}
                headChildren={
                    <Link to='/admin/databases' className='text-sm text-gray-500 hover:text-gray-300 cursor-pointer'>
                        &larr; Back to Database Hosts
                    </Link>
                }
            >
                <ButtonV2 onClick={handleSave} disabled={saving || deleting}>
                    {saving ? 'Saving...' : 'Save'}
                </ButtonV2>
                <ButtonV2 onClick={handleDelete} disabled={saving || deleting} className='!text-red-400 cursor-pointer'>
                    {deleting ? 'Deleting...' : 'Delete'}
                </ButtonV2>
            </MainPageHeader>

            {(error || hostError) && (
                <div className='text-red-400 mb-4 text-sm'>{error || httpErrorToHuman(hostError)}</div>
            )}
            {success && <div className='text-green-400 mb-4 text-sm'>Database host updated.</div>}

            {!host ? (
                <Spinner />
            ) : (
                <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                    <div className='bg-[#1a1a1a] border border-gray-800 rounded-lg p-6'>
                        <h4 className='text-gray-200 font-medium mb-4'>Connection Details</h4>
                        <div className='mb-4'>
                            <label className='block text-sm text-gray-400 mb-1'>Name</label>
                            <input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className='w-full bg-transparent border border-gray-700 rounded px-3 py-2 text-gray-200'
                            />
                        </div>
                        <div className='mb-4'>
                            <label className='block text-sm text-gray-400 mb-1'>Host</label>
                            <input
                                value={hostVal}
                                onChange={(e) => setHostVal(e.target.value)}
                                className='w-full bg-transparent border border-gray-700 rounded px-3 py-2 text-gray-200'
                            />
                        </div>
                        <div className='mb-4'>
                            <label className='block text-sm text-gray-400 mb-1'>Port</label>
                            <input
                                type='number'
                                value={port}
                                onChange={(e) => setPort(e.target.value)}
                                className='w-full bg-transparent border border-gray-700 rounded px-3 py-2 text-gray-200'
                            />
                        </div>
                        <div className='mb-4'>
                            <label className='block text-sm text-gray-400 mb-1'>Username</label>
                            <input
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className='w-full bg-transparent border border-gray-700 rounded px-3 py-2 text-gray-200'
                            />
                        </div>
                        <div className='mb-4'>
                            <label className='block text-sm text-gray-400 mb-1'>
                                Password (leave empty to keep existing)
                            </label>
                            <input
                                type='password'
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder='••••••••'
                                className='w-full bg-transparent border border-gray-700 rounded px-3 py-2 text-gray-200'
                            />
                        </div>
                    </div>
                    <div className='bg-[#1a1a1a] border border-gray-800 rounded-lg p-6'>
                        <h4 className='text-gray-200 font-medium mb-4'>Info</h4>
                        <div className='space-y-2 text-sm'>
                            <div className='flex justify-between'>
                                <span className='text-gray-500'>ID</span>
                                <span className='text-gray-300'>{host.id}</span>
                            </div>
                            <div className='flex justify-between'>
                                <span className='text-gray-500'>Node</span>
                                <span className='text-gray-300'>#{host.node ?? 'None'}</span>
                            </div>
                            <div className='flex justify-between'>
                                <span className='text-gray-500'>Created</span>
                                <span className='text-gray-300'>{new Date(host.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className='flex justify-between'>
                                <span className='text-gray-500'>Updated</span>
                                <span className='text-gray-300'>{new Date(host.updatedAt).toLocaleDateString()}</span>
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
                setCreateNodeId('');
                mutate();
            })
            .catch((e) => setCreateError(httpErrorToHuman(e)))
            .finally(() => setSaving(false));
    };

    const handleDelete = (id: number, hostName: string) => {
        if (!confirm(`Delete database host "${hostName}"? This action cannot be undone.`)) return;
        deleteDatabaseHost(id)
            .then(() => mutate())
            .catch((e) => alert(httpErrorToHuman(e)));
    };

    if (showCreate) {
        return (
            <div>
                <MainPageHeader title='Add Database Host'>
                    <ButtonV2 onClick={() => setShowCreate(false)}>Back</ButtonV2>
                </MainPageHeader>
                {createError && <div className='text-red-400 mb-4 text-sm'>{createError}</div>}
                <div className='bg-[#1a1a1a] border border-gray-800 rounded-lg p-6 max-w-lg'>
                    <div className='mb-4'>
                        <label className='block text-sm text-gray-400 mb-1'>Name</label>
                        <input
                            value={createName}
                            onChange={(e) => setCreateName(e.target.value)}
                            className='w-full bg-transparent border border-gray-700 rounded px-3 py-2 text-gray-200'
                        />
                    </div>
                    <div className='mb-4'>
                        <label className='block text-sm text-gray-400 mb-1'>Host</label>
                        <input
                            value={createHost}
                            onChange={(e) => setCreateHost(e.target.value)}
                            placeholder='127.0.0.1'
                            className='w-full bg-transparent border border-gray-700 rounded px-3 py-2 text-gray-200'
                        />
                    </div>
                    <div className='mb-4'>
                        <label className='block text-sm text-gray-400 mb-1'>Port</label>
                        <input
                            type='number'
                            value={createPort}
                            onChange={(e) => setCreatePort(e.target.value)}
                            className='w-full bg-transparent border border-gray-700 rounded px-3 py-2 text-gray-200'
                        />
                    </div>
                    <div className='mb-4'>
                        <label className='block text-sm text-gray-400 mb-1'>Username</label>
                        <input
                            value={createUsername}
                            onChange={(e) => setCreateUsername(e.target.value)}
                            className='w-full bg-transparent border border-gray-700 rounded px-3 py-2 text-gray-200'
                        />
                    </div>
                    <div className='mb-4'>
                        <label className='block text-sm text-gray-400 mb-1'>Password</label>
                        <input
                            type='password'
                            value={createPassword}
                            onChange={(e) => setCreatePassword(e.target.value)}
                            className='w-full bg-transparent border border-gray-700 rounded px-3 py-2 text-gray-200'
                        />
                    </div>
                    <div className='mb-4'>
                        <label className='block text-sm text-gray-400 mb-1'>Node</label>
                        <select
                            value={createNodeId}
                            onChange={(e) => setCreateNodeId(e.target.value)}
                            className='w-full bg-transparent border border-gray-700 rounded px-3 py-2 text-gray-200'
                        >
                            <option value=''>No Node</option>
                            {nodesData?.items?.map((node: AdminNode) => (
                                <option key={node.id} value={String(node.id)}>
                                    {node.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <ButtonV2
                        onClick={handleCreate}
                        disabled={saving || !createName || !createHost || !createUsername || !createPassword}
                    >
                        {saving ? 'Creating...' : 'Add Database Host'}
                    </ButtonV2>
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
                            <ButtonV2 onClick={() => setShowCreate(true)}>Add Database Host</ButtonV2>
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
                                                        Host
                                                    </th>
                                                    <th className='text-left px-4 py-3 text-gray-500 font-medium'>
                                                        Port
                                                    </th>
                                                    <th className='text-left px-4 py-3 text-gray-500 font-medium'>
                                                        Node
                                                    </th>
                                                    <th className='text-right px-4 py-3 text-gray-500 font-medium'>
                                                        Actions
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {items.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={5} className='text-center py-8 text-gray-500'>
                                                            No database hosts found.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    items.map((dbHost: AdminDatabaseHost) => (
                                                        <tr
                                                            key={dbHost.id}
                                                            className='border-b border-gray-800 last:border-0 hover:bg-white/[0.02]'
                                                        >
                                                            <td className='px-4 py-3'>
                                                                <Link
                                                                    to={String(dbHost.id)}
                                                                    className='text-gray-200 font-medium hover:text-gray-100 cursor-pointer'
                                                                >
                                                                    {dbHost.name}
                                                                </Link>
                                                            </td>
                                                            <td className='px-4 py-3'>
                                                                <code className='text-blue-400 text-xs'>
                                                                    {dbHost.host}
                                                                </code>
                                                            </td>
                                                            <td className='px-4 py-3 text-gray-300 cursor-default'>
                                                                {dbHost.port}
                                                            </td>
                                                            <td className='px-4 py-3 text-gray-300 cursor-default'>
                                                                {dbHost.node !== null ? `#${dbHost.node}` : '—'}
                                                            </td>
                                                            <td className='px-4 py-3 text-right'>
                                                                <div className='flex items-center justify-end gap-2'>
                                                                    <Link
                                                                        to={String(dbHost.id)}
                                                                        className='text-xs text-blue-400 hover:text-blue-300 cursor-pointer'
                                                                    >
                                                                        View
                                                                    </Link>
                                                                    <button
                                                                        onClick={() =>
                                                                            handleDelete(dbHost.id, dbHost.name)
                                                                        }
                                                                        className='text-xs text-red-400 hover:text-red-300 cursor-pointer p-1'
                                                                        title='Delete database host'
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
            <Route path=':id/*' element={<AdminDatabaseHostView />} />
        </Routes>
    );
};

export default AdminDatabasesContainer;
