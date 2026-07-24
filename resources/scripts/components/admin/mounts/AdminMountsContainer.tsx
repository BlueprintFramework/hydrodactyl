import { Delete02Icon, Edit02Icon, InformationCircleIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
                        <MainPageHeader
                            title='Mounts'
                            titleChildren={
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <button
                                                type='button'
                                                className='text-mocha-100/60 hover:text-cream-400 transition-colors cursor-pointer -ml-2'
                                            >
                                                <HugeiconsIcon icon={InformationCircleIcon} size={18} />
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent
                                            side='bottom'
                                            className='rounded-lg max-w-[280px] whitespace-normal text-center'
                                        >
                                            Mounts let you map host directories or Docker volumes into game server
                                            containers, providing persistent storage or shared data access.
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            }
                        >
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
                                                                        className='inline-flex items-center justify-center h-8 w-8 rounded-lg text-mocha-100 hover:text-cream-400 hover:bg-mocha-400/40 transition-colors'
                                                                        title='View'
                                                                    >
                                                                        <HugeiconsIcon icon={Edit02Icon} size={16} />
                                                                    </Link>
                                                                    <Button
                                                                        variant='attention'
                                                                        size='sm'
                                                                        onClick={() => handleDelete(mount.id)}
                                                                        title='Delete'
                                                                        className='h-8 w-8 p-0 flex items-center justify-center'
                                                                    >
                                                                        <HugeiconsIcon icon={Delete02Icon} size={16} />
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
