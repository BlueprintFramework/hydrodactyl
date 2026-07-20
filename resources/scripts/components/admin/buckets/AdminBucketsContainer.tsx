import { useState } from 'react';
import { Link, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import useSWR from 'swr';
import { toast } from 'sonner';
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
import { Button } from '@/components/ui/button';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import Pagination from '@/components/elements/Pagination';
import Spinner from '@/components/elements/Spinner';
import { Dialog } from '@/components/elements/dialog';

const inputClass =
    'w-full bg-mocha-600 border border-mocha-400 rounded px-3 py-2 text-sm text-cream-400 focus:outline-none focus:border-mocha-300 transition-colors';
const labelClass = 'block text-sm text-mocha-200 mb-1';

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
                toast.success('Bucket updated successfully');
            })
            .catch((e) => {
                setError(httpErrorToHuman(e));
                toast.error(httpErrorToHuman(e));
            })
            .finally(() => setSaving(false));
    };

    const handleDelete = () => {
        if (!confirm('Delete this bucket? This action cannot be undone.')) return;
        setDeleting(true);
        deleteBucket(bucketId)
            .then(() => {
                navigate('/admin/buckets');
                toast.success('Bucket deleted successfully');
            })
            .catch((e) => {
                setError(httpErrorToHuman(e));
                toast.error(httpErrorToHuman(e));
                setDeleting(false);
            });
    };

    return (
        <div className='space-y-6'>
            <MainPageHeader
                title={bucket?.name || 'Bucket'}
                headChildren={
                    <Link to='/admin/buckets' className='text-sm text-mocha-200 hover:text-mocha-100'>
                        &larr; Back to Buckets
                    </Link>
                }
            >
                <Button variant='default' onClick={handleSave} disabled={saving || deleting}>
                    {saving ? 'Saving...' : 'Save'}
                </Button>
            </MainPageHeader>

            {(error || bucketError) && (
                <div className='text-red-400 mb-4 text-sm'>{error || httpErrorToHuman(bucketError)}</div>
            )}
            {success && <div className='text-green-400 mb-4 text-sm'>Bucket updated.</div>}

            {!bucket ? (
                <Spinner />
            ) : (
                <>
                    <div className='bg-mocha-500 border border-mocha-400 rounded-xl p-6'>
                        <div className='flex items-center gap-3 mb-6'>
                            <div className='w-10 h-10 bg-mocha-400 rounded-lg flex items-center justify-center'>
                                <svg className='w-5 h-5 text-cream-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z' />
                                </svg>
                            </div>
                            <div>
                                <h3 className='text-cream-400 font-semibold text-lg'>Bucket Details</h3>
                                <p className='text-mocha-200 text-sm'>Basic information and configuration</p>
                            </div>
                        </div>

                        <div className='space-y-4'>
                            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                <div>
                                    <label className={labelClass}>Name *</label>
                                    <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>Bucket Name *</label>
                                    <input
                                        value={bucketName}
                                        onChange={(e) => setBucketName(e.target.value)}
                                        className={inputClass}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className={labelClass}>Description</label>
                                <input
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className={inputClass}
                                />
                            </div>

                            <div>
                                <label className={labelClass}>Endpoint (optional)</label>
                                <input
                                    value={endpoint}
                                    onChange={(e) => setEndpoint(e.target.value)}
                                    className={inputClass}
                                    placeholder='https://s3.amazonaws.com'
                                />
                                <p className='text-mocha-200 text-xs mt-1.5'>Leave empty for default S3 endpoint</p>
                            </div>

                            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                <div>
                                    <label className={labelClass}>Access Key (empty to keep current)</label>
                                    <input
                                        value={accessKey}
                                        onChange={(e) => setAccessKey(e.target.value)}
                                        className={inputClass}
                                        type='password'
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Secret Key (empty to keep current)</label>
                                    <input
                                        value={secretKey}
                                        onChange={(e) => setSecretKey(e.target.value)}
                                        className={inputClass}
                                        type='password'
                                    />
                                </div>
                            </div>

                            <div className='flex items-center gap-6 pt-2'>
                                <div className='flex items-center gap-2'>
                                    <input
                                        type='checkbox'
                                        checked={isLocal}
                                        onChange={(e) => setIsLocal(e.target.checked)}
                                        className='rounded border-mocha-400 w-4 h-4'
                                        id='bucket-local'
                                    />
                                    <label htmlFor='bucket-local' className='text-sm text-cream-400 cursor-pointer'>
                                        Self-Hosted (Local)
                                    </label>
                                </div>
                                <div className='flex items-center gap-2'>
                                    <input
                                        type='checkbox'
                                        checked={enabled}
                                        onChange={(e) => setEnabled(e.target.checked)}
                                        className='rounded border-mocha-400 w-4 h-4'
                                        id='bucket-enabled'
                                    />
                                    <label htmlFor='bucket-enabled' className='text-sm text-cream-400 cursor-pointer'>
                                        Enabled
                                    </label>
                                </div>
                                <div className='flex items-center gap-2'>
                                    <input
                                        type='checkbox'
                                        checked={usePathStyleEndpoint}
                                        onChange={(e) => setUsePathStyleEndpoint(e.target.checked)}
                                        className='rounded border-mocha-400 w-4 h-4'
                                        id='bucket-path-style'
                                    />
                                    <label htmlFor='bucket-path-style' className='text-sm text-cream-400 cursor-pointer'>
                                        Path Style Endpoint
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className='bg-mocha-500/50 border border-mocha-400/50 rounded-xl p-6'>
                        <div className='flex items-center gap-3 mb-4'>
                            <div className='w-10 h-10 bg-mocha-400/50 rounded-lg flex items-center justify-center'>
                                <svg className='w-5 h-5 text-mocha-200' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                                </svg>
                            </div>
                            <div>
                                <h3 className='text-mocha-200 font-semibold'>Bucket Information</h3>
                                <p className='text-mocha-300 text-xs'>Read-only system information</p>
                            </div>
                        </div>

                        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                            <div className='bg-mocha-600/30 rounded-lg p-3'>
                                <span className='text-mocha-200 text-xs uppercase tracking-wider'>Bucket ID</span>
                                <p className='text-cream-400 font-mono text-sm mt-1'>#{bucket.id}</p>
                            </div>
                            <div className='bg-mocha-600/30 rounded-lg p-3'>
                                <span className='text-mocha-200 text-xs uppercase tracking-wider'>Type</span>
                                <p className='text-cream-400 text-sm mt-1'>{bucket.isLocal ? 'Self-Hosted' : 'External'}</p>
                            </div>
                            <div className='bg-mocha-600/30 rounded-lg p-3'>
                                <span className='text-mocha-200 text-xs uppercase tracking-wider'>Status</span>
                                <p className='text-cream-400 text-sm mt-1'>{bucket.enabled ? 'Enabled' : 'Disabled'}</p>
                            </div>
                        </div>
                    </div>

                    <div className='bg-red-900/20 border-2 border-red-800/50 rounded-xl p-6'>
                        <div className='flex items-center gap-3 mb-4'>
                            <div className='w-10 h-10 bg-red-900/50 rounded-lg flex items-center justify-center'>
                                <svg className='w-5 h-5 text-red-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' />
                                </svg>
                            </div>
                            <div>
                                <h3 className='text-red-400 font-semibold text-lg'>Danger Zone</h3>
                                <p className='text-mocha-200 text-sm'>Irreversible actions</p>
                            </div>
                        </div>

                        <p className='text-sm text-mocha-200 mb-4'>
                            Permanently delete this bucket and all associated data. This action cannot be undone.
                        </p>
                        <Button variant='attention' onClick={handleDelete} disabled={deleting}>
                            {deleting ? 'Deleting...' : 'Delete Bucket'}
                        </Button>
                    </div>
                </>
            )}
        </div>
    );
};

const CreateBucketModal = ({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) => {
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

    const resetForm = () => {
        setCreateName('');
        setCreateDesc('');
        setCreateAccessKey('');
        setCreateSecretKey('');
        setCreateBucketName('');
        setCreateEndpoint('');
        setCreateIsLocal(false);
        setCreateEnabled(true);
        setCreateError(null);
    };

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
            .then(() => {
                resetForm();
                onCreated();
                onClose();
                toast.success('Bucket created successfully');
            })
            .catch((e) => {
                setCreateError(httpErrorToHuman(e));
                toast.error(httpErrorToHuman(e));
                setSaving(false);
            });
    };

    return (
        <Dialog open={open} onClose={onClose} title='Create S3 Bucket'>
            {createError && <div className='text-red-400 mb-4 text-sm'>{createError}</div>}
            <div className='space-y-4 max-h-[60vh] overflow-y-auto pr-2'>
                <div className='bg-mocha-400/20 border border-mocha-400/50 rounded-lg p-4 mb-4'>
                    <p className='text-sm text-cream-400 font-medium'>Storage Configuration</p>
                    <p className='text-xs text-mocha-200 mt-1'>
                        Configure either a self-hosted (local) bucket or connect to an external S3-compatible service.
                    </p>
                </div>

                <div>
                    <label className={labelClass}>Name *</label>
                    <input
                        value={createName}
                        onChange={(e) => setCreateName(e.target.value)}
                        className={inputClass}
                        placeholder='My S3 Bucket'
                    />
                </div>

                <div>
                    <label className={labelClass}>Description</label>
                    <input
                        value={createDesc}
                        onChange={(e) => setCreateDesc(e.target.value)}
                        className={inputClass}
                        placeholder='Optional description'
                    />
                </div>

                <div>
                    <label className={labelClass}>Bucket Name *</label>
                    <input
                        value={createBucketName}
                        onChange={(e) => setCreateBucketName(e.target.value)}
                        className={inputClass}
                        placeholder='my-bucket'
                    />
                </div>

                <div>
                    <label className={labelClass}>Endpoint (optional)</label>
                    <input
                        value={createEndpoint}
                        onChange={(e) => setCreateEndpoint(e.target.value)}
                        className={inputClass}
                        placeholder='https://s3.amazonaws.com'
                    />
                    <p className='text-mocha-200 text-xs mt-1.5'>Leave empty for AWS S3 or use custom S3-compatible endpoint</p>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div>
                        <label className={labelClass}>Access Key *</label>
                        <input
                            value={createAccessKey}
                            onChange={(e) => setCreateAccessKey(e.target.value)}
                            className={inputClass}
                            type='password'
                        />
                    </div>
                    <div>
                        <label className={labelClass}>Secret Key *</label>
                        <input
                            value={createSecretKey}
                            onChange={(e) => setCreateSecretKey(e.target.value)}
                            className={inputClass}
                            type='password'
                        />
                    </div>
                </div>

                <div className='flex items-center gap-6 pt-2'>
                    <div className='flex items-center gap-2'>
                        <input
                            type='checkbox'
                            checked={createIsLocal}
                            onChange={(e) => setCreateIsLocal(e.target.checked)}
                            className='rounded border-mocha-400 w-4 h-4'
                            id='modal-bucket-local'
                        />
                        <label htmlFor='modal-bucket-local' className='text-sm text-cream-400 cursor-pointer'>
                            Self-Hosted (Local)
                        </label>
                    </div>
                    <div className='flex items-center gap-2'>
                        <input
                            type='checkbox'
                            checked={createEnabled}
                            onChange={(e) => setCreateEnabled(e.target.checked)}
                            className='rounded border-mocha-400 w-4 h-4'
                            id='modal-bucket-enabled'
                        />
                        <label htmlFor='modal-bucket-enabled' className='text-sm text-cream-400 cursor-pointer'>
                            Enabled
                        </label>
                    </div>
                </div>
            </div>
            <Dialog.Footer>
                <div className='flex items-center gap-3 p-6'>
                    <Button variant='default' onClick={handleCreate} disabled={saving || !createName || !createAccessKey || !createSecretKey || !createBucketName}>{saving ? 'Creating...' : 'Create Bucket'}</Button>
                    <Button variant='secondary' onClick={onClose}>Cancel</Button>
                </div>
            </Dialog.Footer>
        </Dialog>
    );
};

const AdminBucketsContainer = () => {
    const [page, setPage] = useState(1);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const { data, error, mutate } = useSWR(['admin:buckets', page], () => getBuckets({ page }));

    const handleDelete = async (id: number) => {
        if (!confirm('Delete this bucket?')) return;
        try {
            await deleteBucket(id);
            mutate();
            toast.success('Bucket deleted successfully');
        } catch (e: any) {
            toast.error(httpErrorToHuman(e));
        }
    };

    return (
        <Routes>
            <Route
                index
                element={
                    <div>
                        <MainPageHeader title='S3 Buckets'>
                            <Button variant='default' onClick={() => setShowCreateModal(true)}>Add Bucket</Button>
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
                                                        Bucket
                                                    </th>
                                                    <th className='text-left px-4 py-3 text-mocha-200 font-medium'>
                                                        Endpoint
                                                    </th>
                                                    <th className='text-center px-4 py-3 text-mocha-200 font-medium'>
                                                        Type
                                                    </th>
                                                    <th className='text-center px-4 py-3 text-mocha-200 font-medium'>
                                                        Status
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
                                                            No buckets found.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    items.map((bucket: AdminBucket) => (
                                                        <tr
                                                            key={bucket.id}
                                                            className='border-b border-mocha-400 last:border-0 hover:bg-mocha-400/20'
                                                        >
                                                            <td className='px-4 py-3'>
                                                                <Link
                                                                    to={String(bucket.id)}
                                                                    className='text-cream-400 font-medium hover:text-cream-200'
                                                                >
                                                                    {bucket.name}
                                                                </Link>
                                                            </td>
                                                            <td className='px-4 py-3'>
                                                                <code className='text-cream-400 text-xs'>
                                                                    {bucket.bucketName}
                                                                </code>
                                                            </td>
                                                            <td className='px-4 py-3 text-mocha-100'>
                                                                {bucket.endpoint || '-'}
                                                            </td>
                                                            <td className='px-4 py-3 text-center'>
                                                                {bucket.isLocal ? (
                                                                    <span className='text-green-400'>Local</span>
                                                                ) : (
                                                                    <span className='text-blue-400'>External</span>
                                                                )}
                                                            </td>
                                                            <td className='px-4 py-3 text-center'>
                                                                {bucket.enabled ? (
                                                                    <span className='text-green-400'>Enabled</span>
                                                                ) : (
                                                                    <span className='text-mocha-200/60'>Disabled</span>
                                                                )}
                                                            </td>
                                                            <td className='px-4 py-3 text-right'>
                                                                <div className='flex items-center justify-end gap-2'>
                                                                    <Link
                                                                        to={String(bucket.id)}
                                                                        className='text-xs text-cream-400 hover:text-cream-500'
                                                                    >
                                                                        View
                                                                    </Link>
                                                                    <Button variant='attention' onClick={() => handleDelete(bucket.id)}>Delete</Button>
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

                        <CreateBucketModal
                            open={showCreateModal}
                            onClose={() => setShowCreateModal(false)}
                            onCreated={() => mutate()}
                        />
                    </div>
                }
            />
            <Route path=':id/*' element={<AdminBucketView />} />
        </Routes>
    );
};

export default AdminBucketsContainer;