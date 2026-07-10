import { useState } from 'react';
import { Link, Route, Routes, useParams, useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import { TrashBin } from '@gravity-ui/icons';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import Spinner from '@/components/elements/Spinner';
import ButtonV2 from '@/components/elements/ButtonV2';
import { getNest, updateNest, deleteNest, getNestEggs, deleteEgg, type AdminEgg } from '@/api/admin/nests';
import { httpErrorToHuman } from '@/api/http';
import AdminEggViewContainer from '@/components/admin/nests/AdminEggViewContainer';

const AdminNestViewContainer = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const nestId = Number(id);

    const { data: nest, error: nestError, mutate: nestMutate } = useSWR(
        ['admin:nest', nestId],
        () => getNest(nestId),
    );

    const { data: eggsData, error: eggsError, mutate: eggsMutate } = useSWR(
        ['admin:nest:eggs', nestId],
        () => getNestEggs(nestId),
    );

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [initialized, setInitialized] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    if (nest && !initialized) {
        setName(nest.name);
        setDescription(nest.description);
        setInitialized(true);
    }

    const handleSave = () => {
        setError(null);
        setSuccess(false);
        setSaving(true);
        updateNest(nestId, { name, description: description || undefined })
            .then(() => {
                setSuccess(true);
                nestMutate();
                setTimeout(() => setSuccess(false), 3000);
            })
            .catch((e) => setError(httpErrorToHuman(e)))
            .finally(() => setSaving(false));
    };

    const handleDelete = () => {
        if (!confirm('Delete this nest? This action cannot be undone.')) return;
        setDeleting(true);
        deleteNest(nestId)
            .then(() => navigate('/admin/nests'))
            .catch((e) => {
                setError(httpErrorToHuman(e));
                setDeleting(false);
            });
    };

    const handleDeleteEgg = (egg: AdminEgg) => {
        if (!confirm(`Delete egg "${egg.name}"?`)) return;
        deleteEgg(nestId, egg.id)
            .then(() => eggsMutate())
            .catch((e) => setError(httpErrorToHuman(e)));
    };

    const eggs = eggsData?.items || [];

    return (
        <Routes>
            <Route
                index
                element={
                    <div>
                        <MainPageHeader title={nest?.name || 'Nest'} headChildren={
                            <Link to='/admin/nests' className='text-sm text-gray-500 hover:text-gray-300 cursor-pointer'>&larr; Back to Nests</Link>
                        }>
                            <ButtonV2 onClick={handleSave} disabled={saving || deleting}>
                                {saving ? 'Saving...' : 'Save'}
                            </ButtonV2>
                            <ButtonV2 onClick={handleDelete} disabled={saving || deleting} className='!text-red-400 cursor-pointer'>
                                {deleting ? 'Deleting...' : 'Delete'}
                            </ButtonV2>
                        </MainPageHeader>

                        {(error || nestError) && <div className='text-red-400 mb-4 text-sm'>{error || httpErrorToHuman(nestError)}</div>}
                        {success && <div className='text-green-400 mb-4 text-sm'>Nest updated.</div>}
                        {eggsError && <div className='text-red-400 mb-4 text-sm'>Error loading eggs: {httpErrorToHuman(eggsError)}</div>}

                        {!nest ? <Spinner /> : (
                            <>
                                <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8'>
                                    <div className='bg-[#1a1a1a] border border-gray-800 rounded-lg p-6'>
                                        <h4 className='text-gray-200 font-medium mb-4'>Nest Details</h4>
                                        <div className='mb-4'>
                                            <label className='block text-sm text-gray-400 mb-1'>Name</label>
                                            <input
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                className='w-full bg-transparent border border-gray-700 rounded px-3 py-2 text-gray-200'
                                            />
                                        </div>
                                        <div className='mb-4'>
                                            <label className='block text-sm text-gray-400 mb-1'>Description</label>
                                            <input
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                                className='w-full bg-transparent border border-gray-700 rounded px-3 py-2 text-gray-200'
                                            />
                                        </div>
                                    </div>
                                    <div className='bg-[#1a1a1a] border border-gray-800 rounded-lg p-6'>
                                        <h4 className='text-gray-200 font-medium mb-4'>Nest Info</h4>
                                        <div className='space-y-2 text-sm'>
                                            <div className='flex justify-between'><span className='text-gray-500'>ID</span><span className='text-gray-300'>{nest.id}</span></div>
                                            <div className='flex justify-between'><span className='text-gray-500'>UUID</span><span className='text-gray-300'>{nest.uuid}</span></div>
                                            <div className='flex justify-between'><span className='text-gray-500'>Author</span><span className='text-gray-300'>{nest.author}</span></div>
                                            <div className='flex justify-between'><span className='text-gray-500'>Eggs</span><span className='text-gray-300'>{eggs.length}</span></div>
                                            <div className='flex justify-between'><span className='text-gray-500'>Servers</span><span className='text-gray-300'>{nest.serversCount}</span></div>
                                        </div>
                                    </div>
                                </div>

                                <div className='bg-[#1a1a1a] border border-gray-800 rounded-lg p-6'>
                                    <div className='flex items-center justify-between mb-4'>
                                        <h4 className='text-gray-200 font-medium'>Nest Eggs ({eggs.length})</h4>
                                    </div>
                                    {eggs.length === 0 ? (
                                        <p className='text-gray-500 text-sm'>No eggs in this nest.</p>
                                    ) : (
                                        <div className='overflow-x-auto'>
                                            <table className='w-full text-sm'>
                                                <thead>
                                                    <tr className='text-gray-500 border-b border-gray-800'>
                                                        <th className='text-left py-2 pr-4'>ID</th>
                                                        <th className='text-left py-2 pr-4'>Name</th>
                                                        <th className='text-left py-2 pr-4 hidden md:table-cell'>Description</th>
                                                        <th className='text-right py-2'>Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {eggs.map((egg) => (
                                                        <tr key={egg.id} className='border-b border-gray-800/50 hover:bg-[#ffffff05]'>
                                                    <td className='py-2 pr-4 text-gray-500 cursor-default'>{egg.id}</td>
                                                             <td className='py-2 pr-4'>
                                                                 <Link to={`eggs/${egg.id}`} className='text-gray-200 hover:text-gray-100 cursor-pointer'>
                                                                     {egg.name}
                                                                 </Link>
                                                             </td>
                                                             <td className='py-2 pr-4 text-gray-500 hidden md:table-cell cursor-default'>{egg.description || '-'}</td>
                                                             <td className='py-2 text-right'>
                                                                 <button
                                                                     onClick={() => handleDeleteEgg(egg)}
                                                                     className='text-red-400 hover:text-red-300 cursor-pointer p-1'
                                                                     title='Delete egg'
                                                                 >
                                                                     <TrashBin fill='currentColor' className='w-4 h-4' />
                                                                 </button>
                                                             </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                }
            />
            <Route path='eggs/:eggId/*' element={<AdminEggViewContainer />} />
        </Routes>
    );
};

export default AdminNestViewContainer;
