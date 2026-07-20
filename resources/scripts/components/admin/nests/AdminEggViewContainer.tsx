import { useState } from 'react';
import { Link, Route, Routes, useParams, useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import { toast } from 'sonner';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import Spinner from '@/components/elements/Spinner';
import { Button } from '@/components/ui/button';
import { getEgg, updateEgg, deleteEgg, type AdminEgg } from '@/api/admin/nests';
import { httpErrorToHuman } from '@/api/http';
import AdminEggVariablesContainer from '@/components/admin/nests/AdminEggVariablesContainer';
import AdminEggScriptsContainer from '@/components/admin/nests/AdminEggScriptsContainer';

const inputClass =
    'w-full bg-mocha-600 border border-mocha-400 rounded px-3 py-2 text-sm text-cream-400 focus:outline-none focus:border-mocha-300 transition-colors';
const labelClass = 'block text-sm text-mocha-200 mb-1';

const AdminEggViewContainer = () => {
    const { id: nestIdParam, eggId: eggIdParam } = useParams<{ id: string; eggId: string }>();
    const navigate = useNavigate();
    const nestId = Number(nestIdParam);
    const eggId = Number(eggIdParam);

    const { data: egg, error: eggError, mutate: eggMutate } = useSWR(
        ['admin:egg', nestId, eggId],
        () => getEgg(nestId, eggId),
    );

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
    const [initialized, setInitialized] = useState(false);

    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    if (egg && !initialized) {
        setName(egg.name);
        setDescription(egg.description || '');
        setStartup(egg.startup || '');
        setDockerImages(Object.entries(egg.dockerImages || {}).map(([k, v]) => `${k}|${v}`).join('\n'));
        setForceOutgoingIp(egg.forceOutgoingIp || false);
        setFeatures((egg.features || []).join(', '));
        setConfigFrom(egg.config.extends);
        setConfigStop(egg.config.stop || '');
        setConfigStartup(egg.config.startup || '');
        setConfigLogs(egg.config.logs || '');
        setConfigFiles(egg.config.files ? JSON.stringify(egg.config.files, null, 2) : '');
        setInitialized(true);
    }

    const handleSave = async () => {
        setError(null);
        setSaving(true);

        const images: Record<string, string> = {};
        dockerImages.split('\n').filter(Boolean).forEach((line) => {
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
            features: features ? features.split(',').map((f) => f.trim()).filter(Boolean) : null,
            config_from: configFrom,
            config_stop: configStop || null,
            config_startup: configStartup || null,
            config_logs: configLogs || null,
        };

        let filesParsed: Record<string, unknown> | null = null;
        if (configFiles.trim()) {
            try { filesParsed = JSON.parse(configFiles); } catch { /* ignore */ }
        }
        if (filesParsed) {
            data.config_files = JSON.stringify(filesParsed);
        }

        try {
            await updateEgg(nestId, eggId, data);
            await eggMutate();
            toast.success('Egg saved successfully');
        } catch (e: any) {
            toast.error(httpErrorToHuman(e));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this egg? This action cannot be undone.')) return;
        setDeleting(true);
        try {
            await deleteEgg(nestId, eggId);
            toast.success('Egg deleted successfully');
            navigate(`/admin/nests/${nestId}`);
        } catch (e: any) {
            toast.error(httpErrorToHuman(e));
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

    if (!egg) return <div className='p-4'>{eggError ? <div className='text-red-400'>{httpErrorToHuman(eggError)}</div> : <Spinner />}</div>;

    const tabs = [
        { to: '', label: 'Configuration', end: true },
        { to: 'variables', label: 'Variables', end: false },
        { to: 'scripts', label: 'Install Script', end: false },
    ];

    return (
        <Routes>
            <Route
                index
                element={
                    <div className='space-y-6'>
                        <div className='flex items-center justify-between'>
                            <div className='flex items-center gap-4'>
                                <Link to={`/admin/nests/${nestId}`} className='text-sm text-mocha-200 hover:text-mocha-100 transition-colors'>
                                    &larr; Back to Nest
                                </Link>
                                <h1 className='text-2xl font-semibold text-cream-400'>{egg.name}</h1>
                            </div>
                            <div className='flex items-center gap-2'>
                                <Button variant='secondary' onClick={handleExport}>Export</Button>
                                <Button variant='default' onClick={handleSave} disabled={saving || deleting}>
                                    {saving ? 'Saving...' : 'Save'}
                                </Button>
                                <Button variant='attention' onClick={handleDelete} disabled={saving || deleting}>
                                    {deleting ? 'Deleting...' : 'Delete'}
                                </Button>
                            </div>
                        </div>

                        {/* Tab Navigation */}
                        <div className='flex items-center space-x-1 border-b border-mocha-400 overflow-x-auto'>
                            {tabs.map((tab) => (
                                <Link
                                    key={tab.to}
                                    to={tab.to}
                                    className={`whitespace-nowrap px-4 py-3 text-sm font-medium transition-all ${
                                        tab.end
                                            ? 'text-cream-400 border-b-2 border-cream-400'
                                            : 'text-mocha-200 hover:text-mocha-100'
                                    }`}
                                >
                                    {tab.label}
                                </Link>
                            ))}
                        </div>

                        {/* Basic Settings Card */}
                        <div className='bg-mocha-500 border border-mocha-400 rounded-xl p-6'>
                            <div className='flex items-center gap-3 mb-6'>
                                <div className='w-10 h-10 bg-mocha-400 rounded-lg flex items-center justify-center'>
                                    <svg className='w-5 h-5 text-cream-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' />
                                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className='text-cream-400 font-semibold text-lg'>Basic Settings</h3>
                                    <p className='text-mocha-200 text-sm'>Core egg configuration and identification</p>
                                </div>
                            </div>

                            <div className='space-y-4'>
                                <div>
                                    <label className={labelClass}>Egg Name *</label>
                                    <input value={name} onChange={(e) => setName(e.target.value)}
                                        className={inputClass} placeholder='My Egg' />
                                </div>

                                <div>
                                    <label className={labelClass}>Description</label>
                                    <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                                        className={inputClass} rows={3} placeholder='Optional description for this egg' />
                                </div>

                                <div>
                                    <label className={labelClass}>Startup Command *</label>
                                    <textarea value={startup} onChange={(e) => setStartup(e.target.value)}
                                        className={inputClass + ' font-mono text-xs'} rows={4} placeholder='{"{{SERVER_JAVA}}" {{SERVER_JAVA_FLAGS}} -jar {{SERVER_JAR}}}' />
                                    <p className='text-mocha-200 text-xs mt-1.5'>Use variables like {'{{SERVER_JAVA}}'}, {'{{SERVER_JAR}}'}, etc.</p>
                                </div>

                                <div>
                                    <label className={labelClass}>Features (comma-separated)</label>
                                    <input value={features} onChange={(e) => setFeatures(e.target.value)}
                                        placeholder='e.g. eula, auto_update'
                                        className={inputClass} />
                                    <p className='text-mocha-200 text-xs mt-1.5'>Common features: eula, auto_update, force_update</p>
                                </div>

                                <div className='flex items-center gap-2'>
                                    <input type='checkbox' id='forceIp' checked={forceOutgoingIp}
                                        onChange={(e) => setForceOutgoingIp(e.target.checked)}
                                        className='rounded border-mocha-400 w-4 h-4' />
                                    <label htmlFor='forceIp' className='text-sm text-cream-400 cursor-pointer'>Force Outgoing IP</label>
                                </div>
                            </div>
                        </div>

                        {/* Docker Images Card */}
                        <div className='bg-mocha-500 border border-mocha-400 rounded-xl p-6'>
                            <div className='flex items-center gap-3 mb-6'>
                                <div className='w-10 h-10 bg-mocha-400 rounded-lg flex items-center justify-center'>
                                    <svg className='w-5 h-5 text-cream-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4' />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className='text-cream-400 font-semibold text-lg'>Docker Images</h3>
                                    <p className='text-mocha-200 text-sm'>Container images available for this egg</p>
                                </div>
                            </div>

                            <div>
                                <label className={labelClass}>Image Definitions</label>
                                <textarea value={dockerImages} onChange={(e) => setDockerImages(e.target.value)}
                                    className={inputClass + ' font-mono text-xs'} rows={6} placeholder='java|ghcr.io/pterodactyl/yolks:java_17' />
                                <p className='text-mocha-200 text-xs mt-1.5'>Format: key|image (one per line). Example: <code className='text-cream-400'>java|ghcr.io/pterodactyl/yolks:java_17</code></p>
                            </div>
                        </div>

                        {/* Process Management Card */}
                        <div className='bg-mocha-500 border border-mocha-400 rounded-xl p-6'>
                            <div className='flex items-center gap-3 mb-6'>
                                <div className='w-10 h-10 bg-mocha-400 rounded-lg flex items-center justify-center'>
                                    <svg className='w-5 h-5 text-cream-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className='text-cream-400 font-semibold text-lg'>Process Management</h3>
                                    <p className='text-mocha-200 text-sm'>Server lifecycle and configuration</p>
                                </div>
                            </div>

                            <div className='space-y-4'>
                                <div>
                                    <label className={labelClass}>Copy Settings From (Egg ID)</label>
                                    <input type='number' value={configFrom ?? ''} onChange={(e) => setConfigFrom(e.target.value ? Number(e.target.value) : null)}
                                        className={inputClass} placeholder='Leave empty to use default settings' />
                                    <p className='text-mocha-200 text-xs mt-1.5'>Inherit configuration from another egg</p>
                                </div>

                                <div>
                                    <label className={labelClass}>Stop Command</label>
                                    <input value={configStop} onChange={(e) => setConfigStop(e.target.value)}
                                        className={inputClass + ' font-mono text-xs'} placeholder='{{SERVER_JAVA}} {{SERVER_JAVA_FLAGS}} -jar {{SERVER_JAR}}' />
                                </div>

                                <div>
                                    <label className={labelClass}>Startup Configuration (JSON)</label>
                                    <textarea value={configStartup} onChange={(e) => setConfigStartup(e.target.value)}
                                        className={inputClass + ' font-mono text-xs'} rows={4} placeholder='{"done": "Server started successfully"}' />
                                    <p className='text-mocha-200 text-xs mt-1.5'>Regex patterns to detect when server is ready</p>
                                </div>

                                <div>
                                    <label className={labelClass}>Log Configuration (JSON)</label>
                                    <textarea value={configLogs} onChange={(e) => setConfigLogs(e.target.value)}
                                        className={inputClass + ' font-mono text-xs'} rows={4} placeholder='{"prefix": "\\u001b[32m\\[Server\\]"}' />
                                </div>

                                <div>
                                    <label className={labelClass}>Configuration Files (JSON)</label>
                                    <textarea value={configFiles} onChange={(e) => setConfigFiles(e.target.value)}
                                        className={inputClass + ' font-mono text-xs'} rows={5} placeholder='{"server.properties": {"match": "//", "replace": "..."}}' />
                                    <p className='text-mocha-200 text-xs mt-1.5'>Define files that should be created/updated on server</p>
                                </div>
                            </div>
                        </div>

                        {/* Egg Information Card */}
                        <div className='bg-mocha-500/50 border border-mocha-400/50 rounded-xl p-6'>
                            <div className='flex items-center gap-3 mb-4'>
                                <div className='w-10 h-10 bg-mocha-400/50 rounded-lg flex items-center justify-center'>
                                    <svg className='w-5 h-5 text-mocha-200' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className='text-mocha-200 font-semibold'>Egg Information</h3>
                                    <p className='text-mocha-300 text-xs'>Read-only system information</p>
                                </div>
                            </div>

                            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                                <div className='bg-mocha-600/30 rounded-lg p-3'>
                                    <span className='text-mocha-200 text-xs uppercase tracking-wider'>UUID</span>
                                    <p className='text-cream-400 font-mono text-sm mt-1 break-all'>{egg.uuid}</p>
                                </div>
                                <div className='bg-mocha-600/30 rounded-lg p-3'>
                                    <span className='text-mocha-200 text-xs uppercase tracking-wider'>Author</span>
                                    <p className='text-cream-400 text-sm mt-1'>{egg.author}</p>
                                </div>
                                <div className='bg-mocha-600/30 rounded-lg p-3'>
                                    <span className='text-mocha-200 text-xs uppercase tracking-wider'>Nest ID</span>
                                    <p className='text-cream-400 text-sm mt-1'>#{egg.nest}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                }
            />
            <Route path='variables' element={<AdminEggVariablesContainer nestId={nestId} eggId={eggId} />} />
            <Route path='scripts' element={<AdminEggScriptsContainer nestId={nestId} eggId={eggId} />} />
        </Routes>
    );
};

export default AdminEggViewContainer;
