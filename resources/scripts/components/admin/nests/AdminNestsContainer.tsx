import { useState } from 'react';
import { Link, Route, Routes } from 'react-router-dom';
import useSWR from 'swr';
import { CubeIcon } from '@hugeicons/core-free-icons';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import Spinner from '@/components/elements/Spinner';
import Pagination from '@/components/elements/Pagination';
import ButtonV2 from '@/components/elements/ButtonV2';
import { getNests, createNest, type AdminNest, type CreateNestData } from '@/api/admin/nests';
import { httpErrorToHuman } from '@/api/http';
import AdminNestViewContainer from '@/components/admin/nests/AdminNestViewContainer';

const AdminNestsContainer = () => {
    const [page, setPage] = useState(1);
    const { data, error, mutate } = useSWR(['admin:nests', page], () => getNests({ page }));

    const [showCreate, setShowCreate] = useState(false);
    const [createName, setCreateName] = useState('');
    const [createDesc, setCreateDesc] = useState('');
    const [saving, setSaving] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);

    const handleCreate = () => {
        setCreateError(null);
        setSaving(true);
        createNest({ name: createName, description: createDesc || undefined } as CreateNestData)
            .then(() => {
                setShowCreate(false);
                setCreateName('');
                setCreateDesc('');
                mutate();
            })
            .catch((e) => setCreateError(httpErrorToHuman(e)))
            .finally(() => setSaving(false));
    };

    if (showCreate) {
        return (
            <div>
                <MainPageHeader title='Create Nest'>
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
                        <label className='block text-sm text-gray-400 mb-1'>Description</label>
                        <input
                            value={createDesc}
                            onChange={(e) => setCreateDesc(e.target.value)}
                            className='w-full bg-transparent border border-gray-700 rounded px-3 py-2 text-gray-200'
                        />
                    </div>
                    <ButtonV2 onClick={handleCreate} disabled={saving || !createName}>
                        {saving ? 'Creating...' : 'Create Nest'}
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
                        <MainPageHeader title='Nests'>
                            <ButtonV2 onClick={() => setShowCreate(true)}>New Nest</ButtonV2>
                        </MainPageHeader>

                        {error && <div className='text-red-400 mb-4'>Error: {httpErrorToHuman(error)}</div>}

                        {!data ? (
                            <Spinner />
                        ) : (
                            <Pagination data={data} onPageSelect={setPage}>
                                {({ items }) => (
                                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                                        {items.length === 0 ? (
                                            <div className='col-span-full text-center py-8 text-gray-500'>
                                                No nests found.
                                            </div>
                                        ) : (
                                            items.map((nest: AdminNest) => (
                                                <Link
                                                    key={nest.id}
                                                    to={String(nest.id)}
                                                    className='block bg-[#1a1a1a] border border-gray-800 rounded-lg p-5 hover:border-gray-600 transition-colors cursor-pointer group'
                                                >
                                                    <div className='flex items-start justify-between mb-4'>
                                                        <div className='flex items-center gap-3'>
                                                            <div className='w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0'>
                                                                <CubeIcon className='w-5 h-5 text-blue-400' />
                                                            </div>
                                                            <div>
                                                                <h3 className='text-gray-200 font-semibold group-hover:text-white transition-colors'>{nest.name}</h3>
                                                                <p className='text-xs text-gray-600 mt-0.5'>{nest.description || 'No description'}</p>
                                                            </div>
                                                        </div>
                                                        <span className='text-xs text-gray-600 font-mono'>#{nest.id}</span>
                                                    </div>
                                                    <div className='grid grid-cols-2 gap-3'>
                                                        <div className='bg-white/[0.03] rounded-lg p-3 border border-gray-800/50'>
                                                            <div className='text-lg font-bold text-gray-100'>{nest.eggsCount}</div>
                                                            <div className='text-xs text-gray-500'>eggs</div>
                                                        </div>
                                                        <div className='bg-white/[0.03] rounded-lg p-3 border border-gray-800/50'>
                                                            <div className='text-lg font-bold text-gray-100'>{nest.serversCount}</div>
                                                            <div className='text-xs text-gray-500'>servers</div>
                                                        </div>
                                                    </div>
                                                </Link>
                                            ))
                                        )}
                                    </div>
                                )}
                            </Pagination>
                        )}
                    </div>
                }
            />
            <Route path=':id/*' element={<AdminNestViewContainer />} />
        </Routes>
    );
};

export default AdminNestsContainer;
