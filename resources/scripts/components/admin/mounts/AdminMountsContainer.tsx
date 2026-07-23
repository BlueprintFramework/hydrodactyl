import { useState } from 'react';
import { Link, Route, Routes } from 'react-router-dom';
import useSWR from 'swr';
import { type AdminMount, type CreateMountData, createMount, deleteMount, getMounts } from '@/api/admin/mounts';
import { httpErrorToHuman } from '@/api/http';
import AdminMountViewContainer from '@/components/admin/mounts/AdminMountViewContainer';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import Pagination from '@/components/elements/Pagination';
import Spinner from '@/components/elements/Spinner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

const AdminMountsContainer = () => {
    const [page, setPage] = useState(1);
    const { data, error, mutate } = useSWR(['admin:mounts', page], () => getMounts({ page }));

    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState<CreateMountData>({ name: '', source: '', target: '' });
    const [saving, setSaving] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);

    const handleCreate = () => {
        setCreateError(null);
        setSaving(true);
        createMount(form)
            .then(() => {
                setShowCreate(false);
                setForm({ name: '', source: '', target: '' });
                mutate();
            })
            .catch((e) => setCreateError(httpErrorToHuman(e)))
            .finally(() => setSaving(false));
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Delete this mount?')) return;
        try {
            await deleteMount(id);
            mutate();
        } catch (e: unknown) {
            alert(httpErrorToHuman(e));
        }
    };

    if (showCreate) {
        return (
            <div>
                <MainPageHeader title='Create Mount'>
                    <Button variant='secondary' onClick={() => setShowCreate(false)}>
                        Back
                    </Button>
                </MainPageHeader>
                {createError && <div className='text-red-400 mb-4 text-sm'>{createError}</div>}
                <div className='bg-mocha-500 border border-mocha-400 rounded-lg p-6 max-w-lg'>
                    <div className='mb-4'>
                        <label htmlFor='mount-name' className='block text-sm text-mocha-200 mb-1'>
                            Name
                        </label>
                        <input
                            id='mount-name'
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className='w-full bg-mocha-600 border border-mocha-400 rounded px-3 py-2 text-sm text-cream-400'
                        />
                    </div>
                    <div className='mb-4'>
                        <label htmlFor='mount-source' className='block text-sm text-mocha-200 mb-1'>
                            Source
                        </label>
                        <input
                            id='mount-source'
                            value={form.source}
                            onChange={(e) => setForm({ ...form, source: e.target.value })}
                            className='w-full bg-mocha-600 border border-mocha-400 rounded px-3 py-2 text-sm text-cream-400'
                            placeholder='/container/data'
                        />
                    </div>
                    <div className='mb-4'>
                        <label htmlFor='mount-target' className='block text-sm text-mocha-200 mb-1'>
                            Target
                        </label>
                        <input
                            id='mount-target'
                            value={form.target}
                            onChange={(e) => setForm({ ...form, target: e.target.value })}
                            className='w-full bg-mocha-600 border border-mocha-400 rounded px-3 py-2 text-sm text-cream-400'
                            placeholder='/mnt/server/data'
                        />
                    </div>
                    <div className='flex gap-4 mb-4'>
                        <Checkbox
                            checked={form.read_only ?? false}
                            onChange={(e) => setForm({ ...form, read_only: e.target.checked })}
                            label='Read Only'
                        />
                        <Checkbox
                            checked={form.user_mountable ?? false}
                            onChange={(e) => setForm({ ...form, user_mountable: e.target.checked })}
                            label='User Mountable'
                        />
                    </div>
                    <Button
                        variant='default'
                        onClick={handleCreate}
                        disabled={saving || !form.name || !form.source || !form.target}
                    >
                        {saving ? 'Creating...' : 'Create Mount'}
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
                        <MainPageHeader title='Mounts'>
                            <Button variant='default' onClick={() => setShowCreate(true)}>
                                New Mount
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
                                                        Name
                                                    </th>
                                                    <th className='text-left px-4 py-3 text-mocha-200 font-medium'>
                                                        Source
                                                    </th>
                                                    <th className='text-left px-4 py-3 text-mocha-200 font-medium'>
                                                        Target
                                                    </th>
                                                    <th className='text-left px-4 py-3 text-mocha-200 font-medium'>
                                                        Read Only
                                                    </th>
                                                    <th className='text-left px-4 py-3 text-mocha-200 font-medium'>
                                                        User Mountable
                                                    </th>
                                                    <th className='text-right px-4 py-3 text-mocha-200 font-medium'>
                                                        Actions
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {items.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={6} className='text-center py-8 text-mocha-200'>
                                                            No mounts found.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    items.map((mount: AdminMount) => (
                                                        <tr
                                                            key={mount.id}
                                                            className='border-b border-mocha-400 last:border-0 hover:bg-mocha-400/20'
                                                        >
                                                            <td className='px-4 py-3'>
                                                                <Link
                                                                    to={String(mount.id)}
                                                                    className='text-cream-400 font-medium hover:text-cream-200'
                                                                >
                                                                    {mount.name}
                                                                </Link>
                                                            </td>
                                                            <td className='px-4 py-3'>
                                                                <code className='text-cream-400 text-xs'>
                                                                    {mount.source}
                                                                </code>
                                                            </td>
                                                            <td className='px-4 py-3'>
                                                                <code className='text-cream-400 text-xs'>
                                                                    {mount.target}
                                                                </code>
                                                            </td>
                                                            <td className='px-4 py-3'>
                                                                {mount.readOnly ? (
                                                                    <span className='text-yellow-400 text-xs'>Yes</span>
                                                                ) : (
                                                                    <span className='text-mocha-200/60 text-xs'>
                                                                        No
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className='px-4 py-3'>
                                                                {mount.userMountable ? (
                                                                    <span className='text-green-400 text-xs'>Yes</span>
                                                                ) : (
                                                                    <span className='text-mocha-200/60 text-xs'>
                                                                        No
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className='px-4 py-3 text-right'>
                                                                <div className='flex items-center justify-end gap-2'>
                                                                    <Link
                                                                        to={String(mount.id)}
                                                                        className='text-xs text-cream-400 hover:text-cream-500'
                                                                    >
                                                                        View
                                                                    </Link>
                                                                    <Button
                                                                        variant='attention'
                                                                        onClick={() => handleDelete(mount.id)}
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
                    </div>
                }
            />
            <Route path=':id/*' element={<AdminMountViewContainer />} />
        </Routes>
    );
};

export default AdminMountsContainer;
