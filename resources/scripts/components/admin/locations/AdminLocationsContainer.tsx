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

    const {
        data: location,
        error: locationError,
        mutate: locationMutate,
    } = useSWR(['admin:location', locationId], () => getLocation(locationId));

    const [tab, setTab] = useState<'details' | 'danger'>('details');
    const [short, setShort] = useState('');
    const [long, setLong] = useState('');
    const [formInit, setFormInit] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
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
        try {
            await deleteLocation(locationId);
            navigate('/admin/locations');
        } catch (e: unknown) {
            setError(httpErrorToHuman(e));
        }
    };

    return (
        <div>
            <MainPageHeader
                title={location?.short || 'Location'}
                headChildren={
                    <Link to='/admin/locations' className='text-sm text-mocha-200 hover:text-mocha-100'>
                        &larr; Back to Locations
                    </Link>
                }
            >
                <Button variant='default' onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving...' : 'Save'}
                </Button>
            </MainPageHeader>

            {(error || locationError) && (
                <div className='text-red-400 mb-4 text-sm'>{error || httpErrorToHuman(locationError)}</div>
            )}
            {success && <div className='text-green-400 mb-4 text-sm'>Location updated.</div>}

            {!location ? (
                <Spinner />
            ) : (
                <>
                    <div className='flex gap-2 mb-6'>
                        <Button variant={tab === 'details' ? 'default' : 'ghost'} onClick={() => setTab('details')}>
                            Details
                        </Button>
                        <Button variant={tab === 'danger' ? 'attention' : 'ghost'} onClick={() => setTab('danger')}>
                            Danger Zone
                        </Button>
                    </div>

                    {tab === 'details' && (
                        <div className='bg-mocha-500 border border-mocha-400 rounded-lg p-6 max-w-2xl'>
                            <div className='mb-4'>
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
                            <div className='mb-4'>
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
                            <div className='grid grid-cols-2 gap-4 pt-4 border-t border-mocha-400 mt-4'>
                                <div>
                                    <span className={labelClass}>Nodes</span>
                                    <p className='text-cream-400'>{location.nodesCount}</p>
                                </div>
                                <div>
                                    <span className={labelClass}>Servers</span>
                                    <p className='text-cream-400'>{location.serversCount}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {tab === 'danger' && (
                        <div className='bg-mocha-500 border border-red-900/50 rounded-lg p-6 max-w-2xl'>
                            <h4 className='text-red-400 font-medium mb-2'>Delete Location</h4>
                            <p className='text-mocha-200 text-sm mb-4'>
                                Permanently remove this location. This action cannot be undone.
                            </p>
                            <Button variant='attention' onClick={() => setShowDeleteConfirm(true)}>
                                Delete Location
                            </Button>
                        </div>
                    )}
                </>
            )}

            <Dialog.Confirm
                open={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirmed={handleDelete}
                title='Delete Location'
                confirm='Delete'
                type='danger'
            >
                Permanently remove this location? This action cannot be undone.
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
