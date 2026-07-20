import { useState } from 'react';
import { Link, Route, Routes, useParams, useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import { TrashBin } from '@gravity-ui/icons';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import Spinner from '@/components/elements/Spinner';
import { Button } from '@/components/ui/button';
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
                            <Link to='/admin/nests' className='text-sm text-mocha-200 hover:text-mocha-100 cursor-pointer'>&larr; Back to Nests</Link>
                        }>
                            <Button variant='default' onClick={handleSave} disabled={saving || deleting}>
                                {saving ? 'Saving...' : 'Save'}
                            </Button>
                            <Button variant='attention' onClick={handleDelete} disabled={saving || deleting}>
                                {deleting ? 'Deleting...' : 'Delete'}
                            </Button>
                        </MainPageHeader>

                        {(error || nestError) && <div className='text-red-400 mb-4 text-sm'>{error || httpErrorToHuman(nestError)}</div>}
                        {success && <div className='text-green-400 mb-4 text-sm'>Nest updated.</div>}
                        {eggsError && <div className='text-red-400 mb-4 text-sm'>Error loading eggs: {httpErrorToHuman(eggsError)}</div>}

                        {!nest ? <Spinner /> : (
                            <>
                                <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8'>
                                    <div className='bg-mocha-500 border border-mocha-400 rounded-lg p-6'>
                                        <h4 className='text-cream-400 font-medium mb-4'>Nest Details</h4>
                                        <div className='mb-4'>
                                            <label className='block text-sm text-mocha-200 mb-1'>Name</label>
                                            <input
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                className='w-full bg-transparent border border-mocha-400 rounded px-3 py-2 text-cream-400'
                                            />
                                        </div>
                                        <div className='mb-4'>
                                            <label className='block text-sm text-mocha-200 mb-1'>Description</label>
                                            <input
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                                className='w-full bg-transparent border border-mocha-400 rounded px-3 py-2 text-cream-400'
                                            />
                                        </div>
                                    </div>
                                    <div className='bg-mocha-500 border border-mocha-400 rounded-lg p-6'>
                                        <h4 className='text-cream-400 font-medium mb-4'>Nest Info</h4>
                                        <div className='space-y-2 text-sm'>
                                            <div className='flex justify-between'><span className='text-mocha-200'>ID</span><span className='text-mocha-100'>{nest.id}</span></div>
                                            <div className='flex justify-between'><span className='text-mocha-200'>UUID</span><span className='text-mocha-100'>{nest.uuid}</span></div>
                                            <div className='flex justify-between'><span className='text-mocha-200'>Author</span><span className='text-mocha-100'>{nest.author}</span></div>
                                            <div className='flex justify-between'><span className='text-mocha-200'>Eggs</span><span className='text-mocha-100'>{eggs.length}</span></div>
                                            <div className='flex justify-between'><span className='text-mocha-200'>Servers</span><span className='text-mocha-100'>{nest.serversCount}</span></div>
                                        </div>
                                    </div>
                                </div>

                                <div className='bg-mocha-500 border border-mocha-400 rounded-lg p-6'>
                                    <div className='flex items-center justify-between mb-4'>
                                        <h4 className='text-cream-400 font-medium'>Nest Eggs ({eggs.length})</h4>
                                    </div>
                                    {eggs.length === 0 ? (
                                        <p className='text-mocha-200 text-sm'>No eggs in this nest.</p>
                                    ) : (
                                        <div className='overflow-x-auto'>
                                            <table className='w-full text-sm'>
                                                <thead>
                                                    <tr className='text-mocha-200 border-b border-mocha-400'>
                                                        <th className='text-left py-2 pr-4'>ID</th>
                                                        <th className='text-left py-2 pr-4'>Name</th>
                                                        <th className='text-left py-2 pr-4 hidden md:table-cell'>Description</th>
                                                        <th className='text-right py-2'>Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {eggs.map((egg) => (
                                                        <tr key={egg.id} className='border-b border-mocha-400/50 hover:bg-mocha-400/20'>
                                                    <td className='py-2 pr-4 text-mocha-200 cursor-default'>{egg.id}</td>
                                                             <td className='py-2 pr-4'>
                                                                 <Link to={`eggs/${egg.id}`} className='text-cream-400 hover:text-cream-200 cursor-pointer'>
                                                                     {egg.name}
                                                                 </Link>
                                                             </td>
                                                             <td className='py-2 pr-4 text-mocha-200 hidden md:table-cell cursor-default'>{egg.description || '-'}</td>
                                                             <td className='py-2 text-right'>
                                                                  <Button variant='attention' size='sm' onClick={() => handleDeleteEgg(egg)} title='Delete egg'><TrashBin fill='currentColor' className='w-4 h-4' /></Button>
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
