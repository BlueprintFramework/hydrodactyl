import { useEffect, useState } from 'react';
import { Link, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import useSWR, { mutate } from 'swr';
import { type AdminUser, createUser, deleteUser, getUser, getUsers, updateUser } from '@/api/admin/users';
import { httpErrorToHuman } from '@/api/http';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/elements/dialog';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import Pagination from '@/components/elements/Pagination';
import Spinner from '@/components/elements/Spinner';

const inputClass =
    'w-full bg-mocha-600 border border-mocha-400 rounded px-3 py-2 text-sm text-cream-400 focus:outline-none focus:border-mocha-300 transition-colors';
const labelClass = 'block text-sm text-mocha-200 mb-1';

const AdminUserList = () => {
    const [page, setPage] = useState(1);
    const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
    const { data, error, mutate } = useSWR(['admin:users', page], () => getUsers({ page }));

    const handleDelete = async () => {
        if (confirmDelete === null) return;
        const id = confirmDelete;
        setConfirmDelete(null);
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
                        <div className='bg-mocha-500 border border-mocha-400 rounded-lg overflow-hidden'>
                            <table className='w-full text-sm'>
                                <thead>
                                    <tr className='border-b border-mocha-400'>
                                        <th className='text-left px-4 py-3 text-mocha-200 font-medium'>ID</th>
                                        <th className='text-left px-4 py-3 text-mocha-200 font-medium'>Username</th>
                                        <th className='text-left px-4 py-3 text-mocha-200 font-medium'>Email</th>
                                        <th className='text-left px-4 py-3 text-mocha-200 font-medium'>Name</th>
                                        <th className='text-left px-4 py-3 text-mocha-200 font-medium'>Admin</th>
                                        <th className='text-left px-4 py-3 text-mocha-200 font-medium'>2FA</th>
                                        <th className='text-right px-4 py-3 text-mocha-200 font-medium'>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className='text-center py-8 text-mocha-200'>
                                                No users found.
                                            </td>
                                        </tr>
                                    ) : (
                                        items.map((user: AdminUser) => (
                                            <tr
                                                key={user.id}
                                                className='border-b border-mocha-400 last:border-0 hover:bg-mocha-400/20'
                                            >
                                                <td className='px-4 py-3 text-mocha-200'>{user.id}</td>
                                                <td className='px-4 py-3'>
                                                    <Link
                                                        to={`view/${user.id}`}
                                                        className='text-cream-400 hover:text-cream-500 font-medium'
                                                    >
                                                        {user.username}
                                                    </Link>
                                                </td>
                                                <td className='px-4 py-3 text-mocha-100'>{user.email}</td>
                                                <td className='px-4 py-3 text-mocha-100'>
                                                    {user.nameFirst} {user.nameLast}
                                                </td>
                                                <td className='px-4 py-3'>
                                                    {user.rootAdmin ? (
                                                        <span className='inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-900/50 text-red-400'>
                                                            Admin
                                                        </span>
                                                    ) : (
                                                        <span className='text-mocha-200/60'>No</span>
                                                    )}
                                                </td>
                                                <td className='px-4 py-3'>
                                                    {user.useTotp ? (
                                                        <span className='text-green-400 text-xs'>Enabled</span>
                                                    ) : (
                                                        <span className='text-mocha-200/60 text-xs'>Disabled</span>
                                                    )}
                                                </td>
                                                <td className='px-4 py-3 text-right'>
                                                    <div className='flex items-center justify-end gap-2'>
                                                        <Link
                                                            to={`view/${user.id}`}
                                                            className='text-xs text-cream-400 hover:text-cream-500'
                                                        >
                                                            View
                                                        </Link>
                                                        <Button
                                                            variant='attention'
                                                            onClick={() => setConfirmDelete(user.id)}
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

            <Dialog.Confirm
                open={confirmDelete !== null}
                onClose={() => setConfirmDelete(null)}
                onConfirmed={handleDelete}
                title='Delete User'
                confirm='Delete'
            >
                Are you sure you want to delete this user? This cannot be undone.
            </Dialog.Confirm>
        </div>
    );
};

const CreateUserModal = ({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) => {
    const [error, setError] = useState('');
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
        try {
            await createUser(form);
            onCreated();
            setForm({ username: '', email: '', name_first: '', name_last: '', password: '', language: '', root_admin: false });
            onClose();
        } catch (e: any) {
            setError(httpErrorToHuman(e));
        }
    };

    return (
        <Dialog open={open} onClose={onClose} title='Create User'>
            {error && <div className='text-red-400 mb-4 text-sm'>Error: {error}</div>}
            <form onSubmit={handleSubmit} className='space-y-4'>
                <div>
                    <label className={labelClass}>Username *</label>
                    <input
                        type='text'
                        value={form.username}
                        onChange={(e) => setForm({ ...form, username: e.target.value })}
                        required
                        className={inputClass}
                    />
                </div>
                <div>
                    <label className={labelClass}>Email *</label>
                    <input
                        type='email'
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        required
                        className={inputClass}
                    />
                </div>
                <div className='grid grid-cols-2 gap-4'>
                    <div>
                        <label className={labelClass}>First Name</label>
                        <input
                            type='text'
                            value={form.name_first}
                            onChange={(e) => setForm({ ...form, name_first: e.target.value })}
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label className={labelClass}>Last Name</label>
                        <input
                            type='text'
                            value={form.name_last}
                            onChange={(e) => setForm({ ...form, name_last: e.target.value })}
                            className={inputClass}
                        />
                    </div>
                </div>
                <div>
                    <label className={labelClass}>Password</label>
                    <input
                        type='password'
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        className={inputClass}
                    />
                </div>
                <div>
                    <label className={labelClass}>Language</label>
                    <input
                        type='text'
                        value={form.language}
                        onChange={(e) => setForm({ ...form, language: e.target.value })}
                        placeholder='en'
                        className={inputClass}
                    />
                </div>
                <div className='flex items-center gap-2'>
                    <input
                        type='checkbox'
                        id='modal_root_admin'
                        checked={form.root_admin}
                        onChange={(e) => setForm({ ...form, root_admin: e.target.checked })}
                        className='rounded border-mocha-400 bg-mocha-600 text-brand focus:ring-mocha-300'
                    />
                    <label htmlFor='modal_root_admin' className='text-sm text-mocha-200'>
                        Root Admin
                    </label>
                </div>
            </form>
            <Dialog.Footer>
                <div className='flex items-center gap-3 p-6'>
                    <Button variant='default' onClick={handleSubmit}>
                        Create User
                    </Button>
                    <Button variant='secondary' onClick={onClose}>
                        Cancel
                    </Button>
                </div>
            </Dialog.Footer>
        </Dialog>
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
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [saving, setSaving] = useState(false);
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
        setSaving(true);
        try {
            await updateUser(id, form);
            setSuccess('User updated successfully.');
            mutate();
            setTimeout(() => setSuccess(''), 3000);
        } catch (e: any) {
            setError(httpErrorToHuman(e));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        setShowDeleteConfirm(false);
        try {
            await deleteUser(id);
            navigate('..');
        } catch (e: any) {
            setError(httpErrorToHuman(e));
        }
    };

    if (error) return <div className='text-red-400'>Error: {httpErrorToHuman(error)}</div>;
    if (!user) return <Spinner />;

    const tabs = ['details', 'manage'] as const;
    const [activeTab, setActiveTab] = useState<'details' | 'manage'>('details');

    return (
        <div>
            <MainPageHeader title={user.username}>
                <Link to='..' className='text-sm text-mocha-100 hover:text-cream-400 transition-colors'>
                    Back to Users
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
                            <h3 className='text-cream-400 font-medium mb-4'>User Information</h3>
                            <div className='grid grid-cols-2 md:grid-cols-3 gap-4 text-sm'>
                                <div>
                                    <span className='text-mocha-200'>User ID</span>
                                    <p className='text-cream-400'>{user.id}</p>
                                </div>
                                <div>
                                    <span className='text-mocha-200'>Username</span>
                                    <p className='text-cream-400'>{user.username}</p>
                                </div>
                                <div>
                                    <span className='text-mocha-200'>Email</span>
                                    <p className='text-cream-400'>{user.email}</p>
                                </div>
                                <div>
                                    <span className='text-mocha-200'>Full Name</span>
                                    <p className='text-cream-400'>
                                        {user.nameFirst} {user.nameLast}
                                    </p>
                                </div>
                                <div>
                                    <span className='text-mocha-200'>Language</span>
                                    <p className='text-cream-400'>{user.language || 'Default'}</p>
                                </div>
                                <div>
                                    <span className='text-mocha-200'>Admin</span>
                                    <p className='text-cream-400'>
                                        {user.rootAdmin ? (
                                            <span className='inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-900/50 text-red-400'>
                                                Root Admin
                                            </span>
                                        ) : (
                                            <span className='text-mocha-200/60'>No</span>
                                        )}
                                    </p>
                                </div>
                                <div>
                                    <span className='text-mocha-200'>2FA</span>
                                    <p className='text-cream-400'>
                                        {user.useTotp ? (
                                            <span className='text-green-400 text-xs'>Enabled</span>
                                        ) : (
                                            <span className='text-mocha-200/60 text-xs'>Disabled</span>
                                        )}
                                    </p>
                                </div>
                                <div>
                                    <span className='text-mocha-200'>Servers</span>
                                    <p className='text-cream-400 font-medium'>{user.serversCount}</p>
                                </div>
                            </div>
                        </div>

                        <div className='bg-mocha-500 border border-mocha-400 rounded-lg p-6'>
                            <h3 className='text-cream-400 font-medium mb-4'>Edit User</h3>
                            {error2 && <div className='text-red-400 text-sm mb-3'>Error: {error2}</div>}
                            {success && <div className='text-green-400 text-sm mb-3'>User updated successfully.</div>}

                            <form onSubmit={handleSave} className='space-y-4'>
                                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                    <div>
                                        <label className={labelClass}>First Name</label>
                                        <input
                                            type='text'
                                            value={form.name_first}
                                            onChange={(e) => setForm({ ...form, name_first: e.target.value })}
                                            className={inputClass}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Last Name</label>
                                        <input
                                            type='text'
                                            value={form.name_last}
                                            onChange={(e) => setForm({ ...form, name_last: e.target.value })}
                                            className={inputClass}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className={labelClass}>Email</label>
                                    <input
                                        type='email'
                                        value={form.email}
                                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                                        className={inputClass}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Language</label>
                                    <input
                                        type='text'
                                        value={form.language}
                                        onChange={(e) => setForm({ ...form, language: e.target.value })}
                                        className={inputClass}
                                        placeholder='en'
                                    />
                                </div>
                                <div className='flex items-center space-x-2'>
                                    <input
                                        type='checkbox'
                                        id='edit_root_admin'
                                        checked={form.root_admin}
                                        onChange={(e) => setForm({ ...form, root_admin: e.target.checked })}
                                        className='rounded border-mocha-400 bg-mocha-600 text-brand focus:ring-mocha-300'
                                    />
                                    <label htmlFor='edit_root_admin' className='text-sm text-mocha-100'>
                                        Root Admin
                                    </label>
                                </div>

                                <div className='flex justify-end'>
                                    <Button type='submit' variant='default' disabled={saving}>
                                        {saving ? 'Saving...' : 'Save Changes'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Manage Tab */}
                {activeTab === 'manage' && (
                    <div className='space-y-6'>
                        <div className='bg-mocha-500 border border-red-900/50 rounded-lg p-6'>
                            <h3 className='text-red-400 font-medium mb-2'>Danger Zone</h3>
                            <p className='text-sm text-mocha-200 mb-4'>
                                Permanently delete this user and all associated data. This action cannot be undone.
                            </p>
                            <Button variant='attention' onClick={() => setShowDeleteConfirm(true)}>
                                Delete User
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            <Dialog.Confirm
                open={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirmed={handleDelete}
                title='Delete User'
                confirm='Delete'
            >
                Are you sure you want to delete this user? This action cannot be undone.
            </Dialog.Confirm>
        </div>
    );
};

const AdminUsersContainer = () => {
    const [showCreate, setShowCreate] = useState(false);

    return (
        <div>
            <MainPageHeader title='Users'>
                <Button variant='default' onClick={() => setShowCreate(true)}>
                    Create User
                </Button>
            </MainPageHeader>

            <Routes>
                <Route index element={<AdminUserList />} />
                <Route path='view/:id/*' element={<AdminUserView />} />
            </Routes>

            <CreateUserModal
                open={showCreate}
                onClose={() => setShowCreate(false)}
                onCreated={() => mutate((key) => Array.isArray(key) && key[0] === 'admin:users')}
            />
        </div>
    );
};

export default AdminUsersContainer;
