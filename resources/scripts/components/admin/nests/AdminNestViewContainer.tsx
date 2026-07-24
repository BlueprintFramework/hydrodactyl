import {
    CubeIcon,
    Delete02Icon,
    EggsIcon,
    InformationCircleIcon,
    Settings02Icon,
    Upload02Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useEffect, useRef, useState } from 'react';
import { Link, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import useSWR from 'swr';
import {
    type AdminEgg,
    deleteEgg,
    deleteNest,
    getNest,
    getNestEggs,
    removeNestIcon,
    updateNest,
    updateNestIcon,
} from '@/api/admin/nests';
import { httpErrorToHuman } from '@/api/http';
import AdminEggViewContainer from '@/components/admin/nests/AdminEggViewContainer';
import { Dialog } from '@/components/elements/dialog';
import Spinner from '@/components/elements/Spinner';
import { Button } from '@/components/ui/button';

const inputClass =
    'w-full bg-mocha-600 border border-mocha-400 rounded px-3 py-2 text-sm text-cream-400 focus:outline-none focus:border-mocha-300 transition-colors';
const labelClass = 'block text-sm text-mocha-200 mb-1';

const AdminNestView = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const nestId = Number(id);
    const iconInputRef = useRef<HTMLInputElement>(null);
    const [activeTab, setActiveTab] = useState<'details' | 'eggs' | 'manage'>('details');
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [_error, setError] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [confirmDeleteEgg, setConfirmDeleteEgg] = useState<AdminEgg | null>(null);
    const [deletingEgg, setDeletingEgg] = useState(false);
    const [uploadingIcon, setUploadingIcon] = useState(false);

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    const {
        data: nest,
        error: fetchError,
        mutate,
    } = useSWR(nestId ? ['admin:nest', nestId] : null, () => getNest(nestId));

    const {
        data: eggsData,
        error: eggsError,
        mutate: mutateEggs,
    } = useSWR(nestId ? ['admin:nest:eggs', nestId] : null, () => getNestEggs(nestId));

    useEffect(() => {
        if (nest) {
            setName(nest.name);
            setDescription(nest.description || '');
        }
    }, [nest]);

    const syncFromNest = () => {
        if (!nest) return;
        setName(nest.name);
        setDescription(nest.description || '');
    };

    const handleSave = async () => {
        setError('');
        setSaving(true);
        try {
            await updateNest(nestId, { name, description: description || undefined });
            await mutate();
            setEditing(false);
            toast.success('Nest updated successfully');
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
            await deleteNest(nestId);
            toast.success('Nest deleted successfully');
            navigate('/admin/nests');
        } catch (e: unknown) {
            toast.error(httpErrorToHuman(e));
        } finally {
            setDeleting(false);
        }
    };

    const handleDeleteEgg = async () => {
        if (!confirmDeleteEgg) return;
        setDeletingEgg(true);
        try {
            await deleteEgg(nestId, confirmDeleteEgg.id);
            toast.success(`Egg "${confirmDeleteEgg.name}" deleted`);
            setConfirmDeleteEgg(null);
            mutate();
            mutateEggs();
        } catch (e: unknown) {
            toast.error(httpErrorToHuman(e));
        } finally {
            setDeletingEgg(false);
        }
    };

    const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingIcon(true);
        try {
            await updateNestIcon(nestId, file);
            await mutate();
            toast.success('Nest icon updated');
        } catch (e: unknown) {
            toast.error(httpErrorToHuman(e));
        } finally {
            setUploadingIcon(false);
            if (iconInputRef.current) iconInputRef.current.value = '';
        }
    };

    const handleIconRemove = async () => {
        setUploadingIcon(true);
        try {
            await removeNestIcon(nestId);
            await mutate();
            toast.success('Nest icon removed');
        } catch (e: unknown) {
            toast.error(httpErrorToHuman(e));
        } finally {
            setUploadingIcon(false);
        }
    };

    if (fetchError) return <div className='text-red-400 p-4'>Error: {httpErrorToHuman(fetchError)}</div>;
    if (!nest) return <Spinner />;

    const eggs = eggsData?.items || [];

    return (
        <div>
            {/* ── Header ── */}
            <div className='flex items-center justify-between gap-4 mb-6 mt-8 md:mt-0 flex-col sm:flex-row'>
                <div className='flex items-center gap-3'>
                    <Link
                        to='/admin/nests'
                        className='w-9 h-9 rounded-lg bg-mocha-500 border border-mocha-400 flex items-center justify-center text-mocha-200 hover:text-cream-400 hover:border-mocha-300 transition-all shrink-0'
                    >
                        <svg
                            className='w-4 h-4'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                            role='img'
                            aria-label='Back'
                        >
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' />
                        </svg>
                    </Link>
                    <div className='w-10 h-10 rounded-lg border border-mocha-400 overflow-hidden shrink-0'>
                        {nest.icon ? (
                            <img src={nest.icon} alt={nest.name} className='w-full h-full object-cover' />
                        ) : (
                            <div className='w-full h-full bg-mocha-400/30 flex items-center justify-center'>
                                <HugeiconsIcon icon={CubeIcon} className='w-5 h-5 text-cream-400' />
                            </div>
                        )}
                    </div>
                    <h1 className='text-2xl font-bold text-cream-400'>{nest.name}</h1>
                    <span className='inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-mocha-400/50 text-mocha-200 border border-mocha-400/50'>
                        {nest.author}
                    </span>
                </div>
                <div className='flex items-center gap-3'>
                    {activeTab === 'details' && editing && (
                        <Button variant='default' onClick={handleSave} disabled={saving}>
                            {saving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    )}
                    <Button variant='attention' onClick={() => setShowDeleteConfirm(true)} disabled={deleting}>
                        <HugeiconsIcon icon={Delete02Icon} className='w-4 h-4' />
                        Delete Nest
                    </Button>
                </div>
            </div>

            {/* ── Tab Navigation ── */}
            <div className='flex items-center gap-2 p-1 bg-mocha-500/50 border border-mocha-400/50 rounded-xl w-fit'>
                {(
                    [
                        { key: 'details', label: 'Details', icon: InformationCircleIcon },
                        { key: 'eggs', label: 'Eggs', icon: EggsIcon },
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

            {/* ── Tab Content ── */}
            <div className='mt-4'>
                {/* ── Details Tab ── */}
                {activeTab === 'details' && (
                    <div className='space-y-6'>
                        {/* Profile Card */}
                        <div className='bg-mocha-500 border border-mocha-400 rounded-xl p-6'>
                            <div className='flex flex-col sm:flex-row items-start sm:items-center gap-5'>
                                <button
                                    type='button'
                                    className='w-16 h-16 rounded-xl border border-mocha-400 shrink-0 overflow-hidden cursor-pointer hover:border-mocha-300 transition-colors relative group'
                                    onClick={() => iconInputRef.current?.click()}
                                >
                                    {nest.icon ? (
                                        <img src={nest.icon} alt={nest.name} className='w-full h-full object-cover' />
                                    ) : (
                                        <div className='w-full h-full bg-brand/10 flex items-center justify-center'>
                                            <HugeiconsIcon icon={CubeIcon} className='w-8 h-8 text-cream-400' />
                                        </div>
                                    )}
                                    <div className='absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center'>
                                        <HugeiconsIcon icon={Upload02Icon} className='w-5 h-5 text-cream-400' />
                                    </div>
                                </button>
                                <input
                                    ref={iconInputRef}
                                    type='file'
                                    accept='image/png,image/jpeg,image/gif,image/webp,image/svg+xml,image/ico,image/avif'
                                    className='hidden'
                                    onChange={handleIconUpload}
                                />
                                <div className='flex-1 min-w-0'>
                                    <p className='text-cream-400 font-medium text-lg'>{nest.name}</p>
                                    {nest.description && (
                                        <p className='text-mocha-200 text-sm mt-0.5'>{nest.description}</p>
                                    )}
                                </div>
                                <div className='flex items-center gap-3'>
                                    {nest.icon && (
                                        <Button
                                            variant='secondary'
                                            size='sm'
                                            onClick={handleIconRemove}
                                            disabled={uploadingIcon}
                                        >
                                            {uploadingIcon ? 'Removing...' : 'Remove Icon'}
                                        </Button>
                                    )}
                                    <div className='text-center bg-mocha-600/50 rounded-lg px-4 py-3'>
                                        <p className='text-2xl font-bold text-cream-400'>{eggs.length}</p>
                                        <p className='text-xs text-mocha-200'>Eggs</p>
                                    </div>
                                    <div className='text-center bg-mocha-600/50 rounded-lg px-4 py-3'>
                                        <p className='text-2xl font-bold text-cream-400'>{nest.serversCount}</p>
                                        <p className='text-xs text-mocha-200'>Servers</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Details Card */}
                        <div className='bg-mocha-500 border border-mocha-400 rounded-xl p-6'>
                            <div className='flex items-center justify-between mb-6'>
                                <div className='flex items-center gap-3'>
                                    <div className='w-10 h-10 bg-mocha-400 rounded-lg flex items-center justify-center'>
                                        <HugeiconsIcon
                                            icon={InformationCircleIcon}
                                            className='w-5 h-5 text-cream-400'
                                        />
                                    </div>
                                    <div>
                                        <h3 className='text-cream-400 font-semibold text-lg'>Nest Information</h3>
                                        <p className='text-mocha-200 text-sm'>Identification and metadata</p>
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
                                    <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
                                        <div>
                                            <label htmlFor='nest-name' className={labelClass}>
                                                Nest Name *
                                            </label>
                                            <input
                                                id='nest-name'
                                                type='text'
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                className={inputClass}
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor='nest-description' className={labelClass}>
                                                Description
                                            </label>
                                            <input
                                                id='nest-description'
                                                type='text'
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                                className={inputClass}
                                                placeholder='Optional description'
                                            />
                                        </div>
                                    </div>

                                    <div className='flex items-center gap-3 pt-2'>
                                        <Button variant='default' onClick={handleSave} disabled={saving}>
                                            {saving ? 'Saving...' : 'Save Changes'}
                                        </Button>
                                        <Button
                                            variant='secondary'
                                            onClick={() => {
                                                syncFromNest();
                                                setEditing(false);
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                                    <div className='bg-mocha-600/50 rounded-lg p-4'>
                                        <span className='text-mocha-200 text-xs uppercase tracking-wider'>Nest ID</span>
                                        <p className='text-cream-400 font-medium mt-1'>#{nest.id}</p>
                                    </div>
                                    <div className='bg-mocha-600/50 rounded-lg p-4'>
                                        <span className='text-mocha-200 text-xs uppercase tracking-wider'>UUID</span>
                                        <p className='text-cream-400 font-mono text-sm mt-1 truncate' title={nest.uuid}>
                                            {nest.uuid}
                                        </p>
                                    </div>
                                    <div className='bg-mocha-600/50 rounded-lg p-4'>
                                        <span className='text-mocha-200 text-xs uppercase tracking-wider'>Author</span>
                                        <p className='text-cream-400 text-sm mt-1'>{nest.author}</p>
                                    </div>
                                    <div className='bg-mocha-600/50 rounded-lg p-4'>
                                        <span className='text-mocha-200 text-xs uppercase tracking-wider'>Eggs</span>
                                        <p className='text-cream-400 font-medium mt-1'>{eggs.length}</p>
                                    </div>
                                    <div className='bg-mocha-600/50 rounded-lg p-4'>
                                        <span className='text-mocha-200 text-xs uppercase tracking-wider'>Servers</span>
                                        <p className='text-cream-400 font-medium mt-1'>{nest.serversCount}</p>
                                    </div>
                                    <div className='bg-mocha-600/50 rounded-lg p-4'>
                                        <span className='text-mocha-200 text-xs uppercase tracking-wider'>Created</span>
                                        <p className='text-cream-400 text-sm mt-1' title={nest.createdAt}>
                                            {new Date(nest.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ── Eggs Tab ── */}
                {activeTab === 'eggs' && (
                    <div className='space-y-4'>
                        <div className='bg-mocha-500 border border-mocha-400 rounded-xl p-6'>
                            <div className='flex items-center gap-3 mb-6'>
                                <div className='w-10 h-10 bg-mocha-400 rounded-lg flex items-center justify-center'>
                                    <HugeiconsIcon icon={EggsIcon} className='w-5 h-5 text-cream-400' />
                                </div>
                                <div>
                                    <h3 className='text-cream-400 font-semibold text-lg'>Nest Eggs</h3>
                                    <p className='text-mocha-200 text-sm'>
                                        {eggs.length} egg{eggs.length !== 1 ? 's' : ''} in this nest
                                    </p>
                                </div>
                            </div>

                            {eggsError && (
                                <div className='text-red-400 mb-4 text-sm bg-red-950/20 border border-red-800/40 rounded-lg p-3'>
                                    Error loading eggs: {httpErrorToHuman(eggsError)}
                                </div>
                            )}

                            {eggs.length > 0 ? (
                                <div className='bg-mocha-500 border border-mocha-400 rounded-lg overflow-hidden'>
                                    <table className='w-full text-sm border-collapse'>
                                        <thead>
                                            <tr className='border-b border-mocha-400/80 bg-mocha-600/20'>
                                                <th className='text-left px-5 py-3.5 text-mocha-200 font-semibold tracking-wide uppercase text-xs'>
                                                    Name
                                                </th>
                                                <th className='text-left px-5 py-3.5 text-mocha-200 font-semibold tracking-wide uppercase text-xs hidden md:table-cell'>
                                                    Author
                                                </th>
                                                <th className='text-left px-5 py-3.5 text-mocha-200 font-semibold tracking-wide uppercase text-xs hidden lg:table-cell'>
                                                    Docker Image
                                                </th>
                                                <th className='text-left px-5 py-3.5 text-mocha-200 font-semibold tracking-wide uppercase text-xs hidden xl:table-cell'>
                                                    Features
                                                </th>
                                                <th className='text-right px-5 py-3.5 text-mocha-200 font-semibold tracking-wide uppercase text-xs w-[140px]'>
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className='divide-y divide-mocha-400/40'>
                                            {eggs.map((egg) => (
                                                <tr key={egg.id} className='hover:bg-mocha-400/15 transition-colors'>
                                                    <td className='px-5 py-3.5'>
                                                        <Link
                                                            to={`eggs/${egg.id}`}
                                                            className='text-cream-400 font-semibold hover:text-cream-200 transition-colors'
                                                        >
                                                            {egg.name}
                                                        </Link>
                                                    </td>
                                                    <td className='px-5 py-3.5 text-mocha-100 hidden md:table-cell'>
                                                        {egg.author}
                                                    </td>
                                                    <td className='px-5 py-3.5 hidden lg:table-cell'>
                                                        <code className='text-xs text-cream-400 bg-mocha-600/60 px-2 py-1 rounded border border-mocha-400/40 font-mono'>
                                                            {Object.values(egg.dockerImages || {})[0] || '—'}
                                                        </code>
                                                    </td>
                                                    <td className='px-5 py-3.5 hidden xl:table-cell'>
                                                        {egg.features && egg.features.length > 0 ? (
                                                            <div className='flex flex-wrap gap-1'>
                                                                {egg.features.map((f) => (
                                                                    <span
                                                                        key={f}
                                                                        className='inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-mocha-400/50 text-mocha-200'
                                                                    >
                                                                        {f}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <span className='text-mocha-300 text-xs'>—</span>
                                                        )}
                                                    </td>
                                                    <td className='px-5 py-3.5 text-right'>
                                                        <div className='flex items-center justify-end gap-3'>
                                                            <Link
                                                                to={`eggs/${egg.id}`}
                                                                className='text-xs font-semibold text-cream-400 hover:text-cream-200 transition-colors'
                                                            >
                                                                Configure
                                                            </Link>
                                                            <Button
                                                                variant='attention'
                                                                size='sm'
                                                                onClick={() => setConfirmDeleteEgg(egg)}
                                                            >
                                                                Delete
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className='text-center py-12 text-mocha-200'>
                                    <HugeiconsIcon icon={EggsIcon} className='w-12 h-12 mx-auto mb-3 text-mocha-400' />
                                    <p className='text-sm font-medium'>No eggs in this nest yet.</p>
                                    <p className='text-xs text-mocha-200/60 mt-1'>
                                        Eggs define the server types available in this nest.
                                    </p>
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
                                    <HugeiconsIcon icon={Delete02Icon} className='w-5 h-5 text-red-400' />
                                </div>
                                <div>
                                    <h3 className='text-red-400 font-semibold text-lg'>Danger Zone</h3>
                                    <p className='text-mocha-200 text-sm'>Irreversible actions</p>
                                </div>
                            </div>

                            <p className='text-sm text-mocha-200 mb-4'>
                                Permanently delete this nest and all associated eggs. This action cannot be undone.
                            </p>
                            <Button variant='attention' onClick={() => setShowDeleteConfirm(true)} disabled={deleting}>
                                {deleting ? 'Deleting...' : 'Delete Nest'}
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            <Dialog.Confirm
                open={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirmed={handleDelete}
                title='Delete Nest'
                confirm='Delete'
                loading={deleting}
            >
                Are you sure you want to permanently delete nest <strong>{nest.name}</strong>? All eggs in this nest
                will also be deleted. This action cannot be undone.
            </Dialog.Confirm>

            <Dialog.Confirm
                open={confirmDeleteEgg !== null}
                onClose={() => setConfirmDeleteEgg(null)}
                onConfirmed={handleDeleteEgg}
                title='Delete Egg'
                confirm='Delete'
                loading={deletingEgg}
            >
                Are you sure you want to permanently delete egg <strong>{confirmDeleteEgg?.name}</strong>? This action
                cannot be undone.
            </Dialog.Confirm>
        </div>
    );
};

const AdminNestViewContainer = () => {
    return (
        <Routes>
            <Route index element={<AdminNestView />} />
            <Route path='eggs/:eggId/*' element={<AdminEggViewContainer />} />
        </Routes>
    );
};

export default AdminNestViewContainer;
