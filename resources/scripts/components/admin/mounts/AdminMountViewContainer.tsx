import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useSWR from 'swr';
import { deleteMount, getMount, updateMount } from '@/api/admin/mounts';
import { httpErrorToHuman } from '@/api/http';
import ButtonV2 from '@/components/elements/ButtonV2';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import Spinner from '@/components/elements/Spinner';

const AdminMountViewContainer = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const mountId = Number(id);

    const {
        data: mount,
        error: mountError,
        mutate: mountMutate,
    } = useSWR(['admin:mount', mountId], () => getMount(mountId));

    const [form, setForm] = useState({
        name: '',
        description: '',
        source: '',
        target: '',
        read_only: false,
        user_mountable: false,
    });
    const [initialized, setInitialized] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    if (mount && !initialized) {
        setForm({
            name: mount.name,
            description: mount.description || '',
            source: mount.source,
            target: mount.target,
            read_only: mount.readOnly,
            user_mountable: mount.userMountable,
        });
        setInitialized(true);
    }

    const handleSave = () => {
        setError(null);
        setSuccess(false);
        setSaving(true);
        updateMount(mountId, {
            name: form.name,
            description: form.description || null,
            source: form.source,
            target: form.target,
            read_only: form.read_only,
            user_mountable: form.user_mountable,
        })
            .then(() => {
                setSuccess(true);
                mountMutate();
                setTimeout(() => setSuccess(false), 3000);
            })
            .catch((e) => setError(httpErrorToHuman(e)))
            .finally(() => setSaving(false));
    };

    const handleDelete = () => {
        if (!confirm('Delete this mount? This action cannot be undone.')) return;
        setDeleting(true);
        deleteMount(mountId)
            .then(() => navigate(-1))
            .catch((e) => {
                setError(httpErrorToHuman(e));
                setDeleting(false);
            });
    };

    if (!mount) {
        return (
            <div className='p-4'>
                {mountError ? <div className='text-red-400'>{httpErrorToHuman(mountError)}</div> : <Spinner />}
            </div>
        );
    }

    return (
        <div>
            <MainPageHeader title={mount.name}>
                <ButtonV2 onClick={handleSave} disabled={saving || deleting}>
                    {saving ? 'Saving...' : 'Save'}
                </ButtonV2>
            </MainPageHeader>

            {(error || mountError) && (
                <div className='text-red-400 mb-4 text-sm'>{error || httpErrorToHuman(mountError)}</div>
            )}
            {success && <div className='text-green-400 mb-4 text-sm'>Mount updated successfully.</div>}

            <div className='bg-[#1a1a1a] border border-gray-800 rounded-lg p-6 max-w-lg mb-8'>
                <h4 className='text-gray-200 font-medium mb-4'>Mount Details</h4>
                <div className='mb-4'>
                    <label className='block text-sm text-gray-400 mb-1'>Name</label>
                    <input
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className='w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200'
                    />
                </div>
                <div className='mb-4'>
                    <label className='block text-sm text-gray-400 mb-1'>Description</label>
                    <input
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
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
                            checked={form.read_only}
                            onChange={(e) => setForm({ ...form, read_only: e.target.checked })}
                            className='rounded border-gray-700'
                        />
                        Read Only
                    </label>
                    <label className='flex items-center gap-2 text-sm text-gray-400'>
                        <input
                            type='checkbox'
                            checked={form.user_mountable}
                            onChange={(e) => setForm({ ...form, user_mountable: e.target.checked })}
                            className='rounded border-gray-700'
                        />
                        User Mountable
                    </label>
                </div>
            </div>

            <div className='bg-[#1a1a1a] border border-red-800 rounded-lg p-6 max-w-lg'>
                <h4 className='text-red-400 font-medium mb-2'>Danger Zone</h4>
                <p className='text-sm text-gray-500 mb-4'>Permanently delete this mount. This cannot be undone.</p>
                <ButtonV2
                    onClick={handleDelete}
                    disabled={saving || deleting}
                    className='!bg-red-900/50 !border-red-700 !text-red-400 hover:!bg-red-900/80'
                >
                    {deleting ? 'Deleting...' : 'Delete Mount'}
                </ButtonV2>
            </div>
        </div>
    );
};

export default AdminMountViewContainer;
