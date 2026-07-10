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
import ButtonV2 from '@/components/elements/ButtonV2';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import Pagination from '@/components/elements/Pagination';
import Spinner from '@/components/elements/Spinner';

const AdminLocationCreate = () => {
    const navigate = useNavigate();
    const [short, setShort] = useState('');
    const [long, setLong] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCreate = () => {
        setError(null);
        setSaving(true);
        createLocation({ short, long })
            .then(() => navigate('..'))
            .catch((e) => {
                setError(httpErrorToHuman(e));
                setSaving(false);
            });
    };

    const inputClass =
        'w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-gray-200 focus:outline-none focus:border-gray-500';

    return (
        <div>
            <MainPageHeader
                title='Create Location'
                headChildren={
                    <Link to='/admin/locations' className='text-sm text-gray-500 hover:text-gray-300'>
                        &larr; Back to Locations
                    </Link>
                }
            />
            {error && <div className='text-red-400 mb-4 text-sm'>{error}</div>}
            <div className='bg-[#1a1a1a] border border-gray-800 rounded-lg p-6 max-w-2xl'>
                <div className='mb-4'>
                    <label className='block text-sm text-gray-400 mb-1'>Short Code</label>
                    <input value={short} onChange={(e) => setShort(e.target.value)} className={inputClass} />
                </div>
                <div className='mb-4'>
                    <label className='block text-sm text-gray-400 mb-1'>Description</label>
                    <input value={long} onChange={(e) => setLong(e.target.value)} className={inputClass} />
                </div>
                <ButtonV2 onClick={handleCreate} disabled={saving || !short || !long}>
                    {saving ? 'Creating...' : 'Create Location'}
                </ButtonV2>
            </div>
        </div>
    );
};

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

    const handleDelete = () => {
        if (!confirm('Delete this location? This action cannot be undone.')) return;
        setDeleting(true);
        deleteLocation(locationId)
            .then(() => navigate('/admin/locations'))
            .catch((e) => {
                setError(httpErrorToHuman(e));
                setDeleting(false);
            });
    };

    const inputClass =
        'w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-gray-200 focus:outline-none focus:border-gray-500';

    return (
        <div>
            <MainPageHeader
                title={location?.short || 'Location'}
                headChildren={
                    <Link to='/admin/locations' className='text-sm text-gray-500 hover:text-gray-300'>
                        &larr; Back to Locations
                    </Link>
                }
            >
                <ButtonV2 onClick={handleSave} disabled={saving || deleting}>
                    {saving ? 'Saving...' : 'Save'}
                </ButtonV2>
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
                        <button
                            onClick={() => setTab('details')}
                            className={`px-4 py-2 text-sm rounded transition-colors ${
                                tab === 'details' ? 'bg-white/10 text-gray-200' : 'text-gray-500 hover:text-gray-300'
                            }`}
                        >
                            Details
                        </button>
                        <button
                            onClick={() => setTab('danger')}
                            className={`px-4 py-2 text-sm rounded transition-colors ${
                                tab === 'danger' ? 'bg-red-500/10 text-red-400' : 'text-gray-500 hover:text-gray-300'
                            }`}
                        >
                            Danger Zone
                        </button>
                    </div>

                    {tab === 'details' && (
                        <div className='bg-[#1a1a1a] border border-gray-800 rounded-lg p-6 max-w-2xl'>
                            <div className='mb-4'>
                                <label className='block text-sm text-gray-400 mb-1'>Short Code</label>
                                <input
                                    value={short}
                                    onChange={(e) => setShort(e.target.value)}
                                    className={inputClass}
                                />
                            </div>
                            <div className='mb-4'>
                                <label className='block text-sm text-gray-400 mb-1'>Description</label>
                                <input value={long} onChange={(e) => setLong(e.target.value)} className={inputClass} />
                            </div>
                            <div className='grid grid-cols-2 gap-4 pt-4 border-t border-gray-800 mt-4'>
                                <div>
                                    <label className='block text-sm text-gray-400 mb-1'>Nodes</label>
                                    <p className='text-gray-200'>{location.nodesCount}</p>
                                </div>
                                <div>
                                    <label className='block text-sm text-gray-400 mb-1'>Servers</label>
                                    <p className='text-gray-200'>{location.serversCount}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {tab === 'danger' && (
                        <div className='bg-[#1a1a1a] border border-red-900/50 rounded-lg p-6 max-w-2xl'>
                            <h4 className='text-red-400 font-medium mb-2'>Delete Location</h4>
                            <p className='text-gray-500 text-sm mb-4'>
                                Permanently remove this location. This action cannot be undone.
                            </p>
                            <ButtonV2
                                onClick={handleDelete}
                                disabled={deleting}
                                className='!bg-red-600 hover:!bg-red-500'
                            >
                                {deleting ? 'Deleting...' : 'Delete Location'}
                            </ButtonV2>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

const AdminLocationsContainer = () => {
    const [page, setPage] = useState(1);
    const { data, error, mutate } = useSWR(['admin:locations', page], () => getLocations({ page }));

    const handleDelete = async (id: number) => {
        if (!confirm('Delete this location?')) return;
        try {
            await deleteLocation(id);
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
                        <MainPageHeader title='Locations'>
                            <Link
                                to='new'
                                className='px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded transition-colors'
                            >
                                Create Location
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
                                                        ID
                                                    </th>
                                                    <th className='text-left px-4 py-3 text-gray-500 font-medium'>
                                                        Short Code
                                                    </th>
                                                    <th className='text-left px-4 py-3 text-gray-500 font-medium'>
                                                        Description
                                                    </th>
                                                    <th className='text-left px-4 py-3 text-gray-500 font-medium'>
                                                        Nodes
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
                                                            No locations found.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    items.map((location: AdminLocation) => (
                                                        <tr
                                                            key={location.id}
                                                            className='border-b border-gray-800 last:border-0 hover:bg-white/[0.02]'
                                                        >
                                                            <td className='px-4 py-3 text-gray-400'>{location.id}</td>
                                                            <td className='px-4 py-3'>
                                                                <Link
                                                                    to={String(location.id)}
                                                                    className='text-blue-400 hover:text-blue-300'
                                                                >
                                                                    <code>{location.short}</code>
                                                                </Link>
                                                            </td>
                                                            <td className='px-4 py-3 text-gray-300'>{location.long}</td>
                                                            <td className='px-4 py-3 text-gray-300'>
                                                                {location.nodesCount}
                                                            </td>
                                                            <td className='px-4 py-3 text-right'>
                                                                <div className='flex items-center justify-end gap-2'>
                                                                    <button
                                                                        onClick={() => handleDelete(location.id)}
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
                }
            />
            <Route path='new' element={<AdminLocationCreate />} />
            <Route path=':id/*' element={<AdminLocationView />} />
        </Routes>
    );
};

export default AdminLocationsContainer;
