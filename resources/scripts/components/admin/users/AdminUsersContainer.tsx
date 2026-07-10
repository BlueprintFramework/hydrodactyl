import { useEffect, useState } from 'react';
import { Link, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import useSWR from 'swr';
import { type AdminUser, createUser, deleteUser, getUser, getUsers, updateUser } from '@/api/admin/users';
import { httpErrorToHuman } from '@/api/http';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import Pagination from '@/components/elements/Pagination';
import Spinner from '@/components/elements/Spinner';

const AdminUserList = () => {
    const [page, setPage] = useState(1);
    const { data, error, mutate } = useSWR(['admin:users', page], () => getUsers({ page }));

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this user? This cannot be undone.')) return;
        try {
            await deleteUser(id);
            mutate();
        } catch (e: any) {
            alert(httpErrorToHuman(e));
        }
    };

    return (
        <div>
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
                                        <th className='text-left px-4 py-3 text-gray-500 font-medium'>ID</th>
                                        <th className='text-left px-4 py-3 text-gray-500 font-medium'>Username</th>
                                        <th className='text-left px-4 py-3 text-gray-500 font-medium'>Email</th>
                                        <th className='text-left px-4 py-3 text-gray-500 font-medium'>Name</th>
                                        <th className='text-left px-4 py-3 text-gray-500 font-medium'>Admin</th>
                                        <th className='text-left px-4 py-3 text-gray-500 font-medium'>2FA</th>
                                        <th className='text-right px-4 py-3 text-gray-500 font-medium'>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className='text-center py-8 text-gray-500'>
                                                No users found.
                                            </td>
                                        </tr>
                                    ) : (
                                        items.map((user: AdminUser) => (
                                            <tr
                                                key={user.id}
                                                className='border-b border-gray-800 last:border-0 hover:bg-white/[0.02]'
                                            >
                                                <td className='px-4 py-3 text-gray-400'>{user.id}</td>
                                                <td className='px-4 py-3'>
                                                    <Link
                                                        to={`view/${user.id}`}
                                                        className='text-blue-400 hover:text-blue-300 font-medium'
                                                    >
                                                        {user.username}
                                                    </Link>
                                                </td>
                                                <td className='px-4 py-3 text-gray-300'>{user.email}</td>
                                                <td className='px-4 py-3 text-gray-300'>
                                                    {user.nameFirst} {user.nameLast}
                                                </td>
                                                <td className='px-4 py-3'>
                                                    {user.rootAdmin ? (
                                                        <span className='inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-900/50 text-red-400'>
                                                            Admin
                                                        </span>
                                                    ) : (
                                                        <span className='text-gray-600'>No</span>
                                                    )}
                                                </td>
                                                <td className='px-4 py-3'>
                                                    {user.useTotp ? (
                                                        <span className='text-green-400 text-xs'>Enabled</span>
                                                    ) : (
                                                        <span className='text-gray-600 text-xs'>Disabled</span>
                                                    )}
                                                </td>
                                                <td className='px-4 py-3 text-right'>
                                                    <div className='flex items-center justify-end gap-2'>
                                                        <Link
                                                            to={`view/${user.id}`}
                                                            className='text-xs text-blue-400 hover:text-blue-300'
                                                        >
                                                            View
                                                        </Link>
                                                        <button
                                                            onClick={() => handleDelete(user.id)}
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
    );
};

const AdminUserCreate = () => {
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [form, setForm] = useState({
        username: '',
        email: '',
        name_first: '',
        name_last: '',
        password: '',
        language: '',
        root_admin: false,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        try {
            await createUser(form);
            setSuccess('User created successfully.');
            setTimeout(() => navigate('..'), 1000);
        } catch (e: any) {
            setError(httpErrorToHuman(e));
        }
    };

    return (
        <div className='max-w-2xl'>
            <h2 className='text-lg font-semibold text-gray-200 mb-4'>Create New User</h2>

            {error && <div className='text-red-400 mb-4 p-3 bg-red-900/20 border border-red-800 rounded'>{error}</div>}
            {success && (
                <div className='text-green-400 mb-4 p-3 bg-green-900/20 border border-green-800 rounded'>{success}</div>
            )}

            <form onSubmit={handleSubmit} className='bg-[#1a1a1a] border border-gray-800 rounded-lg p-6 space-y-4'>
                <div>
                    <label className='block text-sm text-gray-400 mb-1'>Username</label>
                    <input
                        type='text'
                        value={form.username}
                        onChange={(e) => setForm({ ...form, username: e.target.value })}
                        required
                        className='w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-gray-200 text-sm focus:outline-none focus:border-blue-600'
                    />
                </div>
                <div>
                    <label className='block text-sm text-gray-400 mb-1'>Email</label>
                    <input
                        type='email'
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        required
                        className='w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-gray-200 text-sm focus:outline-none focus:border-blue-600'
                    />
                </div>
                <div className='grid grid-cols-2 gap-4'>
                    <div>
                        <label className='block text-sm text-gray-400 mb-1'>First Name</label>
                        <input
                            type='text'
                            value={form.name_first}
                            onChange={(e) => setForm({ ...form, name_first: e.target.value })}
                            className='w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-gray-200 text-sm focus:outline-none focus:border-blue-600'
                        />
                    </div>
                    <div>
                        <label className='block text-sm text-gray-400 mb-1'>Last Name</label>
                        <input
                            type='text'
                            value={form.name_last}
                            onChange={(e) => setForm({ ...form, name_last: e.target.value })}
                            className='w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-gray-200 text-sm focus:outline-none focus:border-blue-600'
                        />
                    </div>
                </div>
                <div>
                    <label className='block text-sm text-gray-400 mb-1'>Password</label>
                    <input
                        type='password'
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        className='w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-gray-200 text-sm focus:outline-none focus:border-blue-600'
                    />
                </div>
                <div>
                    <label className='block text-sm text-gray-400 mb-1'>Language</label>
                    <input
                        type='text'
                        value={form.language}
                        onChange={(e) => setForm({ ...form, language: e.target.value })}
                        placeholder='en'
                        className='w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-gray-200 text-sm focus:outline-none focus:border-blue-600'
                    />
                </div>
                <div className='flex items-center gap-2'>
                    <input
                        type='checkbox'
                        id='root_admin'
                        checked={form.root_admin}
                        onChange={(e) => setForm({ ...form, root_admin: e.target.checked })}
                        className='rounded border-gray-800 bg-gray-900 text-blue-600 focus:ring-blue-600'
                    />
                    <label htmlFor='root_admin' className='text-sm text-gray-400'>
                        Root Admin
                    </label>
                </div>
                <div className='flex items-center gap-3 pt-2'>
                    <button
                        type='submit'
                        className='px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded transition-colors'
                    >
                        Create User
                    </button>
                    <Link
                        to='..'
                        className='px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded transition-colors'
                    >
                        Cancel
                    </Link>
                </div>
            </form>
        </div>
    );
};

const AdminUserView = () => {
    const { id: rawId } = useParams();
    const navigate = useNavigate();
    const id = Number(rawId);
    const { data: user, error, mutate } = useSWR(id ? ['admin:user', id] : null, () => getUser(id));

    const [error2, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [formInited, setFormInited] = useState(false);
    const [form, setForm] = useState({
        name_first: '',
        name_last: '',
        email: '',
        language: '',
        root_admin: false,
    });

    useEffect(() => {
        if (user && !formInited) {
            setForm({
                name_first: user.nameFirst,
                name_last: user.nameLast,
                email: user.email,
                language: user.language,
                root_admin: user.rootAdmin,
            });
            setFormInited(true);
        }
    }, [user, formInited]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        try {
            await updateUser(id, form);
            setSuccess('User updated successfully.');
            mutate();
        } catch (e: any) {
            setError(httpErrorToHuman(e));
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this user? This cannot be undone.')) return;
        try {
            await deleteUser(id);
            navigate('..');
        } catch (e: any) {
            setError(httpErrorToHuman(e));
        }
    };

    if (error) return <div className='text-red-400'>Error: {httpErrorToHuman(error)}</div>;
    if (!user) return <Spinner />;

    return (
        <div className='max-w-2xl space-y-6'>
            <h2 className='text-lg font-semibold text-gray-200'>Edit User: {user.username}</h2>

            {error2 && <div className='text-red-400 p-3 bg-red-900/20 border border-red-800 rounded'>{error2}</div>}
            {success && (
                <div className='text-green-400 p-3 bg-green-900/20 border border-green-800 rounded'>{success}</div>
            )}

            <form onSubmit={handleSave} className='bg-[#1a1a1a] border border-gray-800 rounded-lg p-6 space-y-4'>
                <div>
                    <label className='block text-sm text-gray-400 mb-1'>First Name</label>
                    <input
                        type='text'
                        value={form.name_first}
                        onChange={(e) => setForm({ ...form, name_first: e.target.value })}
                        className='w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-gray-200 text-sm focus:outline-none focus:border-blue-600'
                    />
                </div>
                <div>
                    <label className='block text-sm text-gray-400 mb-1'>Last Name</label>
                    <input
                        type='text'
                        value={form.name_last}
                        onChange={(e) => setForm({ ...form, name_last: e.target.value })}
                        className='w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-gray-200 text-sm focus:outline-none focus:border-blue-600'
                    />
                </div>
                <div>
                    <label className='block text-sm text-gray-400 mb-1'>Email</label>
                    <input
                        type='email'
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className='w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-gray-200 text-sm focus:outline-none focus:border-blue-600'
                    />
                </div>
                <div>
                    <label className='block text-sm text-gray-400 mb-1'>Language</label>
                    <input
                        type='text'
                        value={form.language}
                        onChange={(e) => setForm({ ...form, language: e.target.value })}
                        className='w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-gray-200 text-sm focus:outline-none focus:border-blue-600'
                    />
                </div>
                <div className='flex items-center gap-2'>
                    <input
                        type='checkbox'
                        id='edit_root_admin'
                        checked={form.root_admin}
                        onChange={(e) => setForm({ ...form, root_admin: e.target.checked })}
                        className='rounded border-gray-800 bg-gray-900 text-blue-600 focus:ring-blue-600'
                    />
                    <label htmlFor='edit_root_admin' className='text-sm text-gray-400'>
                        Root Admin
                    </label>
                </div>

                <div className='bg-gray-900/50 border border-gray-800 rounded p-4'>
                    <span className='text-sm text-gray-400'>Servers: </span>
                    <span className='text-sm text-gray-200 font-medium'>{user.serversCount}</span>
                </div>

                <div className='flex items-center gap-3 pt-2'>
                    <button
                        type='submit'
                        className='px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded transition-colors'
                    >
                        Save Changes
                    </button>
                    <Link
                        to='..'
                        className='px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded transition-colors'
                    >
                        Back to List
                    </Link>
                </div>
            </form>

            <div className='bg-[#1a1a1a] border border-red-900/50 rounded-lg p-6'>
                <h3 className='text-sm font-semibold text-red-400 mb-2'>Danger Zone</h3>
                <p className='text-sm text-gray-500 mb-3'>
                    Permanently delete this user. This action cannot be undone.
                </p>
                <button
                    onClick={handleDelete}
                    className='px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm rounded transition-colors'
                >
                    Delete User
                </button>
            </div>
        </div>
    );
};

const AdminUsersContainer = () => {
    return (
        <div>
            <MainPageHeader title='Users'>
                <Link
                    to='new'
                    className='px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded transition-colors'
                >
                    Create User
                </Link>
            </MainPageHeader>

            <Routes>
                <Route index element={<AdminUserList />} />
                <Route path='new' element={<AdminUserCreate />} />
                <Route path='view/:id/*' element={<AdminUserView />} />
            </Routes>
        </div>
    );
};

export default AdminUsersContainer;
