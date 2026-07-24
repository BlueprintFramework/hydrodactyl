import {
    CodeIcon,
    CubeIcon,
    Delete02Icon,
    EggsIcon,
    InformationCircleIcon,
    Settings02Icon,
    SlidersHorizontalIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import useSWR from 'swr';
import { deleteEgg, getEgg, updateEgg } from '@/api/admin/nests';
import { httpErrorToHuman } from '@/api/http';
import AdminEggScriptsContainer from '@/components/admin/nests/AdminEggScriptsContainer';
import AdminEggVariablesContainer from '@/components/admin/nests/AdminEggVariablesContainer';
import { Dialog } from '@/components/elements/dialog';
import Spinner from '@/components/elements/Spinner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

const inputClass =
    'w-full bg-mocha-600 border border-mocha-400 rounded px-3 py-2 text-sm text-cream-400 focus:outline-none focus:border-mocha-300 transition-colors';
const labelClass = 'block text-sm text-mocha-200 mb-1';

const AdminEggViewContainer = () => {
    const { id: nestIdParam, eggId: eggIdParam } = useParams<{ id: string; eggId: string }>();
    const navigate = useNavigate();
    const nestId = Number(nestIdParam);
    const eggId = Number(eggIdParam);
    const [activeTab, setActiveTab] = useState<'configuration' | 'variables' | 'scripts' | 'manage'>('configuration');
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [startup, setStartup] = useState('');
    const [dockerImages, setDockerImages] = useState('');
    const [forceOutgoingIp, setForceOutgoingIp] = useState(false);
    const [features, setFeatures] = useState('');
    const [configFrom, setConfigFrom] = useState<number | null>(null);
    const [configStop, setConfigStop] = useState('');
    const [configStartup, setConfigStartup] = useState('');
    const [configLogs, setConfigLogs] = useState('');
    const [configFiles, setConfigFiles] = useState('');

    const {
        data: egg,
        error: fetchError,
        mutate,
    } = useSWR(eggId ? ['admin:egg', nestId, eggId] : null, () => getEgg(nestId, eggId));

    useEffect(() => {
        if (egg) {
            setName(egg.name);
            setDescription(egg.description || '');
            setStartup(egg.startup || '');
            setDockerImages(
                Object.entries(egg.dockerImages || {})
                    .map(([k, v]) => `${k}|${v}`)
                    .join('\n'),
            );
            setForceOutgoingIp(egg.forceOutgoingIp || false);
            setFeatures((egg.features || []).join(', '));
            setConfigFrom(egg.config.extends);
            setConfigStop(egg.config.stop || '');
            setConfigStartup(egg.config.startup || '');
            setConfigLogs(egg.config.logs || '');
            setConfigFiles(egg.config.files ? JSON.stringify(egg.config.files, null, 2) : '');
        }
    }, [egg]);

    const syncFromEgg = () => {
        if (!egg) return;
        setName(egg.name);
        setDescription(egg.description || '');
        setStartup(egg.startup || '');
        setDockerImages(
            Object.entries(egg.dockerImages || {})
                .map(([k, v]) => `${k}|${v}`)
                .join('\n'),
        );
        setForceOutgoingIp(egg.forceOutgoingIp || false);
        setFeatures((egg.features || []).join(', '));
        setConfigFrom(egg.config.extends);
        setConfigStop(egg.config.stop || '');
        setConfigStartup(egg.config.startup || '');
        setConfigLogs(egg.config.logs || '');
        setConfigFiles(egg.config.files ? JSON.stringify(egg.config.files, null, 2) : '');
    };

    const handleSave = async () => {
        setSaving(true);

        const images: Record<string, string> = {};
        dockerImages
            .split('\n')
            .filter(Boolean)
            .forEach((line) => {
                const [key, ...rest] = line.split('|');
                if (key) {
                    images[key.trim()] = rest.join('|').trim() || key.trim();
                }
            });

        const data: Record<string, unknown> = {
            name,
            description: description || null,
            startup,
            docker_images: images,
            force_outgoing_ip: forceOutgoingIp,
            features: features
                ? features
                      .split(',')
                      .map((f) => f.trim())
                      .filter(Boolean)
                : null,
            config_from: configFrom,
            config_stop: configStop || null,
            config_startup: configStartup || null,
            config_logs: configLogs || null,
        };

        let filesParsed: Record<string, unknown> | null = null;
        if (configFiles.trim()) {
            try {
                filesParsed = JSON.parse(configFiles);
            } catch {
                /* ignore */
            }
        }
        if (filesParsed) {
            data.config_files = JSON.stringify(filesParsed);
        }

        try {
            await updateEgg(nestId, eggId, data);
            await mutate();
            setEditing(false);
            toast.success('Egg saved successfully');
        } catch (e: unknown) {
            toast.error(httpErrorToHuman(e));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        setShowDeleteConfirm(false);
        setDeleting(true);
        try {
            await deleteEgg(nestId, eggId);
            toast.success('Egg deleted successfully');
            navigate(`/admin/nests/${nestId}`);
        } catch (e: unknown) {
            toast.error(httpErrorToHuman(e));
        } finally {
            setDeleting(false);
        }
    };

    const handleExport = () => {
        if (!egg) return;
        const blob = new Blob([JSON.stringify(egg, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${egg.name}.egg.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    if (fetchError) return <div className='text-red-400 p-4'>Error: {httpErrorToHuman(fetchError)}</div>;
    if (!egg) return <Spinner />;

    const dockerImageCount = Object.keys(egg.dockerImages || {}).length;

    const createdAge = (() => {
        const created = new Date(egg.createdAt);
        const now = new Date();
        const days = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
        if (days < 1) return 'Today';
        if (days === 1) return '1 day ago';
        if (days < 30) return `${days} days ago`;
        const months = Math.floor(days / 30);
        if (months === 1) return '1 month ago';
        if (months < 12) return `${months} months ago`;
        const years = Math.floor(months / 12);
        return years === 1 ? '1 year ago' : `${years} years ago`;
    })();

    return (
        <div>
            {/* ── Header ── */}
            <div className='flex items-center justify-between gap-4 mb-6 mt-8 md:mt-0 flex-col sm:flex-row'>
                <div className='flex items-center gap-3'>
                    <Link
                        to={`/admin/nests/${nestId}`}
                        className='w-9 h-9 rounded-lg bg-mocha-500 border border-mocha-400 flex items-center justify-center text-mocha-200 hover:text-cream-400 hover:border-mocha-300 transition-all shrink-0'
                    >
                        <svg
                            className='w-4 h-4'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                            role='presentation'
                        >
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' />
                        </svg>
                    </Link>
                    <h1 className='text-2xl font-bold text-cream-400'>{egg.name}</h1>
                    <span className='inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-mocha-400/50 text-mocha-200 border border-mocha-400/50'>
                        {egg.author}
                    </span>
                    <Link
                        to={`/admin/nests/${nestId}`}
                        className='inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-mocha-400/30 text-cream-400 border border-mocha-400/50 hover:bg-mocha-400/50 transition-colors'
                    >
                        <HugeiconsIcon icon={CubeIcon} className='w-3 h-3' />
                        Nest #{nestId}
                    </Link>
                </div>
                <div className='flex items-center gap-3'>
                    {activeTab === 'configuration' && editing && (
                        <Button variant='default' onClick={handleSave} disabled={saving}>
                            {saving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    )}
                    <Button variant='secondary' onClick={handleExport}>
                        Export
                    </Button>
                    <Button variant='attention' onClick={() => setShowDeleteConfirm(true)} disabled={deleting}>
                        Delete Egg
                    </Button>
                </div>
            </div>

            {/* ── Tab Navigation ── */}
            <div className='flex items-center gap-2 p-1 bg-mocha-500/50 border border-mocha-400/50 rounded-xl w-fit mt-4'>
                {(
                    [
                        { key: 'configuration', label: 'Configuration', icon: InformationCircleIcon },
                        { key: 'variables', label: 'Variables', icon: SlidersHorizontalIcon },
                        { key: 'scripts', label: 'Install Script', icon: CodeIcon },
                        { key: 'manage', label: 'Manage', icon: Settings02Icon },
                    ] as const
                ).map(({ key, label, icon: Icon }) => (
                    <button
                        key={key}
                        type='button'
                        onClick={() => setActiveTab(key)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            activeTab === key
                                ? 'bg-mocha-400 text-cream-400 shadow-sm'
                                : 'text-mocha-200 hover:text-cream-400 hover:bg-mocha-400/30'
                        }`}
                    >
                        <HugeiconsIcon icon={Icon} className='w-4 h-4' />
                        {label}
                    </button>
                ))}
            </div>

            {/* ── Tab Content ── */}
            <div className='mt-4'>
                {/* ── Configuration Tab ── */}
                {activeTab === 'configuration' && (
                    <div className='space-y-6'>
                        {/* Profile Card */}
                        <div className='bg-mocha-500 border border-mocha-400 rounded-xl p-6'>
                            <div className='flex flex-col sm:flex-row items-start sm:items-center gap-5'>
                                <div className='w-16 h-16 rounded-xl bg-brand/10 flex items-center justify-center shrink-0 border border-mocha-400'>
                                    <HugeiconsIcon icon={EggsIcon} className='w-8 h-8 text-cream-400' />
                                </div>
                                <div className='flex-1 min-w-0'>
                                    <p className='text-cream-400 font-medium text-lg'>{egg.name}</p>
                                    {egg.description && (
                                        <p className='text-mocha-200 text-sm mt-0.5'>{egg.description}</p>
                                    )}
                                </div>
                                <div className='flex items-center gap-3'>
                                    <div className='text-center bg-mocha-600/50 rounded-lg px-4 py-3'>
                                        <p className='text-2xl font-bold text-cream-400'>{dockerImageCount}</p>
                                        <p className='text-xs text-mocha-200'>Images</p>
                                    </div>
                                    {egg.features && egg.features.length > 0 && (
                                        <div className='text-center bg-mocha-600/50 rounded-lg px-4 py-3'>
                                            <p className='text-2xl font-bold text-cream-400'>{egg.features.length}</p>
                                            <p className='text-xs text-mocha-200'>Features</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Basic Settings Card */}
                        <div className='bg-mocha-500 border border-mocha-400 rounded-xl p-6'>
                            <div className='flex items-center justify-between mb-6'>
                                <div className='flex items-center gap-3'>
                                    <div className='w-10 h-10 bg-mocha-400 rounded-lg flex items-center justify-center'>
                                        <HugeiconsIcon icon={Settings02Icon} className='w-5 h-5 text-cream-400' />
                                    </div>
                                    <div>
                                        <h3 className='text-cream-400 font-semibold text-lg'>Basic Settings</h3>
                                        <p className='text-mocha-200 text-sm'>
                                            Core egg configuration and identification
                                        </p>
                                    </div>
                                </div>
                                {!editing && (
                                    <Button variant='secondary' onClick={() => setEditing(true)}>
                                        Edit Configuration
                                    </Button>
                                )}
                            </div>

                            {editing ? (
                                <div className='space-y-5'>
                                    <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
                                        <div>
                                            <label className={labelClass} htmlFor='egg-name'>
                                                Egg Name *
                                            </label>
                                            <input
                                                id='egg-name'
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                className={inputClass}
                                                placeholder='My Egg'
                                            />
                                        </div>
                                        <div>
                                            <label className={labelClass} htmlFor='features'>
                                                Features (comma-separated)
                                            </label>
                                            <input
                                                id='features'
                                                value={features}
                                                onChange={(e) => setFeatures(e.target.value)}
                                                placeholder='e.g. eula, auto_update'
                                                className={inputClass}
                                            />
                                            <p className='text-mocha-200 text-xs mt-1.5'>
                                                Common: eula, auto_update, force_update
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        <label className={labelClass} htmlFor='description'>
                                            Description
                                        </label>
                                        <textarea
                                            id='description'
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            className={inputClass}
                                            rows={3}
                                            placeholder='Optional description for this egg'
                                        />
                                    </div>

                                    <div>
                                        <label className={labelClass} htmlFor='startup-command'>
                                            Startup Command *
                                        </label>
                                        <textarea
                                            id='startup-command'
                                            value={startup}
                                            onChange={(e) => setStartup(e.target.value)}
                                            className={`${inputClass} font-mono text-xs`}
                                            rows={4}
                                            placeholder='{"{{SERVER_JAVA}}" {{SERVER_JAVA_FLAGS}} -jar {{SERVER_JAR}}}'
                                        />
                                        <p className='text-mocha-200 text-xs mt-1.5'>
                                            Use variables like {'{{SERVER_JAVA}}'}, {'{{SERVER_JAR}}'}, etc.
                                        </p>
                                    </div>

                                    <div className='flex items-center gap-2'>
                                        <Checkbox
                                            id='forceIp'
                                            checked={forceOutgoingIp}
                                            onChange={(e) => setForceOutgoingIp(e.target.checked)}
                                            label='Force Outgoing IP'
                                        />
                                    </div>

                                    <div className='flex items-center gap-3 pt-2'>
                                        <Button variant='default' onClick={handleSave} disabled={saving}>
                                            {saving ? 'Saving...' : 'Save Changes'}
                                        </Button>
                                        <Button
                                            variant='secondary'
                                            onClick={() => {
                                                syncFromEgg();
                                                setEditing(false);
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className='space-y-4'>
                                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                                        <div className='bg-mocha-600/50 rounded-lg p-4'>
                                            <span className='text-mocha-200 text-xs uppercase tracking-wider'>
                                                Egg ID
                                            </span>
                                            <p className='text-cream-400 font-medium mt-1'>{egg.id}</p>
                                        </div>
                                        <div className='bg-mocha-600/50 rounded-lg p-4'>
                                            <span className='text-mocha-200 text-xs uppercase tracking-wider'>
                                                UUID
                                            </span>
                                            <p
                                                className='text-cream-400 font-mono text-sm mt-1 truncate'
                                                title={egg.uuid}
                                            >
                                                {egg.uuid}
                                            </p>
                                        </div>
                                        <div className='bg-mocha-600/50 rounded-lg p-4'>
                                            <span className='text-mocha-200 text-xs uppercase tracking-wider'>
                                                Author
                                            </span>
                                            <p className='text-cream-400 text-sm mt-1'>{egg.author}</p>
                                        </div>
                                        <div className='bg-mocha-600/50 rounded-lg p-4'>
                                            <span className='text-mocha-200 text-xs uppercase tracking-wider'>
                                                Name
                                            </span>
                                            <p className='text-cream-400 font-medium mt-1'>{egg.name}</p>
                                        </div>
                                        <div className='bg-mocha-600/50 rounded-lg p-4'>
                                            <span className='text-mocha-200 text-xs uppercase tracking-wider'>
                                                Description
                                            </span>
                                            <p className='text-cream-400 text-sm mt-1'>
                                                {egg.description || <span className='text-mocha-200/60'>None</span>}
                                            </p>
                                        </div>
                                        <div className='bg-mocha-600/50 rounded-lg p-4'>
                                            <span className='text-mocha-200 text-xs uppercase tracking-wider'>
                                                Docker Images
                                            </span>
                                            <p className='text-cream-400 font-medium mt-1'>{dockerImageCount}</p>
                                        </div>
                                        <div className='bg-mocha-600/50 rounded-lg p-4'>
                                            <span className='text-mocha-200 text-xs uppercase tracking-wider'>
                                                Features
                                            </span>
                                            <p className='text-cream-400 text-sm mt-1'>
                                                {egg.features && egg.features.length > 0 ? (
                                                    egg.features.join(', ')
                                                ) : (
                                                    <span className='text-mocha-200/60'>None</span>
                                                )}
                                            </p>
                                        </div>
                                        <div className='bg-mocha-600/50 rounded-lg p-4'>
                                            <span className='text-mocha-200 text-xs uppercase tracking-wider'>
                                                Force Outgoing IP
                                            </span>
                                            <p className='text-cream-400 text-sm mt-1'>
                                                {egg.forceOutgoingIp ? 'Yes' : 'No'}
                                            </p>
                                        </div>
                                        <div className='bg-mocha-600/50 rounded-lg p-4'>
                                            <span className='text-mocha-200 text-xs uppercase tracking-wider'>
                                                Created
                                            </span>
                                            <p className='text-cream-400 text-sm mt-1' title={egg.createdAt}>
                                                {createdAge}
                                            </p>
                                        </div>
                                        <div className='bg-mocha-600/50 rounded-lg p-4'>
                                            <span className='text-mocha-200 text-xs uppercase tracking-wider'>
                                                Last Updated
                                            </span>
                                            <p className='text-cream-400 text-sm mt-1' title={egg.updatedAt}>
                                                {egg.updatedAt ? new Date(egg.updatedAt).toLocaleDateString() : '—'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Docker Images Card */}
                        <div className='bg-mocha-500 border border-mocha-400 rounded-xl p-6'>
                            <div className='flex items-center gap-3 mb-6'>
                                <div className='w-10 h-10 bg-mocha-400 rounded-lg flex items-center justify-center'>
                                    <HugeiconsIcon icon={SlidersHorizontalIcon} className='w-5 h-5 text-cream-400' />
                                </div>
                                <div>
                                    <h3 className='text-cream-400 font-semibold text-lg'>Docker Images</h3>
                                    <p className='text-mocha-200 text-sm'>Container images available for this egg</p>
                                </div>
                            </div>

                            {editing ? (
                                <div>
                                    <label className={labelClass} htmlFor='image-definitions'>
                                        Image Definitions
                                    </label>
                                    <textarea
                                        id='image-definitions'
                                        value={dockerImages}
                                        onChange={(e) => setDockerImages(e.target.value)}
                                        className={`${inputClass} font-mono text-xs`}
                                        rows={6}
                                        placeholder='java|ghcr.io/pterodactyl/yolks:java_17'
                                    />
                                    <p className='text-mocha-200 text-xs mt-1.5'>
                                        Format: key|image (one per line). Example:{' '}
                                        <code className='text-cream-400'>java|ghcr.io/pterodactyl/yolks:java_17</code>
                                    </p>
                                </div>
                            ) : (
                                <div className='space-y-2'>
                                    {Object.entries(egg.dockerImages || {}).map(([key, value]) => (
                                        <div
                                            key={key}
                                            className='flex items-center gap-3 bg-mocha-600/50 rounded-lg p-3'
                                        >
                                            <code className='text-cream-400 text-sm font-medium min-w-[80px]'>
                                                {key}
                                            </code>
                                            <span className='text-mocha-200/40'>→</span>
                                            <code className='text-mocha-200 text-xs font-mono break-all'>{value}</code>
                                        </div>
                                    ))}
                                    {Object.keys(egg.dockerImages || {}).length === 0 && (
                                        <p className='text-mocha-200/60 text-sm'>No docker images configured.</p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Process Management Card */}
                        <div className='bg-mocha-500 border border-mocha-400 rounded-xl p-6'>
                            <div className='flex items-center gap-3 mb-6'>
                                <div className='w-10 h-10 bg-mocha-400 rounded-lg flex items-center justify-center'>
                                    <HugeiconsIcon icon={CodeIcon} className='w-5 h-5 text-cream-400' />
                                </div>
                                <div>
                                    <h3 className='text-cream-400 font-semibold text-lg'>Process Management</h3>
                                    <p className='text-mocha-200 text-sm'>Server lifecycle and configuration</p>
                                </div>
                            </div>

                            {editing ? (
                                <div className='space-y-4'>
                                    <div>
                                        <label className={labelClass} htmlFor='config-from'>
                                            Copy Settings From (Egg ID)
                                        </label>
                                        <input
                                            id='config-from'
                                            type='number'
                                            value={configFrom ?? ''}
                                            onChange={(e) =>
                                                setConfigFrom(e.target.value ? Number(e.target.value) : null)
                                            }
                                            className={inputClass}
                                            placeholder='Leave empty to use default settings'
                                        />
                                        <p className='text-mocha-200 text-xs mt-1.5'>
                                            Inherit configuration from another egg
                                        </p>
                                    </div>

                                    <div>
                                        <label className={labelClass} htmlFor='stop-command'>
                                            Stop Command
                                        </label>
                                        <input
                                            id='stop-command'
                                            value={configStop}
                                            onChange={(e) => setConfigStop(e.target.value)}
                                            className={`${inputClass} font-mono text-xs`}
                                            placeholder='{{SERVER_JAVA}} {{SERVER_JAVA_FLAGS}} -jar {{SERVER_JAR}}'
                                        />
                                    </div>

                                    <div>
                                        <label className={labelClass} htmlFor='startup-config'>
                                            Startup Configuration (JSON)
                                        </label>
                                        <textarea
                                            id='startup-config'
                                            value={configStartup}
                                            onChange={(e) => setConfigStartup(e.target.value)}
                                            className={`${inputClass} font-mono text-xs`}
                                            rows={4}
                                            placeholder='{"done": "Server started successfully"}'
                                        />
                                        <p className='text-mocha-200 text-xs mt-1.5'>
                                            Regex patterns to detect when server is ready
                                        </p>
                                    </div>

                                    <div>
                                        <label className={labelClass} htmlFor='log-config'>
                                            Log Configuration (JSON)
                                        </label>
                                        <textarea
                                            id='log-config'
                                            value={configLogs}
                                            onChange={(e) => setConfigLogs(e.target.value)}
                                            className={`${inputClass} font-mono text-xs`}
                                            rows={4}
                                            placeholder='{"prefix": "\\u001b[32m\\[Server\\]"}'
                                        />
                                    </div>

                                    <div>
                                        <label className={labelClass} htmlFor='config-files'>
                                            Configuration Files (JSON)
                                        </label>
                                        <textarea
                                            id='config-files'
                                            value={configFiles}
                                            onChange={(e) => setConfigFiles(e.target.value)}
                                            className={`${inputClass} font-mono text-xs`}
                                            rows={5}
                                            placeholder='{"server.properties": {"match": "//", "replace": "..."}}'
                                        />
                                        <p className='text-mocha-200 text-xs mt-1.5'>
                                            Define files that should be created/updated on server
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                                    <div className='bg-mocha-600/50 rounded-lg p-4'>
                                        <span className='text-mocha-200 text-xs uppercase tracking-wider'>
                                            Copy From
                                        </span>
                                        <p className='text-cream-400 text-sm mt-1'>
                                            {egg.config.extends ? (
                                                `Egg #${egg.config.extends}`
                                            ) : (
                                                <span className='text-mocha-200/60'>None</span>
                                            )}
                                        </p>
                                    </div>
                                    <div className='bg-mocha-600/50 rounded-lg p-4'>
                                        <span className='text-mocha-200 text-xs uppercase tracking-wider'>
                                            Stop Command
                                        </span>
                                        <p
                                            className='text-cream-400 font-mono text-xs mt-1 truncate'
                                            title={egg.config.stop || ''}
                                        >
                                            {egg.config.stop || <span className='text-mocha-200/60'>Default</span>}
                                        </p>
                                    </div>
                                    <div className='bg-mocha-600/50 rounded-lg p-4'>
                                        <span className='text-mocha-200 text-xs uppercase tracking-wider'>
                                            Startup Config
                                        </span>
                                        <p className='text-cream-400 text-sm mt-1'>
                                            {egg.config.startup ? (
                                                'Configured'
                                            ) : (
                                                <span className='text-mocha-200/60'>None</span>
                                            )}
                                        </p>
                                    </div>
                                    <div className='bg-mocha-600/50 rounded-lg p-4'>
                                        <span className='text-mocha-200 text-xs uppercase tracking-wider'>
                                            Log Config
                                        </span>
                                        <p className='text-cream-400 text-sm mt-1'>
                                            {egg.config.logs ? (
                                                'Configured'
                                            ) : (
                                                <span className='text-mocha-200/60'>None</span>
                                            )}
                                        </p>
                                    </div>
                                    <div className='bg-mocha-600/50 rounded-lg p-4'>
                                        <span className='text-mocha-200 text-xs uppercase tracking-wider'>
                                            Config Files
                                        </span>
                                        <p className='text-cream-400 text-sm mt-1'>
                                            {egg.config.files ? (
                                                'Defined'
                                            ) : (
                                                <span className='text-mocha-200/60'>None</span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Startup Command Card */}
                        <div className='bg-mocha-500 border border-mocha-400 rounded-xl p-6'>
                            <div className='flex items-center gap-3 mb-6'>
                                <div className='w-10 h-10 bg-mocha-400 rounded-lg flex items-center justify-center'>
                                    <HugeiconsIcon icon={CodeIcon} className='w-5 h-5 text-cream-400' />
                                </div>
                                <div>
                                    <h3 className='text-cream-400 font-semibold text-lg'>Startup Command</h3>
                                    <p className='text-mocha-200 text-sm'>Default command used to start servers</p>
                                </div>
                            </div>
                            {editing ? null : (
                                <pre className='bg-mocha-600/50 rounded-lg p-4 text-xs font-mono text-cream-400 overflow-x-auto whitespace-pre-wrap break-all'>
                                    {egg.startup || 'No startup command configured.'}
                                </pre>
                            )}
                        </div>
                    </div>
                )}

                {/* ── Variables Tab ── */}
                {activeTab === 'variables' && <AdminEggVariablesContainer nestId={nestId} eggId={eggId} />}

                {/* ── Install Script Tab ── */}
                {activeTab === 'scripts' && <AdminEggScriptsContainer nestId={nestId} eggId={eggId} />}

                {/* ── Manage Tab ── */}
                {activeTab === 'manage' && (
                    <div className='space-y-6'>
                        <div className='bg-mocha-500 border-2 border-red-800/50 rounded-xl p-6'>
                            <div className='flex items-center gap-3 mb-4'>
                                <div className='w-10 h-10 bg-red-900/50 rounded-lg flex items-center justify-center'>
                                    <HugeiconsIcon icon={Delete02Icon} className='w-5 h-5 text-red-400' />
                                </div>
                                <div>
                                    <h3 className='text-red-400 font-semibold text-lg'>Danger Zone</h3>
                                    <p className='text-mocha-200 text-sm'>Irreversible actions</p>
                                </div>
                            </div>

                            <p className='text-sm text-mocha-200 mb-4'>
                                Permanently delete this egg. Any servers using this egg will not be affected, but they
                                will no longer be able to be reinstalled. This action cannot be undone.
                            </p>
                            <Button variant='attention' onClick={() => setShowDeleteConfirm(true)} disabled={deleting}>
                                {deleting ? 'Deleting...' : 'Delete Egg'}
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            <Dialog.Confirm
                open={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirmed={handleDelete}
                title='Delete Egg'
                confirm='Delete'
            >
                Are you sure you want to permanently delete egg <strong>{egg.name}</strong>? This action cannot be
                undone.
            </Dialog.Confirm>
        </div>
    );
};

export default AdminEggViewContainer;
