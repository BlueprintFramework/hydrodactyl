import { useState } from 'react';
import { Link, Route, Routes } from 'react-router-dom';
import useSWR from 'swr';
import { CubeIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import Spinner from '@/components/elements/Spinner';
import Pagination from '@/components/elements/Pagination';
import { Button } from '@/components/ui/button';
import { getNests, createNest, type AdminNest, type CreateNestData } from '@/api/admin/nests';
import { httpErrorToHuman } from '@/api/http';
import AdminNestViewContainer from '@/components/admin/nests/AdminNestViewContainer';

const AdminNestsContainer = () => {
    const [page, setPage] = useState(1);
    const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
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
                    <Button variant='secondary' onClick={() => setShowCreate(false)}>Back</Button>
                </MainPageHeader>
                {createError && <div className='text-red-400 mb-4 text-sm'>{createError}</div>}
                <div className='bg-mocha-500 border border-mocha-400 rounded-lg p-6 max-w-lg'>
                    <div className='mb-4'>
                        <label className='block text-sm text-mocha-200 mb-1'>Name</label>
                        <input
                            value={createName}
                            onChange={(e) => setCreateName(e.target.value)}
                            className='w-full bg-transparent border border-mocha-400 rounded px-3 py-2 text-cream-400'
                        />
                    </div>
                    <div className='mb-4'>
                        <label className='block text-sm text-mocha-200 mb-1'>Description</label>
                        <input
                            value={createDesc}
                            onChange={(e) => setCreateDesc(e.target.value)}
                            className='w-full bg-transparent border border-mocha-400 rounded px-3 py-2 text-cream-400'
                        />
                    </div>
                    <Button variant='default' onClick={handleCreate} disabled={saving || !createName}>
                        {saving ? 'Creating...' : 'Create Nest'}
                    </Button>
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
                            <div className='flex items-center gap-2'>
                                <div className='flex items-center bg-mocha-600 rounded-lg p-1'>
                                    <Button variant={viewMode === 'cards' ? 'default' : 'secondary'} size='sm' onClick={() => setViewMode('cards')} title='Card view'>▦</Button>
                                    <Button variant={viewMode === 'table' ? 'default' : 'secondary'} size='sm' onClick={() => setViewMode('table')} title='Table view'>☰</Button>
                                </div>
                                <Button variant='default' onClick={() => setShowCreate(true)}>New Nest</Button>
                            </div>
                        </MainPageHeader>

                        {error && <div className='text-red-400 mb-4'>Error: {httpErrorToHuman(error)}</div>}

                        {!data ? (
                            <Spinner />
                        ) : (
                            <Pagination data={data} onPageSelect={setPage}>
                                {({ items }) => (
                                    <>
                                        {items.length === 0 ? (
                                            <div className='text-center py-8 text-mocha-200'>
                                                No nests found.
                                            </div>
                                        ) : viewMode === 'cards' ? (
                                            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                                                {items.map((nest: AdminNest) => (
                                                    <Link
                                                        key={nest.id}
                                                        to={String(nest.id)}
                                                        className='block bg-mocha-500 border border-mocha-400 rounded-lg p-5 hover:border-mocha-400 transition-colors cursor-pointer group'
                                                    >
                                                        <div className='flex items-start justify-between mb-4'>
                                                            <div className='flex items-center gap-3'>
                                                                <div className='w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center shrink-0'>
                                                                    <HugeiconsIcon icon={CubeIcon} className='w-5 h-5 text-cream-400' />
                                                                </div>
                                                                <div>
                                                                    <h3 className='text-cream-400 font-semibold group-hover:text-cream-500 transition-colors'>{nest.name}</h3>
                                                                    <p className='text-xs text-mocha-200/60 mt-0.5'>{nest.description || 'No description'}</p>
                                                                </div>
                                                            </div>
                                                            <span className='text-xs text-mocha-200/60 font-mono'>#{nest.id}</span>
                                                        </div>
                                                        <div className='grid grid-cols-2 gap-3'>
                                                            <div className='bg-mocha-400/20 rounded-lg p-3 border border-mocha-400/50'>
                                                                <div className='text-lg font-bold text-cream-200'>{nest.eggsCount}</div>
                                                                <div className='text-xs text-mocha-200'>eggs</div>
                                                            </div>
                                                            <div className='bg-mocha-400/20 rounded-lg p-3 border border-mocha-400/50'>
                                                                <div className='text-lg font-bold text-cream-200'>{nest.serversCount}</div>
                                                                <div className='text-xs text-mocha-200'>servers</div>
                                                            </div>
                                                        </div>
                                                    </Link>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className='bg-mocha-500 border border-mocha-400 rounded-lg overflow-hidden'>
                                                <table className='w-full text-sm'>
                                                    <thead>
                                                        <tr className='border-b border-mocha-400'>
                                                            <th className='text-left px-4 py-3 text-mocha-200 font-medium'>Name</th>
                                                            <th className='text-left px-4 py-3 text-mocha-200 font-medium'>Description</th>
                                                            <th className='text-center px-4 py-3 text-mocha-200 font-medium'>Eggs</th>
                                                            <th className='text-center px-4 py-3 text-mocha-200 font-medium'>Servers</th>
                                                            <th className='text-right px-4 py-3 text-mocha-200 font-medium'>Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {items.map((nest: AdminNest) => (
                                                            <tr key={nest.id} className='border-b border-mocha-400 last:border-0 hover:bg-mocha-400/20'>
                                                                <td className='px-4 py-3'>
                                                                    <Link to={String(nest.id)} className='text-cream-400 font-medium hover:text-cream-200'>
                                                                        {nest.name}
                                                                    </Link>
                                                                </td>
                                                                <td className='px-4 py-3 text-mocha-100'>{nest.description || '-'}</td>
                                                                <td className='px-4 py-3 text-center text-mocha-100'>{nest.eggsCount}</td>
                                                                <td className='px-4 py-3 text-center text-mocha-100'>{nest.serversCount}</td>
                                                                <td className='px-4 py-3 text-right'>
                                                                    <Link to={String(nest.id)} className='text-xs text-cream-400 hover:text-cream-500'>
                                                                        View
                                                                    </Link>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </>
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
