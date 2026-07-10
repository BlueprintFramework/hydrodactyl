import { useState } from 'react';
import { Link, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import useSWR from 'swr';
import {
    type AdminBucket,
    type CreateBucketData,
    createBucket,
    deleteBucket,
    getBucket,
    getBuckets,
    updateBucket,
} from '@/api/admin/buckets';
import { httpErrorToHuman } from '@/api/http';
import ButtonV2 from '@/components/elements/ButtonV2';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import Pagination from '@/components/elements/Pagination';
import Spinner from '@/components/elements/Spinner';

const AdminBucketView = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const bucketId = Number(id);

    const {
        data: bucket,
        error: bucketError,
        mutate: bucketMutate,
    } = useSWR(['admin:bucket', bucketId], () => getBucket(bucketId));

    const [tab, setTab] = useState<'details' | 'danger'>('details');
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [bucketName, setBucketName] = useState('');
    const [endpoint, setEndpoint] = useState('');
    const [accessKey, setAccessKey] = useState('');
    const [secretKey, setSecretKey] = useState('');
    const [isLocal, setIsLocal] = useState(false);
    const [enabled, setEnabled] = useState(true);
    const [usePathStyleEndpoint, setUsePathStyleEndpoint] = useState(false);
    const [initialized, setInitialized] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    if (bucket && !initialized) {
        setName(bucket.name);
        setDescription(bucket.description || '');
        setBucketName(bucket.bucketName);
        setEndpoint(bucket.endpoint || '');
        setIsLocal(bucket.isLocal);
        setEnabled(bucket.enabled);
        setUsePathStyleEndpoint(bucket.usePathStyleEndpoint);
        setInitialized(true);
    }

    const handleSave = () => {
        setError(null);
        setSuccess(false);
        setSaving(true);

        const data: Partial<CreateBucketData> = {
            name,
            description: description || undefined,
            bucket_name: bucketName,
            endpoint: endpoint || undefined,
            is_local: isLocal,
            enabled,
            use_path_style_endpoint: usePathStyleEndpoint,
        };
        if (accessKey) data.access_key = accessKey;
        if (secretKey) data.secret_key = secretKey;

        updateBucket(bucketId, data)
            .then(() => {
                setSuccess(true);
                bucketMutate();
                setAccessKey('');
                setSecretKey('');
                setTimeout(() => setSuccess(false), 3000);
            })
            .catch((e) => setError(httpErrorToHuman(e)))
            .finally(() => setSaving(false));
    };

    const handleDelete = () => {
        if (!confirm('Delete this bucket? This action cannot be undone.')) return;
        setDeleting(true);
        deleteBucket(bucketId)
            .then(() => navigate('/admin/buckets'))
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
                title={bucket?.name || 'Bucket'}
                headChildren={
                    <Link to='/admin/buckets' className='text-sm text-gray-500 hover:text-gray-300'>
                        &larr; Back to Buckets
                    </Link>
                }
            >
                <ButtonV2 onClick={handleSave} disabled={saving || deleting}>
                    {saving ? 'Saving...' : 'Save'}
                </ButtonV2>
            </MainPageHeader>

            {(error || bucketError) && (
                <div className='text-red-400 mb-4 text-sm'>{error || httpErrorToHuman(bucketError)}</div>
            )}
            {success && <div className='text-green-400 mb-4 text-sm'>Bucket updated.</div>}

            {!bucket ? (
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
                                <label className='block text-sm text-gray-400 mb-1'>Name</label>
                                <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
                            </div>
                            <div className='mb-4'>
                                <label className='block text-sm text-gray-400 mb-1'>Description</label>
                                <input
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className={inputClass}
                                />
                            </div>
                            <div className='mb-4'>
                                <label className='block text-sm text-gray-400 mb-1'>Bucket Name</label>
                                <input
                                    value={bucketName}
                                    onChange={(e) => setBucketName(e.target.value)}
                                    className={inputClass}
                                />
                            </div>
                            <div className='mb-4'>
                                <label className='block text-sm text-gray-400 mb-1'>Endpoint</label>
                                <input
                                    value={endpoint}
                                    onChange={(e) => setEndpoint(e.target.value)}
                                    className={inputClass}
                                />
                            </div>
                            <div className='mb-4'>
                                <label className='block text-sm text-gray-400 mb-1'>
                                    Access Key (empty to keep current)
                                </label>
                                <input
                                    value={accessKey}
                                    onChange={(e) => setAccessKey(e.target.value)}
                                    className={inputClass}
                                    type='password'
                                />
                            </div>
                            <div className='mb-4'>
                                <label className='block text-sm text-gray-400 mb-1'>
                                    Secret Key (empty to keep current)
                                </label>
                                <input
                                    value={secretKey}
                                    onChange={(e) => setSecretKey(e.target.value)}
                                    className={inputClass}
                                    type='password'
                                />
                            </div>
                            <div className='mb-4 flex items-center gap-3'>
                                <input
                                    type='checkbox'
                                    checked={isLocal}
                                    onChange={(e) => setIsLocal(e.target.checked)}
                                    className='rounded border-gray-600 bg-gray-900 text-blue-500 focus:ring-blue-500'
                                />
                                <label className='text-sm text-gray-400'>Is Local</label>
                            </div>
                            <div className='mb-4 flex items-center gap-3'>
                                <input
                                    type='checkbox'
                                    checked={enabled}
                                    onChange={(e) => setEnabled(e.target.checked)}
                                    className='rounded border-gray-600 bg-gray-900 text-blue-500 focus:ring-blue-500'
                                />
                                <label className='text-sm text-gray-400'>Enabled</label>
                            </div>
                            <div className='mb-4 flex items-center gap-3'>
                                <input
                                    type='checkbox'
                                    checked={usePathStyleEndpoint}
                                    onChange={(e) => setUsePathStyleEndpoint(e.target.checked)}
                                    className='rounded border-gray-600 bg-gray-900 text-blue-500 focus:ring-blue-500'
                                />
                                <label className='text-sm text-gray-400'>Use Path Style Endpoint</label>
                            </div>
                        </div>
                    )}

                    {tab === 'danger' && (
                        <div className='bg-[#1a1a1a] border border-red-900/50 rounded-lg p-6 max-w-2xl'>
                            <h4 className='text-red-400 font-medium mb-2'>Delete Bucket</h4>
                            <p className='text-gray-500 text-sm mb-4'>
                                Permanently remove this bucket. This action cannot be undone.
                            </p>
                            <ButtonV2
                                onClick={handleDelete}
                                disabled={deleting}
                                className='!bg-red-600 hover:!bg-red-500'
                            >
                                {deleting ? 'Deleting...' : 'Delete Bucket'}
                            </ButtonV2>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

const AdminBucketsContainer = () => {
    const [page, setPage] = useState(1);
    const { data, error, mutate } = useSWR(['admin:buckets', page], () => getBuckets({ page }));

    const [createName, setCreateName] = useState('');
    const [createDesc, setCreateDesc] = useState('');
    const [createAccessKey, setCreateAccessKey] = useState('');
    const [createSecretKey, setCreateSecretKey] = useState('');
    const [createBucketName, setCreateBucketName] = useState('');
    const [createEndpoint, setCreateEndpoint] = useState('');
    const [createIsLocal, setCreateIsLocal] = useState(false);
    const [createEnabled, setCreateEnabled] = useState(true);
    const [saving, setSaving] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);

    const navigate = useNavigate();

    const handleCreate = () => {
        setCreateError(null);
        setSaving(true);
        const payload: CreateBucketData = {
            name: createName,
            description: createDesc || undefined,
            access_key: createAccessKey,
            secret_key: createSecretKey,
            bucket_name: createBucketName,
            endpoint: createEndpoint || undefined,
            is_local: createIsLocal,
            enabled: createEnabled,
        };
        createBucket(payload)
            .then(() => navigate('/admin/buckets'))
            .catch((e) => {
                setCreateError(httpErrorToHuman(e));
                setSaving(false);
            });
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Delete this bucket?')) return;
        try {
            await deleteBucket(id);
            mutate();
        } catch (e: any) {
            alert(httpErrorToHuman(e));
        }
    };

    const inputClass =
        'w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-gray-200 focus:outline-none focus:border-gray-500';

    return (
        <Routes>
            <Route
                index
                element={
                    <div>
                        <MainPageHeader title='S3 Buckets'>
                            <Link
                                to='new'
                                className='px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded transition-colors'
                            >
                                Add Bucket
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
                                                        Name
                                                    </th>
                                                    <th className='text-left px-4 py-3 text-gray-500 font-medium'>
                                                        Bucket
                                                    </th>
                                                    <th className='text-left px-4 py-3 text-gray-500 font-medium'>
                                                        Endpoint
                                                    </th>
                                                    <th className='text-center px-4 py-3 text-gray-500 font-medium'>
                                                        Local
                                                    </th>
                                                    <th className='text-center px-4 py-3 text-gray-500 font-medium'>
                                                        Enabled
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
                                                            No buckets found.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    items.map((bucket: AdminBucket) => (
                                                        <tr
                                                            key={bucket.id}
                                                            className='border-b border-gray-800 last:border-0 hover:bg-white/[0.02]'
                                                        >
                                                            <td className='px-4 py-3'>
                                                                <Link
                                                                    to={String(bucket.id)}
                                                                    className='text-gray-200 hover:text-white'
                                                                >
                                                                    {bucket.name}
                                                                </Link>
                                                            </td>
                                                            <td className='px-4 py-3'>
                                                                <code className='text-blue-400'>
                                                                    {bucket.bucketName}
                                                                </code>
                                                            </td>
                                                            <td className='px-4 py-3 text-gray-400'>
                                                                {bucket.endpoint || '-'}
                                                            </td>
                                                            <td className='px-4 py-3 text-center'>
                                                                {bucket.isLocal ? (
                                                                    <span className='text-green-400'>Yes</span>
                                                                ) : (
                                                                    <span className='text-gray-600'>No</span>
                                                                )}
                                                            </td>
                                                            <td className='px-4 py-3 text-center'>
                                                                {bucket.enabled ? (
                                                                    <span className='text-green-400'>Yes</span>
                                                                ) : (
                                                                    <span className='text-gray-600'>No</span>
                                                                )}
                                                            </td>
                                                            <td className='px-4 py-3 text-right'>
                                                                <div className='flex items-center justify-end gap-2'>
                                                                    <Link
                                                                        to={String(bucket.id)}
                                                                        className='text-xs text-blue-400 hover:text-blue-300'
                                                                    >
                                                                        View
                                                                    </Link>
                                                                    <button
                                                                        onClick={() => handleDelete(bucket.id)}
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
            <Route
                path='new'
                element={
                    <div>
                        <MainPageHeader
                            title='Create Bucket'
                            headChildren={
                                <Link to='/admin/buckets' className='text-sm text-gray-500 hover:text-gray-300'>
                                    &larr; Back to Buckets
                                </Link>
                            }
                        />
                        {createError && <div className='text-red-400 mb-4 text-sm'>{createError}</div>}
                        <div className='bg-[#1a1a1a] border border-gray-800 rounded-lg p-6 max-w-2xl'>
                            <div className='mb-4'>
                                <label className='block text-sm text-gray-400 mb-1'>Name</label>
                                <input
                                    value={createName}
                                    onChange={(e) => setCreateName(e.target.value)}
                                    className={inputClass}
                                />
                            </div>
                            <div className='mb-4'>
                                <label className='block text-sm text-gray-400 mb-1'>Description</label>
                                <input
                                    value={createDesc}
                                    onChange={(e) => setCreateDesc(e.target.value)}
                                    className={inputClass}
                                />
                            </div>
                            <div className='mb-4'>
                                <label className='block text-sm text-gray-400 mb-1'>Access Key</label>
                                <input
                                    value={createAccessKey}
                                    onChange={(e) => setCreateAccessKey(e.target.value)}
                                    className={inputClass}
                                    type='password'
                                />
                            </div>
                            <div className='mb-4'>
                                <label className='block text-sm text-gray-400 mb-1'>Secret Key</label>
                                <input
                                    value={createSecretKey}
                                    onChange={(e) => setCreateSecretKey(e.target.value)}
                                    className={inputClass}
                                    type='password'
                                />
                            </div>
                            <div className='mb-4'>
                                <label className='block text-sm text-gray-400 mb-1'>Bucket Name</label>
                                <input
                                    value={createBucketName}
                                    onChange={(e) => setCreateBucketName(e.target.value)}
                                    className={inputClass}
                                />
                            </div>
                            <div className='mb-4'>
                                <label className='block text-sm text-gray-400 mb-1'>Endpoint</label>
                                <input
                                    value={createEndpoint}
                                    onChange={(e) => setCreateEndpoint(e.target.value)}
                                    className={inputClass}
                                />
                            </div>
                            <div className='mb-4 flex items-center gap-3'>
                                <input
                                    type='checkbox'
                                    checked={createIsLocal}
                                    onChange={(e) => setCreateIsLocal(e.target.checked)}
                                    className='rounded border-gray-600 bg-gray-900 text-blue-500 focus:ring-blue-500'
                                />
                                <label className='text-sm text-gray-400'>Is Local</label>
                            </div>
                            <div className='mb-4 flex items-center gap-3'>
                                <input
                                    type='checkbox'
                                    checked={createEnabled}
                                    onChange={(e) => setCreateEnabled(e.target.checked)}
                                    className='rounded border-gray-600 bg-gray-900 text-blue-500 focus:ring-blue-500'
                                />
                                <label className='text-sm text-gray-400'>Enabled</label>
                            </div>
                            <ButtonV2
                                onClick={handleCreate}
                                disabled={
                                    saving || !createName || !createAccessKey || !createSecretKey || !createBucketName
                                }
                            >
                                {saving ? 'Creating...' : 'Create Bucket'}
                            </ButtonV2>
                        </div>
                    </div>
                }
            />
            <Route path=':id/*' element={<AdminBucketView />} />
        </Routes>
    );
};

export default AdminBucketsContainer;
