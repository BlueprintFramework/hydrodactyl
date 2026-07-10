import { useState } from 'react';
import { Link, Route, Routes } from 'react-router-dom';
import useSWR from 'swr';
import { type AdminMount, type CreateMountData, createMount, deleteMount, getMounts } from '@/api/admin/mounts';
import { httpErrorToHuman } from '@/api/http';
import AdminMountViewContainer from '@/components/admin/mounts/AdminMountViewContainer';
import ButtonV2 from '@/components/elements/ButtonV2';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import Pagination from '@/components/elements/Pagination';
import Spinner from '@/components/elements/Spinner';

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
        } catch (e: any) {
            alert(httpErrorToHuman(e));
        }
    };

    if (showCreate) {
        return (
            <div>
                <MainPageHeader title='Create Mount'>
                    <ButtonV2 onClick={() => setShowCreate(false)}>Back</ButtonV2>
                </MainPageHeader>
                {createError && <div className='text-red-400 mb-4 text-sm'>{createError}</div>}
                <div className='bg-[#1a1a1a] border border-gray-800 rounded-lg p-6 max-w-lg'>
                    <div className='mb-4'>
                        <label className='block text-sm text-gray-400 mb-1'>Name</label>
                        <input
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className='w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200'
                        />
                    </div>
                    <div className='mb-4'>
                        <label className='block text-sm text-gray-400 mb-1'>Source</label>
                        <input
                            value={form.source}
                            onChange={(e) => setForm({ ...form, source: e.target.value })}
                            className='w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200'
                            placeholder='/container/data'
                        />
                    </div>
                    <div className='mb-4'>
                        <label className='block text-sm text-gray-400 mb-1'>Target</label>
                        <input
                            value={form.target}
                            onChange={(e) => setForm({ ...form, target: e.target.value })}
                            className='w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200'
                            placeholder='/mnt/server/data'
                        />
                    </div>
                    <div className='flex gap-4 mb-4'>
                        <label className='flex items-center gap-2 text-sm text-gray-400'>
                            <input
                                type='checkbox'
                                checked={form.read_only ?? false}
                                onChange={(e) => setForm({ ...form, read_only: e.target.checked })}
                                className='rounded border-gray-700'
                            />
                            Read Only
                        </label>
                        <label className='flex items-center gap-2 text-sm text-gray-400'>
                            <input
                                type='checkbox'
                                checked={form.user_mountable ?? false}
                                onChange={(e) => setForm({ ...form, user_mountable: e.target.checked })}
                                className='rounded border-gray-700'
                            />
                            User Mountable
                        </label>
                    </div>
                    <ButtonV2 onClick={handleCreate} disabled={saving || !form.name || !form.source || !form.target}>
                        {saving ? 'Creating...' : 'Create Mount'}
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
                        <MainPageHeader title='Mounts'>
                            <ButtonV2 onClick={() => setShowCreate(true)}>New Mount</ButtonV2>
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
                                                        Name
                                                    </th>
                                                    <th className='text-left px-4 py-3 text-gray-500 font-medium'>
                                                        Source
                                                    </th>
                                                    <th className='text-left px-4 py-3 text-gray-500 font-medium'>
                                                        Target
                                                    </th>
                                                    <th className='text-left px-4 py-3 text-gray-500 font-medium'>
                                                        Read Only
                                                    </th>
                                                    <th className='text-left px-4 py-3 text-gray-500 font-medium'>
                                                        User Mountable
                                                    </th>
                                                    <th className='text-right px-4 py-3 text-gray-500 font-medium'>
                                                        Actions
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {items.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={6} className='text-center py-8 text-gray-500'>
                                                            No mounts found.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    items.map((mount: AdminMount) => (
                                                        <tr
                                                            key={mount.id}
                                                            className='border-b border-gray-800 last:border-0 hover:bg-white/[0.02]'
                                                        >
                                                            <td className='px-4 py-3'>
                                                                <Link
                                                                    to={String(mount.id)}
                                                                    className='text-gray-200 font-medium hover:text-gray-100'
                                                                >
                                                                    {mount.name}
                                                                </Link>
                                                            </td>
                                                            <td className='px-4 py-3'>
                                                                <code className='text-blue-400 text-xs'>
                                                                    {mount.source}
                                                                </code>
                                                            </td>
                                                            <td className='px-4 py-3'>
                                                                <code className='text-blue-400 text-xs'>
                                                                    {mount.target}
                                                                </code>
                                                            </td>
                                                            <td className='px-4 py-3'>
                                                                {mount.readOnly ? (
                                                                    <span className='text-yellow-400 text-xs'>Yes</span>
                                                                ) : (
                                                                    <span className='text-gray-600 text-xs'>No</span>
                                                                )}
                                                            </td>
                                                            <td className='px-4 py-3'>
                                                                {mount.userMountable ? (
                                                                    <span className='text-green-400 text-xs'>Yes</span>
                                                                ) : (
                                                                    <span className='text-gray-600 text-xs'>No</span>
                                                                )}
                                                            </td>
                                                            <td className='px-4 py-3 text-right'>
                                                                <div className='flex items-center justify-end gap-2'>
                                                                    <Link
                                                                        to={String(mount.id)}
                                                                        className='text-xs text-blue-400 hover:text-blue-300'
                                                                    >
                                                                        View
                                                                    </Link>
                                                                    <button
                                                                        onClick={() => handleDelete(mount.id)}
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
            <Route path=':id/*' element={<AdminMountViewContainer />} />
        </Routes>
    );
};

export default AdminMountsContainer;
