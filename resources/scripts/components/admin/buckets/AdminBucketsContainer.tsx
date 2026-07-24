import { Cloud, Database, Eye, EyeSlash, Gear } from '@gravity-ui/icons';
import { Delete02Icon, Edit02Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useEffect, useRef, useState } from 'react';
import { Link, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
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
import { Dialog } from '@/components/elements/dialog';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import Pagination from '@/components/elements/Pagination';
import Spinner from '@/components/elements/Spinner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

const inputClass =
    'w-full bg-mocha-600 border border-mocha-400 rounded px-3 py-2 text-sm text-cream-400 focus:outline-none focus:border-mocha-300 transition-colors placeholder-mocha-300/50';
const labelClass = 'block text-sm font-medium text-mocha-200 mb-1';

const AdminBucketView = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const bucketId = Number(id);

    const {
        data: bucket,
        error: bucketError,
        mutate: bucketMutate,
    } = useSWR(['admin:bucket', bucketId], () => getBucket(bucketId));

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [bucketName, setBucketName] = useState('');
    const [endpoint, setEndpoint] = useState('');
    const [accessKey, setAccessKey] = useState('');
    const [secretKey, setSecretKey] = useState('');
    const [isLocal, setIsLocal] = useState(false);
    const [enabled, setEnabled] = useState(true);
    const [usePathStyleEndpoint, setUsePathStyleEndpoint] = useState(false);
    const [minioInstanceUrl, setMinioInstanceUrl] = useState('');
    const [initialized, setInitialized] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const [showAccessKey, setShowAccessKey] = useState(false);
    const [showSecretKey, setShowSecretKey] = useState(false);

    if (bucket && !initialized) {
        setName(bucket.name);
        setDescription(bucket.description || '');
        setBucketName(bucket.bucketName);
        setEndpoint(bucket.endpoint || '');
        setIsLocal(bucket.isLocal);
        setEnabled(bucket.enabled);
        setUsePathStyleEndpoint(bucket.usePathStyleEndpoint);
        setMinioInstanceUrl(bucket.minioInstanceUrl || '');
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
            minio_instance_url: minioInstanceUrl || undefined,
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
                    <Link
                        to='/admin/buckets'
                        className='text-sm text-mocha-200 hover:text-mocha-100 flex items-center gap-1.5'
                    >
                        &larr; Back to Buckets
                    </Link>
                }
            >
                <Button variant='default' onClick={handleSave} disabled={saving || deleting}>
                    {saving ? 'Saving...' : 'Save'}
                </Button>
            </MainPageHeader>

            {(error || bucketError) && (
                <div className='text-red-400 mb-4 text-sm bg-red-950/20 border border-red-800/40 rounded-lg p-3'>
                    {error || httpErrorToHuman(bucketError)}
                </div>
            )}
            {success && (
                <div className='text-green-400 mb-4 text-sm bg-green-950/20 border border-green-800/40 rounded-lg p-3'>
                    Bucket configuration updated successfully.
                </div>
            )}

            {!bucket ? (
                <Spinner />
            ) : (
                <>
                    <div className='bg-mocha-500 border border-mocha-400 rounded-xl p-6 shadow-md'>
                        <div className='flex items-center justify-between mb-6 border-b border-mocha-400/40 pb-4'>
                            <div className='flex items-center gap-3'>
                                <div className='w-10 h-10 bg-mocha-400 rounded-lg flex items-center justify-center'>
                                    {isLocal ? (
                                        <Database className='w-5 h-5 text-cream-400' />
                                    ) : (
                                        <Cloud className='w-5 h-5 text-cream-400' />
                                    )}
                                </div>
                                <div>
                                    <h3 className='text-cream-400 font-semibold text-lg'>Bucket Details</h3>
                                    <p className='text-mocha-200 text-sm'>
                                        Configure S3 access keys, hostnames, and credentials.
                                    </p>
                                </div>
                            </div>
                            {isLocal && minioInstanceUrl && (
                                <a
                                    href={minioInstanceUrl}
                                    target='_blank'
                                    rel='noreferrer'
                                    className='text-xs bg-green-900/40 border border-green-800/40 hover:bg-green-800/50 text-green-300 font-medium px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all'
                                >
                                    Open MinIO Console ↗
                                </a>
                            )}
                        </div>

                        <div className='space-y-4'>
                            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                <div>
                                    <label htmlFor='bucket-details-name' className={labelClass}>
                                        Name *
                                    </label>
                                    <input
                                        id='bucket-details-name'
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className={inputClass}
                                    />
                                </div>
                                <div>
                                    <label htmlFor='bucket-details-bucketname' className={labelClass}>
                                        Bucket Name *
                                    </label>
                                    <input
                                        id='bucket-details-bucketname'
                                        value={bucketName}
                                        onChange={(e) => setBucketName(e.target.value)}
                                        className={inputClass}
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor='bucket-details-description' className={labelClass}>
                                    Description
                                </label>
                                <input
                                    id='bucket-details-description'
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className={inputClass}
                                />
                            </div>

                            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                <div>
                                    <label htmlFor='bucket-details-endpoint' className={labelClass}>
                                        Endpoint (optional)
                                    </label>
                                    <input
                                        id='bucket-details-endpoint'
                                        value={endpoint}
                                        onChange={(e) => setEndpoint(e.target.value)}
                                        className={inputClass}
                                        placeholder='https://s3.amazonaws.com'
                                    />
                                    <p className='text-mocha-200 text-xs mt-1.5'>Leave empty for AWS S3</p>
                                </div>
                                {isLocal && (
                                    <div>
                                        <label htmlFor='bucket-details-minio-url' className={labelClass}>
                                            MinIO Console URL (optional)
                                        </label>
                                        <input
                                            id='bucket-details-minio-url'
                                            value={minioInstanceUrl}
                                            onChange={(e) => setMinioInstanceUrl(e.target.value)}
                                            className={inputClass}
                                            placeholder='http://localhost:9001'
                                        />
                                        <p className='text-mocha-200 text-xs mt-1.5'>
                                            Local dashboard URL for easy access
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                <div className='relative'>
                                    <label htmlFor='bucket-details-access' className={labelClass}>
                                        Access Key (empty to keep current)
                                    </label>
                                    <div className='relative'>
                                        <input
                                            id='bucket-details-access'
                                            value={accessKey}
                                            onChange={(e) => setAccessKey(e.target.value)}
                                            className={`${inputClass} pr-10`}
                                            type={showAccessKey ? 'text' : 'password'}
                                        />
                                        <button
                                            type='button'
                                            onClick={() => setShowAccessKey(!showAccessKey)}
                                            className='absolute inset-y-0 right-0 pr-3 flex items-center text-mocha-200 hover:text-cream-400 cursor-pointer'
                                        >
                                            {showAccessKey ? (
                                                <EyeSlash className='w-4 h-4' />
                                            ) : (
                                                <Eye className='w-4 h-4' />
                                            )}
                                        </button>
                                    </div>
                                </div>
                                <div className='relative'>
                                    <label htmlFor='bucket-details-secret' className={labelClass}>
                                        Secret Key (empty to keep current)
                                    </label>
                                    <div className='relative'>
                                        <input
                                            id='bucket-details-secret'
                                            value={secretKey}
                                            onChange={(e) => setSecretKey(e.target.value)}
                                            className={`${inputClass} pr-10`}
                                            type={showSecretKey ? 'text' : 'password'}
                                        />
                                        <button
                                            type='button'
                                            onClick={() => setShowSecretKey(!showSecretKey)}
                                            className='absolute inset-y-0 right-0 pr-3 flex items-center text-mocha-200 hover:text-cream-400 cursor-pointer'
                                        >
                                            {showSecretKey ? (
                                                <EyeSlash className='w-4 h-4' />
                                            ) : (
                                                <Eye className='w-4 h-4' />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className='flex flex-wrap items-center gap-6 pt-3 border-t border-mocha-400/35 mt-4'>
                                <Checkbox
                                    checked={isLocal}
                                    onChange={(e) => setIsLocal(e.target.checked)}
                                    id='bucket-local'
                                    label='Self-Hosted (Local)'
                                />
                                <Checkbox
                                    checked={enabled}
                                    onChange={(e) => setEnabled(e.target.checked)}
                                    id='bucket-enabled'
                                    label='Enabled'
                                />
                                <Checkbox
                                    checked={usePathStyleEndpoint}
                                    onChange={(e) => setUsePathStyleEndpoint(e.target.checked)}
                                    id='bucket-path-style'
                                    label='Path Style Endpoint'
                                />
                            </div>
                        </div>
                    </div>

                    <div className='bg-mocha-500/50 border border-mocha-400/50 rounded-xl p-6'>
                        <div className='flex items-center gap-3 mb-4'>
                            <div className='w-10 h-10 bg-mocha-400/50 rounded-lg flex items-center justify-center'>
                                <Gear className='w-5 h-5 text-mocha-200' />
                            </div>
                            <div>
                                <h3 className='text-mocha-200 font-semibold'>System Metatags</h3>
                                <p className='text-mocha-300 text-xs'>Read-only configuration details</p>
                            </div>
                        </div>

                        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                            <div className='bg-mocha-600/30 rounded-lg p-3 border border-mocha-400/30'>
                                <span className='text-mocha-200 text-xs uppercase tracking-wider font-semibold'>
                                    Bucket ID
                                </span>
                                <p className='text-cream-400 font-mono text-sm mt-1'>#{bucket.id}</p>
                            </div>
                            <div className='bg-mocha-600/30 rounded-lg p-3 border border-mocha-400/30'>
                                <span className='text-mocha-200 text-xs uppercase tracking-wider font-semibold'>
                                    Type
                                </span>
                                <p className='text-cream-400 text-sm mt-1'>
                                    {bucket.isLocal ? 'Self-Hosted' : 'External Cloud'}
                                </p>
                            </div>
                            <div className='bg-mocha-600/30 rounded-lg p-3 border border-mocha-400/30'>
                                <span className='text-mocha-200 text-xs uppercase tracking-wider font-semibold'>
                                    Status
                                </span>
                                <p className='text-cream-400 text-sm mt-1'>{bucket.enabled ? 'Active' : 'Disabled'}</p>
                            </div>
                        </div>
                    </div>

                    <div className='bg-red-950/10 border-2 border-red-900/30 rounded-xl p-6'>
                        <div className='flex items-center gap-3 mb-4'>
                            <div className='w-10 h-10 bg-red-900/35 rounded-lg flex items-center justify-center'>
                                <svg
                                    className='w-5 h-5 text-red-400'
                                    fill='none'
                                    stroke='currentColor'
                                    viewBox='0 0 24 24'
                                >
                                    <title>Warning</title>
                                    <path
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        strokeWidth={2}
                                        d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
                                    />
                                </svg>
                            </div>
                            <div>
                                <h3 className='text-red-400 font-semibold text-lg'>Danger Zone</h3>
                                <p className='text-mocha-200 text-sm'>Irreversible operations</p>
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

const CreateBucketModal = ({
    open,
    onClose,
    onCreated,
}: {
    open: boolean;
    onClose: () => void;
    onCreated: () => void;
}) => {
    const [createName, setCreateName] = useState('');
    const [createDesc, setCreateDesc] = useState('');
    const [createAccessKey, setCreateAccessKey] = useState('');
    const [createSecretKey, setCreateSecretKey] = useState('');
    const [createBucketName, setCreateBucketName] = useState('');
    const [createEndpoint, setCreateEndpoint] = useState('');
    const [createIsLocal, setCreateIsLocal] = useState(false);
    const [createEnabled, setCreateEnabled] = useState(true);
    const [createUsePathStyleEndpoint, setCreateUsePathStyleEndpoint] = useState(false);
    const [createMinioInstanceUrl, setCreateMinioInstanceUrl] = useState('');
    const [saving, setSaving] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);

    // UX improvements: dynamic presets
    const [localProvider, setLocalProvider] = useState<'minio' | 'garage' | 'custom'>('minio');
    const [showAccessKey, setShowAccessKey] = useState(false);
    const [showSecretKey, setShowSecretKey] = useState(false);
    const [providerSelectOpen, setProviderSelectOpen] = useState(false);
    const providerSelectRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!providerSelectOpen) return;
        const handler = (e: MouseEvent) => {
            if (providerSelectRef.current && !providerSelectRef.current.contains(e.target as Node)) {
                setProviderSelectOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [providerSelectOpen]);

    const resetForm = () => {
        setCreateName('');
        setCreateDesc('');
        setCreateAccessKey('');
        setCreateSecretKey('');
        setCreateBucketName('');
        setCreateEndpoint('');
        setCreateIsLocal(false);
        setCreateEnabled(true);
        setCreateUsePathStyleEndpoint(false);
        setCreateMinioInstanceUrl('');
        setCreateError(null);
        setProviderSelectOpen(false);
    };

    const applyLocalPreset = (provider: 'minio' | 'garage' | 'custom') => {
        setLocalProvider(provider);
        if (provider === 'minio') {
            setCreateEndpoint('http://localhost:9000');
            setCreateMinioInstanceUrl('http://localhost:9001');
            setCreateAccessKey('minioadmin');
            setCreateSecretKey('minioadmin');
            setCreateUsePathStyleEndpoint(true);
            if (!createName) setCreateName('Local MinIO S3');
            if (!createBucketName) setCreateBucketName('backups');
        } else if (provider === 'garage') {
            setCreateEndpoint('http://localhost:3900');
            setCreateMinioInstanceUrl('');
            setCreateUsePathStyleEndpoint(true);
            if (!createName) setCreateName('Local Garage S3');
            if (!createBucketName) setCreateBucketName('backups');
        } else {
            setCreateEndpoint('');
            setCreateMinioInstanceUrl('');
            setCreateUsePathStyleEndpoint(false);
        }
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
            use_path_style_endpoint: createUsePathStyleEndpoint,
            minio_instance_url:
                createIsLocal && localProvider === 'minio' ? createMinioInstanceUrl || undefined : undefined,
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
        <Dialog
            open={open}
            onClose={onClose}
            title={
                createIsLocal
                    ? localProvider === 'minio'
                        ? 'Add MinIO Bucket'
                        : localProvider === 'garage'
                          ? 'Add Garage Bucket'
                          : 'Add Custom S3 Bucket'
                    : 'Add Cloud S3 Bucket'
            }
        >
            {createError && (
                <div className='text-red-400 mb-4 text-sm bg-red-950/20 border border-red-800/40 rounded-lg p-3 mx-6 mt-4'>
                    {createError}
                </div>
            )}
            <div className='space-y-5 max-h-[70vh] overflow-y-auto pr-2 px-6 pt-2'>
                {/* Custom Select: Storage Provider */}
                <div>
                    <label htmlFor='storage-provider' className={labelClass}>
                        Storage Provider *
                    </label>
                    <div className='relative' ref={providerSelectRef}>
                        <button
                            id='storage-provider'
                            type='button'
                            onClick={(e) => {
                                e.stopPropagation();
                                setProviderSelectOpen(!providerSelectOpen);
                            }}
                            className={`w-full flex items-center justify-between gap-2 bg-mocha-600 border rounded px-3 py-2 text-sm text-left transition-colors cursor-pointer ${
                                providerSelectOpen ? 'border-mocha-300' : 'border-mocha-400 hover:border-mocha-300'
                            }`}
                        >
                            <span className='flex items-center gap-2'>
                                {!createIsLocal ? (
                                    <Cloud className='w-4 h-4 text-cream-400 shrink-0' />
                                ) : (
                                    <Database className='w-4 h-4 text-cream-400 shrink-0' />
                                )}
                                <span className='text-cream-400'>
                                    {createIsLocal
                                        ? localProvider === 'minio'
                                            ? 'MinIO (Self-Hosted)'
                                            : localProvider === 'garage'
                                              ? 'Garage (Self-Hosted)'
                                              : 'Custom S3 (Self-Hosted)'
                                        : 'Cloud S3'}
                                </span>
                            </span>
                            <svg
                                className={`w-4 h-4 text-mocha-200 shrink-0 transition-transform ${providerSelectOpen ? 'rotate-180' : ''}`}
                                viewBox='0 0 20 20'
                                fill='currentColor'
                                role='presentation'
                            >
                                <path
                                    fillRule='evenodd'
                                    d='M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z'
                                    clipRule='evenodd'
                                />
                            </svg>
                        </button>
                        {providerSelectOpen && (
                            <div className='absolute z-50 mt-1 w-full bg-mocha-600 border border-mocha-300 rounded-lg shadow-xl overflow-hidden'>
                                <div className='px-2 pt-2 pb-1'>
                                    <span className='text-[10px] font-semibold text-mocha-200 uppercase tracking-wider px-2'>
                                        Cloud Providers
                                    </span>
                                </div>
                                <button
                                    type='button'
                                    onClick={() => {
                                        setCreateIsLocal(false);
                                        setProviderSelectOpen(false);
                                    }}
                                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors cursor-pointer ${
                                        !createIsLocal
                                            ? 'bg-cream-400/10 text-cream-400'
                                            : 'text-mocha-200 hover:bg-mocha-400/20 hover:text-cream-400'
                                    }`}
                                >
                                    <Cloud className='w-4 h-4 shrink-0' />
                                    <div>
                                        <span className='font-medium'>Cloud S3</span>
                                        <span className='text-xs text-mocha-200 ml-2'>AWS, Backblaze, R2, Wasabi</span>
                                    </div>
                                </button>
                                <div className='border-t border-mocha-400/30 mx-2' />
                                <div className='px-2 pt-2 pb-1'>
                                    <span className='text-[10px] font-semibold text-mocha-200 uppercase tracking-wider px-2'>
                                        Self-Hosted
                                    </span>
                                </div>
                                {[
                                    { key: 'minio' as const, label: 'MinIO', desc: 'Standard local S3 with console' },
                                    { key: 'garage' as const, label: 'Garage', desc: 'Lightweight self-hosted S3' },
                                    { key: 'custom' as const, label: 'Custom S3', desc: 'Ceph, SeaweedFS, or other' },
                                ].map((prov) => (
                                    <button
                                        key={prov.key}
                                        type='button'
                                        onClick={() => {
                                            setCreateIsLocal(true);
                                            applyLocalPreset(prov.key);
                                            setProviderSelectOpen(false);
                                        }}
                                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors cursor-pointer ${
                                            createIsLocal && localProvider === prov.key
                                                ? 'bg-cream-400/10 text-cream-400'
                                                : 'text-mocha-200 hover:bg-mocha-400/20 hover:text-cream-400'
                                        }`}
                                    >
                                        <Database className='w-4 h-4 shrink-0' />
                                        <div>
                                            <span className='font-medium'>{prov.label}</span>
                                            <span className='text-xs text-mocha-200 ml-2'>{prov.desc}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <p className='text-xs text-mocha-200/60 mt-1'>
                        {!createIsLocal
                            ? 'Use a cloud-hosted S3-compatible storage provider'
                            : 'Use a locally self-hosted S3-compatible service'}
                    </p>
                </div>

                {/* Local Provider Info */}
                {createIsLocal && (
                    <div className='bg-mocha-600/30 border border-mocha-400/35 rounded-xl p-4 space-y-2'>
                        {localProvider === 'minio' && (
                            <p className='text-xs text-mocha-200 leading-normal'>
                                MinIO preset applied with default credentials <code>minioadmin</code>. Make sure your
                                endpoint matches your host config (e.g. <code>http://localhost:9000</code>).
                            </p>
                        )}
                        {localProvider === 'garage' && (
                            <p className='text-xs text-mocha-200 leading-normal'>
                                Garage requires Path-Style routing and typically runs on port <code>3900</code>.
                            </p>
                        )}
                        {localProvider === 'custom' && (
                            <p className='text-xs text-mocha-200 leading-normal'>
                                Configure your endpoint, access key, and secret key manually for your custom
                                S3-compatible service.
                            </p>
                        )}
                    </div>
                )}

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div>
                        <label htmlFor='bucket-create-name' className={labelClass}>
                            Name *
                        </label>
                        <input
                            id='bucket-create-name'
                            value={createName}
                            onChange={(e) => setCreateName(e.target.value)}
                            className={inputClass}
                            placeholder={createIsLocal ? 'Local MinIO S3' : 'AWS Backup Storage'}
                        />
                    </div>
                    <div>
                        <label htmlFor='bucket-create-bucketname' className={labelClass}>
                            Bucket Name *
                        </label>
                        <input
                            id='bucket-create-bucketname'
                            value={createBucketName}
                            onChange={(e) => setCreateBucketName(e.target.value)}
                            className={inputClass}
                            placeholder='backups'
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor='bucket-create-description' className={labelClass}>
                        Description
                    </label>
                    <input
                        id='bucket-create-description'
                        value={createDesc}
                        onChange={(e) => setCreateDesc(e.target.value)}
                        className={inputClass}
                        placeholder='Optional description of this bucket'
                    />
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div>
                        <label htmlFor='bucket-create-endpoint' className={labelClass}>
                            Endpoint {!createIsLocal && '(optional)'}
                        </label>
                        <input
                            id='bucket-create-endpoint'
                            value={createEndpoint}
                            onChange={(e) => setCreateEndpoint(e.target.value)}
                            className={inputClass}
                            placeholder={createIsLocal ? 'http://localhost:9000' : 'https://s3.amazonaws.com'}
                        />
                        <p className='text-mocha-200 text-xs mt-1'>
                            {createIsLocal
                                ? 'Internal API endpoint of the local S3 host'
                                : 'Leave empty for default AWS region'}
                        </p>
                    </div>
                    {createIsLocal && localProvider === 'minio' && (
                        <div>
                            <label htmlFor='bucket-create-minio-url' className={labelClass}>
                                MinIO Console URL (optional)
                            </label>
                            <input
                                id='bucket-create-minio-url'
                                value={createMinioInstanceUrl}
                                onChange={(e) => setCreateMinioInstanceUrl(e.target.value)}
                                className={inputClass}
                                placeholder='http://localhost:9001'
                            />
                            <p className='text-mocha-200 text-xs mt-1'>Local MinIO admin dashboard address</p>
                        </div>
                    )}
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div className='relative'>
                        <label htmlFor='bucket-create-access' className={labelClass}>
                            Access Key *
                        </label>
                        <div className='relative'>
                            <input
                                id='bucket-create-access'
                                value={createAccessKey}
                                onChange={(e) => setCreateAccessKey(e.target.value)}
                                className={`${inputClass} pr-10`}
                                type={showAccessKey ? 'text' : 'password'}
                                placeholder={createIsLocal && localProvider === 'minio' ? 'minioadmin' : ''}
                            />
                            <button
                                type='button'
                                onClick={() => setShowAccessKey(!showAccessKey)}
                                className='absolute inset-y-0 right-0 pr-3 flex items-center text-mocha-200 hover:text-cream-400 cursor-pointer'
                            >
                                {showAccessKey ? <EyeSlash className='w-4 h-4' /> : <Eye className='w-4 h-4' />}
                            </button>
                        </div>
                    </div>
                    <div className='relative'>
                        <label htmlFor='bucket-create-secret' className={labelClass}>
                            Secret Key *
                        </label>
                        <div className='relative'>
                            <input
                                id='bucket-create-secret'
                                value={createSecretKey}
                                onChange={(e) => setCreateSecretKey(e.target.value)}
                                className={`${inputClass} pr-10`}
                                type={showSecretKey ? 'text' : 'password'}
                                placeholder={createIsLocal && localProvider === 'minio' ? 'minioadmin' : ''}
                            />
                            <button
                                type='button'
                                onClick={() => setShowSecretKey(!showSecretKey)}
                                className='absolute inset-y-0 right-0 pr-3 flex items-center text-mocha-200 hover:text-cream-400 cursor-pointer'
                            >
                                {showSecretKey ? <EyeSlash className='w-4 h-4' /> : <Eye className='w-4 h-4' />}
                            </button>
                        </div>
                    </div>
                </div>

                <div className='flex items-center gap-6 pt-3 border-t border-mocha-400/35 mt-4'>
                    <Checkbox
                        checked={createEnabled}
                        onChange={(e) => setCreateEnabled(e.target.checked)}
                        id='modal-bucket-enabled'
                        label='Enabled'
                    />
                    <Checkbox
                        checked={createUsePathStyleEndpoint}
                        onChange={(e) => setCreateUsePathStyleEndpoint(e.target.checked)}
                        id='modal-bucket-path-style'
                        label='Use Path Style Endpoint'
                    />
                </div>
            </div>
            <Dialog.Footer>
                <div className='flex items-center justify-end gap-3 p-6 border-t border-mocha-400/30'>
                    <Button variant='secondary' onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        variant='default'
                        onClick={handleCreate}
                        disabled={saving || !createName || !createAccessKey || !createSecretKey || !createBucketName}
                    >
                        {saving ? 'Creating...' : 'Create Bucket'}
                    </Button>
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
        } catch (err) {
            toast.error(httpErrorToHuman(err));
        }
    };

    return (
        <Routes>
            <Route
                index
                element={
                    <div>
                        <MainPageHeader title='S3 Buckets'>
                            <Button variant='default' onClick={() => setShowCreateModal(true)}>
                                Add Bucket
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
                                                    <th className='text-left px-5 py-4.5 text-mocha-200 font-semibold tracking-wide uppercase text-xs'>
                                                        Name
                                                    </th>
                                                    <th className='text-left px-5 py-4.5 text-mocha-200 font-semibold tracking-wide uppercase text-xs'>
                                                        Bucket
                                                    </th>
                                                    <th className='text-left px-5 py-4.5 text-mocha-200 font-semibold tracking-wide uppercase text-xs'>
                                                        Endpoint
                                                    </th>
                                                    <th className='text-center px-5 py-4.5 text-mocha-200 font-semibold tracking-wide uppercase text-xs w-[120px]'>
                                                        Type
                                                    </th>
                                                    <th className='text-center px-5 py-4.5 text-mocha-200 font-semibold tracking-wide uppercase text-xs w-[100px]'>
                                                        Status
                                                    </th>
                                                    <th className='text-right px-5 py-4.5 text-mocha-200 font-semibold tracking-wide uppercase text-xs w-[160px]'>
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
                                                            No buckets found.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    items.map((bucket: AdminBucket) => (
                                                        <tr
                                                            key={bucket.id}
                                                            className='hover:bg-mocha-400/15 transition-colors'
                                                        >
                                                            <td className='px-5 py-4'>
                                                                <div className='flex items-center gap-2'>
                                                                    <Link
                                                                        to={String(bucket.id)}
                                                                        className='text-cream-400 font-semibold hover:text-cream-200 transition-colors'
                                                                    >
                                                                        {bucket.name}
                                                                    </Link>
                                                                    {bucket.isLocal && bucket.minioInstanceUrl && (
                                                                        <a
                                                                            href={bucket.minioInstanceUrl}
                                                                            target='_blank'
                                                                            rel='noreferrer'
                                                                            title='Open MinIO Dashboard'
                                                                            className='text-green-400 hover:text-green-300 p-0.5 rounded transition-all cursor-pointer'
                                                                        >
                                                                            <svg
                                                                                className='w-3.5 h-3.5'
                                                                                fill='none'
                                                                                stroke='currentColor'
                                                                                viewBox='0 0 24 24'
                                                                            >
                                                                                <title>Open Dashboard</title>
                                                                                <path
                                                                                    strokeLinecap='round'
                                                                                    strokeLinejoin='round'
                                                                                    strokeWidth={2}
                                                                                    d='M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14'
                                                                                />
                                                                            </svg>
                                                                        </a>
                                                                    )}
                                                                </div>
                                                                {bucket.description && (
                                                                    <p className='text-xs text-mocha-200 mt-0.5 max-w-[250px] truncate'>
                                                                        {bucket.description}
                                                                    </p>
                                                                )}
                                                            </td>
                                                            <td className='px-5 py-4'>
                                                                <code className='text-cream-400 text-xs bg-mocha-600/60 px-2 py-1 rounded border border-mocha-400/40 font-mono'>
                                                                    {bucket.bucketName}
                                                                </code>
                                                            </td>
                                                            <td className='px-5 py-4 text-mocha-100 font-mono text-xs max-w-[200px] truncate'>
                                                                {bucket.endpoint || (
                                                                    <span className='text-mocha-300 font-sans italic'>
                                                                        Default AWS
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className='px-5 py-4 text-center'>
                                                                {bucket.isLocal ? (
                                                                    <span className='inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded-md uppercase tracking-wider'>
                                                                        <Database className='w-3 h-3' /> Local
                                                                    </span>
                                                                ) : (
                                                                    <span className='inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md uppercase tracking-wider'>
                                                                        <Cloud className='w-3 h-3' /> Cloud
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className='px-5 py-4 text-center'>
                                                                {bucket.enabled ? (
                                                                    <span className='inline-flex items-center text-xs font-semibold px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full'>
                                                                        Active
                                                                    </span>
                                                                ) : (
                                                                    <span className='inline-flex items-center text-xs font-semibold px-2.5 py-0.5 bg-mocha-400/10 text-mocha-300 rounded-full'>
                                                                        Inactive
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className='px-5 py-4 text-right'>
                                                                <div className='flex items-center justify-end gap-2'>
                                                                    <Link
                                                                        to={String(bucket.id)}
                                                                        className='inline-flex items-center justify-center h-8 w-8 rounded-lg text-mocha-100 hover:text-cream-400 hover:bg-mocha-400/40 transition-colors'
                                                                        title='Configure'
                                                                    >
                                                                        <HugeiconsIcon icon={Edit02Icon} size={16} />
                                                                    </Link>
                                                                    <Button
                                                                        variant='attention'
                                                                        size='sm'
                                                                        onClick={() => handleDelete(bucket.id)}
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
