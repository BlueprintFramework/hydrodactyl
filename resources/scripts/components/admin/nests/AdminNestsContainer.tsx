import { CubeIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useState } from 'react';
import { Link, Route, Routes } from 'react-router-dom';
import { toast } from 'sonner';
import useSWR from 'swr';
import { type AdminNest, type CreateNestData, createNest, deleteNest, getNests } from '@/api/admin/nests';
import { httpErrorToHuman } from '@/api/http';
import AdminNestViewContainer from '@/components/admin/nests/AdminNestViewContainer';
import { Dialog } from '@/components/elements/dialog';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import Pagination from '@/components/elements/Pagination';
import Spinner from '@/components/elements/Spinner';
import { Button } from '@/components/ui/button';

const inputClass =
    'w-full bg-mocha-600 border border-mocha-400 rounded px-3 py-2 text-sm text-cream-400 focus:outline-none focus:border-mocha-300 transition-colors';
const labelClass = 'block text-sm text-mocha-200 mb-1';

const CreateNestModal = ({
    open,
    onClose,
    onCreated,
}: {
    open: boolean;
    onClose: () => void;
    onCreated: () => void;
}) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCreate = () => {
        setError(null);
        setSaving(true);
        createNest({ name, description: description || undefined } as CreateNestData)
            .then(() => {
                setName('');
                setDescription('');
                onCreated();
                onClose();
                toast.success('Nest created successfully');
            })
            .catch((e) => {
                setError(httpErrorToHuman(e));
                toast.error(httpErrorToHuman(e));
            })
            .finally(() => setSaving(false));
    };

    return (
        <Dialog open={open} onClose={onClose} title='Create Nest'>
            {error && (
                <div className='text-red-400 mb-4 text-sm bg-red-950/20 border border-red-800/40 rounded-lg p-3 mx-6 mt-4'>
                    {error}
                </div>
            )}
            <div className='space-y-4 px-6 pt-2'>
                <div>
                    <label htmlFor='nest-name' className={labelClass}>
                        Name *
                    </label>
                    <input
                        id='nest-name'
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className={inputClass}
                        placeholder='My New Nest'
                    />
                </div>
                <div>
                    <label htmlFor='nest-description' className={labelClass}>
                        Description
                    </label>
                    <input
                        id='nest-description'
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className={inputClass}
                        placeholder='Optional description'
                    />
                </div>
            </div>
            <Dialog.Footer>
                <div className='flex items-center justify-end gap-3 p-6 border-t border-mocha-400/30'>
                    <Button variant='secondary' onClick={onClose}>
                        Cancel
                    </Button>
                    <Button variant='default' onClick={handleCreate} disabled={saving || !name}>
                        {saving ? 'Creating...' : 'Create Nest'}
                    </Button>
                </div>
            </Dialog.Footer>
        </Dialog>
    );
};

const AdminNestsContainer = () => {
    const [page, setPage] = useState(1);
    const [showCreate, setShowCreate] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState<AdminNest | null>(null);
    const [deleting, setDeleting] = useState(false);
    const { data, error, mutate } = useSWR(['admin:nests', page], () => getNests({ page }));

    const handleDelete = () => {
        if (!confirmDelete) return;
        setDeleting(true);
        deleteNest(confirmDelete.id)
            .then(() => {
                toast.success(`Nest "${confirmDelete.name}" deleted`);
                setConfirmDelete(null);
                mutate();
            })
            .catch((e) => toast.error(httpErrorToHuman(e)))
            .finally(() => setDeleting(false));
    };

    return (
        <Routes>
            <Route
                index
                element={
                    <div>
                        <MainPageHeader title='Nests'>
                            <Button variant='default' onClick={() => setShowCreate(true)}>
                                Create Nest
                            </Button>
                        </MainPageHeader>

                        {error && (
                            <div className='text-red-400 mb-4 bg-red-950/20 border border-red-800/40 rounded-lg p-3'>
                                Error: {httpErrorToHuman(error)}
                            </div>
                        )}

                        {!data ? (
                            <Spinner />
                        ) : (
                            <Pagination data={data} onPageSelect={setPage}>
                                {({ items }) => (
                                    <div className='bg-mocha-500 border border-mocha-400 rounded-xl overflow-hidden shadow-sm'>
                                        <table className='w-full text-sm border-collapse'>
                                            <thead>
                                                <tr className='border-b border-mocha-400/80 bg-mocha-600/20'>
                                                    <th className='text-left px-5 py-4 text-mocha-200 font-semibold tracking-wide uppercase text-xs'>
                                                        Name
                                                    </th>
                                                    <th className='text-left px-5 py-4 text-mocha-200 font-semibold tracking-wide uppercase text-xs hidden md:table-cell'>
                                                        Description
                                                    </th>
                                                    <th className='text-left px-5 py-4 text-mocha-200 font-semibold tracking-wide uppercase text-xs hidden lg:table-cell'>
                                                        Author
                                                    </th>
                                                    <th className='text-center px-5 py-4 text-mocha-200 font-semibold tracking-wide uppercase text-xs w-[80px]'>
                                                        Eggs
                                                    </th>
                                                    <th className='text-center px-5 py-4 text-mocha-200 font-semibold tracking-wide uppercase text-xs w-[90px]'>
                                                        Servers
                                                    </th>
                                                    <th className='text-right px-5 py-4 text-mocha-200 font-semibold tracking-wide uppercase text-xs w-[160px]'>
                                                        Actions
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className='divide-y divide-mocha-400/40'>
                                                {items.length === 0 ? (
                                                    <tr>
                                                        <td
                                                            colSpan={6}
                                                            className='text-center py-10 text-mocha-200 font-medium'
                                                        >
                                                            No nests found.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    items.map((nest: AdminNest) => (
                                                        <tr
                                                            key={nest.id}
                                                            className='hover:bg-mocha-400/15 transition-colors'
                                                        >
                                                            <td className='px-5 py-4'>
                                                                <Link
                                                                    to={String(nest.id)}
                                                                    className='text-cream-400 font-semibold hover:text-cream-200 transition-colors flex items-center gap-2'
                                                                >
                                                                    <div className='w-7 h-7 rounded-md border border-mocha-400 overflow-hidden shrink-0 flex items-center justify-center'>
                                                                        {nest.icon ? (
                                                                            <img
                                                                                src={nest.icon}
                                                                                alt={nest.name}
                                                                                className='w-full h-full object-cover'
                                                                            />
                                                                        ) : (
                                                                            <HugeiconsIcon
                                                                                icon={CubeIcon}
                                                                                className='w-4 h-4 text-mocha-200'
                                                                            />
                                                                        )}
                                                                    </div>
                                                                    {nest.name}
                                                                </Link>
                                                            </td>
                                                            <td className='px-5 py-4 text-mocha-100 hidden md:table-cell max-w-[250px] truncate'>
                                                                {nest.description || (
                                                                    <span className='text-mocha-300 italic'>
                                                                        No description
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className='px-5 py-4 text-mocha-100 hidden lg:table-cell'>
                                                                {nest.author}
                                                            </td>
                                                            <td className='px-5 py-4 text-center'>
                                                                <span className='inline-flex items-center justify-center min-w-[24px] h-6 px-2 text-xs font-bold bg-mocha-400/30 text-cream-400 rounded-full'>
                                                                    {nest.eggsCount}
                                                                </span>
                                                            </td>
                                                            <td className='px-5 py-4 text-center'>
                                                                <span className='inline-flex items-center justify-center min-w-[24px] h-6 px-2 text-xs font-bold bg-mocha-400/30 text-cream-400 rounded-full'>
                                                                    {nest.serversCount}
                                                                </span>
                                                            </td>
                                                            <td className='px-5 py-4 text-right'>
                                                                <div className='flex items-center justify-end gap-3'>
                                                                    <Link
                                                                        to={String(nest.id)}
                                                                        className='text-xs font-semibold text-cream-400 hover:text-cream-200 transition-colors'
                                                                    >
                                                                        Configure
                                                                    </Link>
                                                                    <Button
                                                                        variant='attention'
                                                                        size='sm'
                                                                        onClick={() => setConfirmDelete(nest)}
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

                        <CreateNestModal
                            open={showCreate}
                            onClose={() => setShowCreate(false)}
                            onCreated={() => mutate()}
                        />

                        <Dialog.Confirm
                            open={confirmDelete !== null}
                            onClose={() => setConfirmDelete(null)}
                            onConfirmed={handleDelete}
                            title='Delete Nest'
                            confirm='Delete'
                            loading={deleting}
                        >
                            Are you sure you want to permanently delete <strong>{confirmDelete?.name}</strong>? All eggs
                            in this nest will also be deleted. This action cannot be undone.
                        </Dialog.Confirm>
                    </div>
                }
            />
            <Route path=':id/*' element={<AdminNestViewContainer />} />
        </Routes>
    );
};

export default AdminNestsContainer;
