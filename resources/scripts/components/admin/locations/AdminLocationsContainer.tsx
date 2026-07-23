import { DangerIcon, InformationCircleIcon, Location01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useState } from 'react';
import { Link, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import useSWR from 'swr';
import {
    type AdminLocation,
    createLocation,
    deleteLocation,
    getLocation,
    getLocations,
    updateLocation,
} from '@/api/admin/locations';
import { httpErrorToHuman } from '@/api/http';
import { Dialog } from '@/components/elements/dialog';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import Pagination from '@/components/elements/Pagination';
import Spinner from '@/components/elements/Spinner';
import { Button } from '@/components/ui/button';

const inputClass =
    'w-full bg-mocha-600 border border-mocha-400 rounded px-3 py-2 text-sm text-cream-400 focus:outline-none focus:border-mocha-300 transition-colors';
const labelClass = 'block text-sm text-mocha-200 mb-1';

const AdminLocationView = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const locationId = Number(id);
    const [activeTab, setActiveTab] = useState<'details' | 'danger'>('details');

    const {
        data: location,
        error: locationError,
        mutate: locationMutate,
    } = useSWR(['admin:location', locationId], () => getLocation(locationId));

    const [short, setShort] = useState('');
    const [long, setLong] = useState('');
    const [formInit, setFormInit] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    if (location && !formInit) {
        setShort(location.short);
        setLong(location.long);
        setFormInit(true);
    }

    const handleSave = () => {
        setError(null);
        setSuccess(false);
        setSaving(true);
        updateLocation(locationId, { short, long })
            .then(() => {
                setSuccess(true);
                locationMutate();
                setTimeout(() => setSuccess(false), 3000);
            })
            .catch((e) => setError(httpErrorToHuman(e)))
            .finally(() => setSaving(false));
    };

    const handleDelete = async () => {
        setShowDeleteConfirm(false);
        setDeleting(true);
        try {
            await deleteLocation(locationId);
            navigate('/admin/locations');
        } catch (e: unknown) {
            setError(httpErrorToHuman(e));
        } finally {
            setDeleting(false);
        }
    };

    if (locationError) return <div className='text-red-400 p-4'>Error: {httpErrorToHuman(locationError)}</div>;
    if (!location) return <Spinner />;

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
                    <h1 className='text-2xl font-bold text-cream-400'>{location.short}</h1>
                    {location.long && (
                        <span className='inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-mocha-400/50 text-mocha-200 border border-mocha-400/50'>
                            {location.long}
                        </span>
                    )}
                </div>
                <div className='flex items-center gap-3'>
                    {activeTab === 'details' && (
                        <Button variant='default' onClick={handleSave} disabled={saving}>
                            {saving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    )}
                </div>
            </div>

            {error && (
                <div className='text-red-400 mb-4 text-sm bg-red-950/20 border border-red-800/40 rounded-lg p-3'>
                    {error}
                </div>
            )}
            {success && (
                <div className='text-green-400 mb-4 text-sm bg-green-950/20 border border-green-800/40 rounded-lg p-3'>
                    Location updated successfully.
                </div>
            )}

            <div className='flex items-center gap-2 p-1 bg-mocha-500/50 border border-mocha-400/50 rounded-xl w-fit mt-4'>
                {(
                    [
                        { key: 'details', label: 'Details', icon: InformationCircleIcon },
                        { key: 'danger', label: 'Danger Zone', icon: DangerIcon },
                    ] as const
                ).map(({ key, label, icon: Icon }) => (
                    <button
                        key={key}
                        type='button'
                        onClick={() => setActiveTab(key)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            activeTab === key
                                ? key === 'danger'
                                    ? 'bg-red-900/60 text-red-400 shadow-sm'
                                    : 'bg-mocha-400 text-cream-400 shadow-sm'
                                : 'text-mocha-200 hover:text-cream-400 hover:bg-mocha-400/30'
                        }`}
                    >
                        <HugeiconsIcon icon={Icon} className='w-4 h-4' />
                        {label}
                    </button>
                ))}
            </div>

            <div className='mt-4'>
                {activeTab === 'details' && (
                    <div className='space-y-6'>
                        <div className='bg-mocha-500 border border-mocha-400 rounded-xl p-6'>
                            <div className='flex items-center gap-3 mb-6'>
                                <div className='w-10 h-10 bg-mocha-400 rounded-lg flex items-center justify-center'>
                                    <HugeiconsIcon icon={Location01Icon} className='w-5 h-5 text-cream-400' />
                                </div>
                                <div>
                                    <h3 className='text-cream-400 font-semibold text-lg'>Location Details</h3>
                                    <p className='text-mocha-200 text-sm'>Edit short code and description</p>
                                </div>
                            </div>

                            <div className='space-y-5'>
                                <div>
                                    <label htmlFor='short-code' className={labelClass}>
                                        Short Code
                                    </label>
                                    <input
                                        id='short-code'
                                        value={short}
                                        onChange={(e) => setShort(e.target.value)}
                                        className={inputClass}
                                    />
                                </div>
                                <div>
                                    <label htmlFor='location-description' className={labelClass}>
                                        Description
                                    </label>
                                    <input
                                        id='location-description'
                                        value={long}
                                        onChange={(e) => setLong(e.target.value)}
                                        className={inputClass}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className='bg-mocha-500 border border-mocha-400 rounded-xl p-6'>
                            <div className='flex items-center gap-3 mb-4'>
                                <div className='w-10 h-10 bg-mocha-400/50 rounded-lg flex items-center justify-center'>
                                    <svg
                                        className='w-5 h-5 text-mocha-200'
                                        fill='none'
                                        stroke='currentColor'
                                        viewBox='0 0 24 24'
                                        role='presentation'
                                    >
                                        <path
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            strokeWidth={2}
                                            d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                                        />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className='text-mocha-200 font-semibold'>Location Statistics</h3>
                                    <p className='text-mocha-300 text-xs'>Read-only system information</p>
                                </div>
                            </div>

                            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                <div className='bg-mocha-600/50 rounded-lg p-4'>
                                    <span className='text-mocha-200 text-xs uppercase tracking-wider'>Location ID</span>
                                    <p className='text-cream-400 font-mono text-sm mt-1'>#{location.id}</p>
                                </div>
                                <div className='bg-mocha-600/50 rounded-lg p-4'>
                                    <span className='text-mocha-200 text-xs uppercase tracking-wider'>Short Code</span>
                                    <p className='text-cream-400 font-medium mt-1'>{location.short}</p>
                                </div>
                                <div className='bg-mocha-600/50 rounded-lg p-4'>
                                    <span className='text-mocha-200 text-xs uppercase tracking-wider'>Nodes</span>
                                    <p className='text-cream-400 text-2xl font-bold mt-1'>{location.nodesCount}</p>
                                </div>
                                <div className='bg-mocha-600/50 rounded-lg p-4'>
                                    <span className='text-mocha-200 text-xs uppercase tracking-wider'>Servers</span>
                                    <p className='text-cream-400 text-2xl font-bold mt-1'>{location.serversCount}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'danger' && (
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
                                Permanently delete this location and all associated data. This action cannot be undone.
                            </p>
                            <Button variant='attention' onClick={() => setShowDeleteConfirm(true)} disabled={deleting}>
                                {deleting ? 'Deleting...' : 'Delete Location'}
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            <Dialog.Confirm
                open={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirmed={handleDelete}
                title='Delete Location'
                confirm='Delete'
                loading={deleting}
            >
                Are you sure you want to permanently delete location <strong>{location.short}</strong>? This action
                cannot be undone.
            </Dialog.Confirm>
        </div>
    );
};

const AdminLocationsContainer = () => {
    const [page, setPage] = useState(1);
    const [showCreate, setShowCreate] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
    const { data, error, mutate } = useSWR(['admin:locations', page], () => getLocations({ page }));

    const handleDelete = async () => {
        if (confirmDelete === null) return;
        const id = confirmDelete;
        setConfirmDelete(null);
        try {
            await deleteLocation(id);
            mutate();
        } catch (e: unknown) {
            alert(httpErrorToHuman(e));
        }
    };

    return (
        <Routes>
            <Route
                index
                element={
                    <div>
                        <MainPageHeader title='Locations'>
                            <Button variant='default' onClick={() => setShowCreate(true)}>
                                Create Location
                            </Button>
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
                                                        ID
                                                    </th>
                                                    <th className='text-left px-4 py-3 text-mocha-200 font-medium'>
                                                        Short Code
                                                    </th>
                                                    <th className='text-left px-4 py-3 text-mocha-200 font-medium'>
                                                        Description
                                                    </th>
                                                    <th className='text-left px-4 py-3 text-mocha-200 font-medium'>
                                                        Nodes
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
                                                            No locations found.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    items.map((location: AdminLocation) => (
                                                        <tr
                                                            key={location.id}
                                                            className='border-b border-mocha-400 last:border-0 hover:bg-mocha-400/20'
                                                        >
                                                            <td className='px-4 py-3 text-mocha-200'>{location.id}</td>
                                                            <td className='px-4 py-3'>
                                                                <Link
                                                                    to={String(location.id)}
                                                                    className='text-cream-400 hover:text-cream-500'
                                                                >
                                                                    <code>{location.short}</code>
                                                                </Link>
                                                            </td>
                                                            <td className='px-4 py-3 text-mocha-100'>
                                                                {location.long}
                                                            </td>
                                                            <td className='px-4 py-3 text-mocha-100'>
                                                                {location.nodesCount}
                                                            </td>
                                                            <td className='px-4 py-3 text-right'>
                                                                <div className='flex items-center justify-end gap-2'>
                                                                    <Button
                                                                        variant='attention'
                                                                        onClick={() => setConfirmDelete(location.id)}
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

                        <CreateLocationModal
                            open={showCreate}
                            onClose={() => setShowCreate(false)}
                            onCreated={() => mutate()}
                        />

                        <Dialog.Confirm
                            open={confirmDelete !== null}
                            onClose={() => setConfirmDelete(null)}
                            onConfirmed={handleDelete}
                            title='Delete Location'
                            confirm='Delete'
                            type='danger'
                        >
                            Are you sure you want to delete this location?
                        </Dialog.Confirm>
                    </div>
                }
            />
            <Route path=':id/*' element={<AdminLocationView />} />
        </Routes>
    );
};

const CreateLocationModal = ({
    open,
    onClose,
    onCreated,
}: {
    open: boolean;
    onClose: () => void;
    onCreated: () => void;
}) => {
    const [short, setShort] = useState('');
    const [long, setLong] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleCreate = async () => {
        setError('');
        setSaving(true);
        try {
            await createLocation({ short, long });
            onCreated();
            setShort('');
            setLong('');
            onClose();
        } catch (e: unknown) {
            setError(httpErrorToHuman(e));
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} title='Create Location'>
            {error && <div className='text-red-400 mb-4 text-sm'>Error: {error}</div>}
            <div className='space-y-4'>
                <div>
                    <label htmlFor='create-short-code' className={labelClass}>
                        Short Code *
                    </label>
                    <input
                        id='create-short-code'
                        value={short}
                        onChange={(e) => setShort(e.target.value)}
                        className={inputClass}
                        placeholder='us-east-1'
                    />
                </div>
                <div>
                    <label htmlFor='create-description' className={labelClass}>
                        Description *
                    </label>
                    <input
                        id='create-description'
                        value={long}
                        onChange={(e) => setLong(e.target.value)}
                        className={inputClass}
                        placeholder='US East'
                    />
                </div>
            </div>
            <Dialog.Footer>
                <div className='flex items-center gap-3 p-6'>
                    <Button variant='default' onClick={handleCreate} disabled={saving || !short || !long}>
                        {saving ? 'Creating...' : 'Create Location'}
                    </Button>
                    <Button variant='secondary' onClick={onClose}>
                        Cancel
                    </Button>
                </div>
            </Dialog.Footer>
        </Dialog>
    );
};

export default AdminLocationsContainer;
