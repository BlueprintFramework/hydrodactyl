import { InformationCircleIcon, ServerStack02Icon, Settings02Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useEffect, useState } from 'react';
import { Link, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import useSWR, { mutate } from 'swr';
import { type AdminUser, createUser, deleteUser, getUser, getUsers, updateUser } from '@/api/admin/users';
import { httpErrorToHuman } from '@/api/http';
import { Dialog } from '@/components/elements/dialog';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import Pagination from '@/components/elements/Pagination';
import Spinner from '@/components/elements/Spinner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

const inputClass =
    'w-full bg-mocha-600 border border-mocha-400 rounded px-3 py-2 text-sm text-cream-400 focus:outline-none focus:border-mocha-300 transition-colors';
const labelClass = 'block text-sm text-mocha-200 mb-1';

// ─── Admin User List ───────────────────────────────────────────────────────

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
        } catch (e: unknown) {
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

// ─── Create User Modal ─────────────────────────────────────────────────────

const CreateUserModal = ({
    open,
    onClose,
    onCreated,
}: {
    open: boolean;
    onClose: () => void;
    onCreated: () => void;
}) => {
    const [error, setError] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [language, setLanguage] = useState('en');
    const [rootAdmin, setRootAdmin] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            const parts = displayName.trim().split(/\s+/);
            await createUser({
                username,
                email,
                name_first: parts[0] || '',
                name_last: parts.slice(1).join(' '),
                password: password || undefined,
                language,
                root_admin: rootAdmin,
            });
            onCreated();
            setDisplayName('');
            setUsername('');
            setEmail('');
            setPassword('');
            setLanguage('en');
            setRootAdmin(false);
            onClose();
        } catch (e: unknown) {
            setError(httpErrorToHuman(e));
        }
    };

    return (
        <Dialog open={open} onClose={onClose} title='Create User'>
            {error && (
                <div className='text-red-400 mb-4 text-sm bg-red-950/20 border border-red-800/40 rounded-lg p-3 mx-6 mt-4'>
                    {error}
                </div>
            )}
            <div className='space-y-4 px-6 pt-2'>
                <div>
                    <label htmlFor='create-displayname' className={labelClass}>
                        Display Name
                    </label>
                    <input
                        id='create-displayname'
                        type='text'
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className={inputClass}
                        placeholder='John Doe'
                    />
                </div>
                <div>
                    <label htmlFor='create-username' className={labelClass}>
                        Username *
                    </label>
                    <input
                        id='create-username'
                        type='text'
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        className={inputClass}
                        placeholder='johndoe'
                    />
                </div>
                <div>
                    <label htmlFor='create-email' className={labelClass}>
                        Email *
                    </label>
                    <input
                        id='create-email'
                        type='email'
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className={inputClass}
                        placeholder='john@example.com'
                    />
                </div>
                <div>
                    <label htmlFor='create-password' className={labelClass}>
                        Password
                    </label>
                    <input
                        id='create-password'
                        type='password'
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={inputClass}
                        placeholder='••••••••'
                    />
                </div>
                <div>
                    <label htmlFor='create-language' className={labelClass}>
                        Language
                    </label>
                    <select
                        id='create-language'
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className={inputClass}
                    >
                        <option value='en'>English</option>
                    </select>
                </div>
                <div className='flex items-center gap-2 pt-1'>
                    <Checkbox
                        id='create_root_admin'
                        checked={rootAdmin}
                        onChange={(e) => setRootAdmin(e.target.checked)}
                        label='Admin'
                    />
                </div>
            </div>
            <Dialog.Footer>
                <div className='flex items-center justify-end gap-3 p-6 border-t border-mocha-400/30'>
                    <Button variant='secondary' onClick={onClose}>
                        Cancel
                    </Button>
                    <Button variant='default' onClick={handleSubmit} disabled={!username || !email}>
                        Create User
                    </Button>
                </div>
            </Dialog.Footer>
        </Dialog>
    );
};

// ─── User View (Full Overhaul) ─────────────────────────────────────────────

const AdminUserView = () => {
    const { id: rawId } = useParams();
    const id = Number(rawId);
    const [activeTab, setActiveTab] = useState<'details' | 'servers' | 'manage'>('details');
    const [editing, setEditing] = useState(false);
    const [formInit, setFormInit] = useState(false);
    const [saving, setSaving] = useState(false);
    const [_error, setError] = useState('');
    const [_success, setSuccess] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const [displayName, setDisplayName] = useState('');
    const [email, setEmail] = useState('');
    const [language, setLanguage] = useState('');
    const [rootAdmin, setRootAdmin] = useState(false);

    const {
        data: user,
        error: fetchError,
        mutate,
    } = useSWR(id ? ['admin:user', id] : null, () => getUser(id, 'servers'));

    const navigate = useNavigate();

    useEffect(() => {
        if (user && !formInit) {
            setDisplayName([user.nameFirst, user.nameLast].filter(Boolean).join(' '));
            setEmail(user.email);
            setLanguage(user.language);
            setRootAdmin(user.rootAdmin);
            setFormInit(true);
        }
    }, [user, formInit]);

    const syncFromUser = () => {
        if (!user) return;
        setDisplayName([user.nameFirst, user.nameLast].filter(Boolean).join(' '));
        setEmail(user.email);
        setLanguage(user.language);
        setRootAdmin(user.rootAdmin);
    };

    const handleSave = async () => {
        setError('');
        setSuccess('');
        setSaving(true);
        try {
            const parts = displayName.trim().split(/\s+/);
            await updateUser(id, {
                name_first: parts[0] || '',
                name_last: parts.slice(1).join(' '),
                email,
                language,
                root_admin: rootAdmin,
            });
            await mutate();
            setEditing(false);
            toast.success('User updated successfully');
        } catch (e: unknown) {
            toast.error(httpErrorToHuman(e));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        setShowDeleteConfirm(false);
        setDeleting(true);
        try {
            await deleteUser(id);
            toast.success('User deleted successfully');
            navigate('/admin/users');
        } catch (e: unknown) {
            toast.error(httpErrorToHuman(e));
        } finally {
            setDeleting(false);
        }
    };

    if (fetchError) return <div className='text-red-400 p-4'>Error: {httpErrorToHuman(fetchError)}</div>;
    if (!user) return <Spinner />;

    const gravatarUrl = `https://www.gravatar.com/avatar/${Array.from(
        new TextEncoder().encode(user.email.toLowerCase().trim()),
    )
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')}?d=identicon&s=96`;

    const accountAge = (() => {
        const created = new Date(user.createdAt);
        const now = new Date();
        const days = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
        if (days < 1) return 'Today';
        if (days === 1) return '1 day ago';
        if (days < 30) return `${days} days ago`;
        const months = Math.floor(days / 30);
        if (months === 1) return '1 month ago';
        if (months < 12) return `${months} months ago`;
        const years = Math.floor(months / 12);
        return years === 1 ? '1 year ago' : `${years} years ago`;
    })();

    return (
        <div>
            <div className='flex items-center justify-between gap-4 mb-6 mt-8 md:mt-0 flex-col sm:flex-row'>
                <div className='flex items-center gap-3'>
                    <Link to='..' className='text-sm text-mocha-200 hover:text-cream-400 transition-colors'>
                        <svg
                            className='w-4 h-4'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                            role='presentation'
                        >
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' />
                        </svg>
                    </Link>
                    <h1 className='text-2xl font-bold text-cream-400'>{user.username}</h1>
                    {user.rootAdmin && (
                        <span className='inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-900/50 text-red-400 border border-red-700/50'>
                            Admin
                        </span>
                    )}
                    <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            user.useTotp
                                ? 'bg-green-900/50 text-green-400 border border-green-700/50'
                                : 'bg-mocha-400/50 text-mocha-200 border border-mocha-400/50'
                        }`}
                    >
                        2FA {user.useTotp ? 'On' : 'Off'}
                    </span>
                </div>
                <div className='flex items-center gap-3'>
                    {activeTab === 'details' && editing && (
                        <Button variant='default' onClick={handleSave} disabled={saving}>
                            {saving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    )}
                    <Button variant='attention' onClick={() => setShowDeleteConfirm(true)} disabled={deleting}>
                        Delete User
                    </Button>
                </div>
            </div>

            <div className='flex items-center gap-2 p-1 bg-mocha-500/50 border border-mocha-400/50 rounded-xl w-fit mt-4'>
                {(
                    [
                        { key: 'details', label: 'Details', icon: InformationCircleIcon },
                        { key: 'servers', label: 'Servers', icon: ServerStack02Icon },
                        { key: 'manage', label: 'Manage', icon: Settings02Icon },
                    ] as const
                ).map(({ key, label, icon: Icon }) => (
                    <button
                        key={key}
                        type='button'
                        onClick={() => setActiveTab(key)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            activeTab === key
                                ? 'bg-mocha-400 text-cream-400 shadow-sm'
                                : 'text-mocha-200 hover:text-cream-400 hover:bg-mocha-400/30'
                        }`}
                    >
                        <HugeiconsIcon icon={Icon} className='w-4 h-4' />
                        {label}
                    </button>
                ))}
            </div>

            <div className='mt-4'>
                {/* ── Details Tab ── */}
                {activeTab === 'details' && (
                    <div className='space-y-6'>
                        {/* Profile Card */}
                        <div className='bg-mocha-500 border border-mocha-400 rounded-xl p-6'>
                            <div className='flex flex-col sm:flex-row items-start sm:items-center gap-5'>
                                <img
                                    src={gravatarUrl}
                                    alt={user.username}
                                    className='w-16 h-16 rounded-xl border border-mocha-400 object-cover'
                                />
                                <div className='flex-1 min-w-0'>
                                    <p className='text-cream-400 font-medium'>{user.email}</p>
                                    {user.nameFirst && user.nameLast && (
                                        <p className='text-mocha-200 text-sm mt-0.5'>
                                            {user.nameFirst} {user.nameLast}
                                        </p>
                                    )}
                                </div>
                                <div className='flex items-center gap-3'>
                                    <div className='text-center bg-mocha-600/50 rounded-lg px-4 py-3'>
                                        <p className='text-2xl font-bold text-cream-400'>{user.serversCount}</p>
                                        <p className='text-xs text-mocha-200'>Servers</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Account Info Card */}
                        <div className='bg-mocha-500 border border-mocha-400 rounded-xl p-6'>
                            <div className='flex items-center justify-between mb-6'>
                                <div className='flex items-center gap-3'>
                                    <div className='w-10 h-10 bg-mocha-400 rounded-lg flex items-center justify-center'>
                                        <svg
                                            className='w-5 h-5 text-cream-400'
                                            fill='none'
                                            stroke='currentColor'
                                            viewBox='0 0 24 24'
                                            role='presentation'
                                        >
                                            <path
                                                strokeLinecap='round'
                                                strokeLinejoin='round'
                                                strokeWidth={2}
                                                d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
                                            />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className='text-cream-400 font-semibold text-lg'>Account Details</h3>
                                        <p className='text-mocha-200 text-sm'>User identification and metadata</p>
                                    </div>
                                </div>
                                {!editing && (
                                    <Button variant='secondary' onClick={() => setEditing(true)}>
                                        Edit Details
                                    </Button>
                                )}
                            </div>

                            {editing ? (
                                <div className='space-y-5'>
                                    <div>
                                        <label htmlFor='edit-displayname' className={labelClass}>
                                            Displayname
                                        </label>
                                        <input
                                            id='edit-displayname'
                                            type='text'
                                            value={displayName}
                                            onChange={(e) => setDisplayName(e.target.value)}
                                            className={inputClass}
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor='edit-email' className={labelClass}>
                                            Email Address
                                        </label>
                                        <input
                                            id='edit-email'
                                            type='email'
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className={inputClass}
                                        />
                                    </div>

                                    <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
                                        <div>
                                            <label htmlFor='edit-language' className={labelClass}>
                                                Language
                                            </label>
                                            <input
                                                id='edit-language'
                                                type='text'
                                                value={language}
                                                onChange={(e) => setLanguage(e.target.value)}
                                                className={inputClass}
                                                placeholder='en'
                                            />
                                        </div>
                                        <div className='flex items-end'>
                                            <div className='pb-2'>
                                                <Checkbox
                                                    id='edit_root_admin'
                                                    checked={rootAdmin}
                                                    onChange={(e) => setRootAdmin(e.target.checked)}
                                                    label='Root Admin'
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className='flex items-center gap-3 pt-2'>
                                        <Button variant='default' onClick={handleSave} disabled={saving}>
                                            {saving ? 'Saving...' : 'Save Changes'}
                                        </Button>
                                        <Button
                                            variant='secondary'
                                            onClick={() => {
                                                syncFromUser();
                                                setEditing(false);
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className='space-y-4'>
                                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                                        <div className='bg-mocha-600/50 rounded-lg p-4'>
                                            <span className='text-mocha-200 text-xs uppercase tracking-wider'>
                                                User ID
                                            </span>
                                            <p className='text-cream-400 font-medium mt-1'>{user.id}</p>
                                        </div>
                                        <div className='bg-mocha-600/50 rounded-lg p-4'>
                                            <span className='text-mocha-200 text-xs uppercase tracking-wider'>
                                                UUID
                                            </span>
                                            <p
                                                className='text-cream-400 font-mono text-sm mt-1 truncate'
                                                title={user.uuid}
                                            >
                                                {user.uuid}
                                            </p>
                                        </div>
                                        <div className='bg-mocha-600/50 rounded-lg p-4'>
                                            <span className='text-mocha-200 text-xs uppercase tracking-wider'>
                                                External ID
                                            </span>
                                            <p className='text-cream-400 font-mono text-sm mt-1'>
                                                {user.externalId || <span className='text-mocha-200/60'>None</span>}
                                            </p>
                                        </div>
                                        <div className='bg-mocha-600/50 rounded-lg p-4'>
                                            <span className='text-mocha-200 text-xs uppercase tracking-wider'>
                                                Username
                                            </span>
                                            <p className='text-cream-400 font-medium mt-1'>{user.username}</p>
                                        </div>
                                        <div className='bg-mocha-600/50 rounded-lg p-4'>
                                            <span className='text-mocha-200 text-xs uppercase tracking-wider'>
                                                Email
                                            </span>
                                            <p className='text-cream-400 text-sm mt-1'>{user.email}</p>
                                        </div>
                                        <div className='bg-mocha-600/50 rounded-lg p-4'>
                                            <span className='text-mocha-200 text-xs uppercase tracking-wider'>
                                                Displayname
                                            </span>
                                            <p className='text-cream-400 text-sm mt-1'>
                                                {user.nameFirst || user.nameLast ? (
                                                    `${user.nameFirst} ${user.nameLast}`.trim()
                                                ) : (
                                                    <span className='text-mocha-200/60'>Not set</span>
                                                )}
                                            </p>
                                        </div>
                                        <div className='bg-mocha-600/50 rounded-lg p-4'>
                                            <span className='text-mocha-200 text-xs uppercase tracking-wider'>
                                                Language
                                            </span>
                                            <p className='text-cream-400 font-medium mt-1'>{user.language || 'en'}</p>
                                        </div>
                                        <div className='bg-mocha-600/50 rounded-lg p-4'>
                                            <span className='text-mocha-200 text-xs uppercase tracking-wider'>
                                                Created
                                            </span>
                                            <p className='text-cream-400 text-sm mt-1' title={user.createdAt}>
                                                {accountAge}
                                            </p>
                                        </div>
                                        <div className='bg-mocha-600/50 rounded-lg p-4'>
                                            <span className='text-mocha-200 text-xs uppercase tracking-wider'>
                                                Last Updated
                                            </span>
                                            <p className='text-cream-400 text-sm mt-1' title={user.updatedAt}>
                                                {user.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : '—'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ── Servers Tab ── */}
                {activeTab === 'servers' && (
                    <div className='space-y-4'>
                        <div className='bg-mocha-500 border border-mocha-400 rounded-xl p-6'>
                            <div className='flex items-center gap-3 mb-6'>
                                <div className='w-10 h-10 bg-mocha-400 rounded-lg flex items-center justify-center'>
                                    <svg
                                        className='w-5 h-5 text-cream-400'
                                        fill='none'
                                        stroke='currentColor'
                                        viewBox='0 0 24 24'
                                        role='presentation'
                                    >
                                        <path
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            strokeWidth={2}
                                            d='M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01'
                                        />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className='text-cream-400 font-semibold text-lg'>User Servers</h3>
                                    <p className='text-mocha-200 text-sm'>
                                        {user.serversCount} server{user.serversCount !== 1 ? 's' : ''} owned by this
                                        user
                                    </p>
                                </div>
                            </div>

                            {user.servers && user.servers.length > 0 ? (
                                <div className='bg-mocha-500 border border-mocha-400 rounded-lg overflow-hidden'>
                                    <table className='w-full text-sm'>
                                        <thead>
                                            <tr className='border-b border-mocha-400'>
                                                <th className='text-left px-4 py-3 text-mocha-200 font-medium'>Name</th>
                                                <th className='text-left px-4 py-3 text-mocha-200 font-medium'>
                                                    Identifier
                                                </th>
                                                <th className='text-left px-4 py-3 text-mocha-200 font-medium'>Node</th>
                                                <th className='text-left px-4 py-3 text-mocha-200 font-medium'>
                                                    Status
                                                </th>
                                                <th className='text-left px-4 py-3 text-mocha-200 font-medium'>
                                                    Created
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {user.servers.map((server) => (
                                                <tr
                                                    key={server.id}
                                                    className='border-b border-mocha-400 last:border-0 hover:bg-mocha-400/20'
                                                >
                                                    <td className='px-4 py-3'>
                                                        <Link
                                                            to={`/admin/servers/view/${server.id}`}
                                                            className='text-cream-400 font-medium hover:text-cream-200'
                                                        >
                                                            {server.name}
                                                        </Link>
                                                    </td>
                                                    <td className='px-4 py-3'>
                                                        <code className='text-cream-400 text-xs'>
                                                            {server.identifier}
                                                        </code>
                                                    </td>
                                                    <td className='px-4 py-3 text-mocha-100'>#{server.nodeId}</td>
                                                    <td className='px-4 py-3'>
                                                        <span
                                                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                                                server.suspended
                                                                    ? 'bg-yellow-900/50 text-yellow-400'
                                                                    : 'bg-green-900/50 text-green-400'
                                                            }`}
                                                        >
                                                            {server.suspended ? 'Suspended' : 'Active'}
                                                        </span>
                                                    </td>
                                                    <td className='px-4 py-3 text-mocha-100 text-sm'>
                                                        {server.createdAt
                                                            ? new Date(server.createdAt).toLocaleDateString()
                                                            : '—'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className='text-center py-12 text-mocha-200'>
                                    <svg
                                        className='w-12 h-12 mx-auto mb-3 text-mocha-400'
                                        fill='none'
                                        stroke='currentColor'
                                        viewBox='0 0 24 24'
                                        role='presentation'
                                    >
                                        <path
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            strokeWidth={1.5}
                                            d='M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2'
                                        />
                                    </svg>
                                    <p className='text-sm'>This user has no servers.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ── Manage Tab ── */}
                {activeTab === 'manage' && (
                    <div className='space-y-6'>
                        <div className='bg-mocha-500 border-2 border-red-800/50 rounded-xl p-6'>
                            <div className='flex items-center gap-3 mb-4'>
                                <div className='w-10 h-10 bg-red-900/50 rounded-lg flex items-center justify-center'>
                                    <svg
                                        className='w-5 h-5 text-red-400'
                                        fill='none'
                                        stroke='currentColor'
                                        viewBox='0 0 24 24'
                                        role='presentation'
                                    >
                                        <path
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            strokeWidth={2}
                                            d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
                                        />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className='text-red-400 font-semibold text-lg'>Danger Zone</h3>
                                    <p className='text-mocha-200 text-sm'>Irreversible actions</p>
                                </div>
                            </div>

                            <p className='text-sm text-mocha-200 mb-4'>
                                Permanently delete this user and all associated data including servers. This action
                                cannot be undone.
                            </p>
                            <Button variant='attention' onClick={() => setShowDeleteConfirm(true)} disabled={deleting}>
                                {deleting ? 'Deleting...' : 'Delete User'}
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
                Are you sure you want to permanently delete user <strong>{user.username}</strong>? This action cannot be
                undone.
            </Dialog.Confirm>
        </div>
    );
};

// ─── Container ─────────────────────────────────────────────────────────────

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
