import { useState } from 'react';
import { Link, Route, Routes, useParams, useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import Spinner from '@/components/elements/Spinner';
import ButtonV2 from '@/components/elements/ButtonV2';
import { getEgg, updateEgg, deleteEgg, type AdminEgg } from '@/api/admin/nests';
import { httpErrorToHuman } from '@/api/http';
import AdminEggVariablesContainer from '@/components/admin/nests/AdminEggVariablesContainer';
import AdminEggScriptsContainer from '@/components/admin/nests/AdminEggScriptsContainer';

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

    const handleSave = () => {
        setError(null);
        setSuccess(false);
        setSaving(true);

        const images: Record<string, string> = {};
        dockerImages.split('\n').filter(Boolean).forEach((line) => {
            const [key, ...rest] = line.split('|');
            images[key.trim()] = rest.join('|').trim() || key.trim();
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

        updateEgg(nestId, eggId, data)
            .then(() => {
                setSuccess(true);
                eggMutate();
                setTimeout(() => setSuccess(false), 3000);
            })
            .catch((e) => setError(httpErrorToHuman(e)))
            .finally(() => setSaving(false));
    };

    const handleDelete = () => {
        if (!confirm('Delete this egg?')) return;
        setDeleting(true);
        deleteEgg(nestId, eggId)
            .then(() => navigate(`/admin/nests/${nestId}`))
            .catch((e) => {
                setError(httpErrorToHuman(e));
                setDeleting(false);
            });
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
                    <div>
                        <MainPageHeader title={egg.name} headChildren={
                            <Link to={`/admin/nests/${nestId}`} className='text-sm text-gray-500 hover:text-gray-300'>&larr; Back to Nest</Link>
                        }>
                            <ButtonV2 onClick={handleExport}>Export</ButtonV2>
                            <ButtonV2 onClick={handleSave} disabled={saving || deleting}>
                                {saving ? 'Saving...' : 'Save'}
                            </ButtonV2>
                            <ButtonV2 onClick={handleDelete} disabled={saving || deleting} className='!text-red-400'>
                                {deleting ? 'Deleting...' : 'Delete'}
                            </ButtonV2>
                        </MainPageHeader>

                        {(error || eggError) && <div className='text-red-400 mb-4 text-sm'>{error || httpErrorToHuman(eggError)}</div>}
                        {success && <div className='text-green-400 mb-4 text-sm'>Egg updated.</div>}

                        <div className='flex gap-1 mb-6 border-b border-gray-800'>
                            {tabs.map((tab) => (
                                <Link
                                    key={tab.to}
                                    to={tab.to}
                                    end={tab.end}
                                    className='px-4 py-2 text-sm text-gray-400 hover:text-gray-200 border-b-2 border-transparent [&.active]:text-gray-200 [&.active]:border-gray-200 transition-colors'
                                >
                                    {tab.label}
                                </Link>
                            ))}
                        </div>

                        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                            <div className='space-y-6'>
                                <div className='bg-[#1a1a1a] border border-gray-800 rounded-lg p-6'>
                                    <h4 className='text-gray-200 font-medium mb-4'>Basic Settings</h4>
                                    <div className='mb-4'>
                                        <label className='block text-sm text-gray-400 mb-1'>Name</label>
                                        <input value={name} onChange={(e) => setName(e.target.value)}
                                            className='w-full bg-transparent border border-gray-700 rounded px-3 py-2 text-gray-200' />
                                    </div>
                                    <div className='mb-4'>
                                        <label className='block text-sm text-gray-400 mb-1'>Description</label>
                                        <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                                            className='w-full bg-transparent border border-gray-700 rounded px-3 py-2 text-gray-200 text-sm' rows={3} />
                                    </div>
                                    <div className='mb-4'>
                                        <label className='block text-sm text-gray-400 mb-1'>Startup Command</label>
                                        <textarea value={startup} onChange={(e) => setStartup(e.target.value)}
                                            className='w-full bg-transparent border border-gray-700 rounded px-3 py-2 text-gray-200 text-sm font-mono' rows={3} />
                                    </div>
                                    <div className='mb-4'>
                                        <label className='block text-sm text-gray-400 mb-1'>Features (comma-separated)</label>
                                        <input value={features} onChange={(e) => setFeatures(e.target.value)}
                                            placeholder='e.g. eula'
                                            className='w-full bg-transparent border border-gray-700 rounded px-3 py-2 text-gray-200 text-sm' />
                                    </div>
                                    <div className='flex items-center gap-2'>
                                        <input type='checkbox' id='forceIp' checked={forceOutgoingIp}
                                            onChange={(e) => setForceOutgoingIp(e.target.checked)}
                                            className='rounded border-gray-700 bg-transparent' />
                                        <label htmlFor='forceIp' className='text-sm text-gray-400'>Force Outgoing IP</label>
                                    </div>
                                </div>

                                <div className='bg-[#1a1a1a] border border-gray-800 rounded-lg p-6'>
                                    <h4 className='text-gray-200 font-medium mb-4'>Docker Images</h4>
                                    <p className='text-xs text-gray-500 mb-2'>One per line: key|image</p>
                                    <textarea value={dockerImages} onChange={(e) => setDockerImages(e.target.value)}
                                        className='w-full bg-transparent border border-gray-700 rounded px-3 py-2 text-gray-200 text-sm font-mono' rows={5} />
                                </div>
                            </div>

                            <div className='space-y-6'>
                                <div className='bg-[#1a1a1a] border border-gray-800 rounded-lg p-6'>
                                    <h4 className='text-gray-200 font-medium mb-4'>Egg Info</h4>
                                    <div className='space-y-2 text-sm'>
                                        <div className='flex justify-between'><span className='text-gray-500'>UUID</span><span className='text-gray-300'>{egg.uuid}</span></div>
                                        <div className='flex justify-between'><span className='text-gray-500'>Author</span><span className='text-gray-300'>{egg.author}</span></div>
                                        <div className='flex justify-between'><span className='text-gray-500'>Nest ID</span><span className='text-gray-300'>{egg.nest}</span></div>
                                    </div>
                                </div>

                                <div className='bg-[#1a1a1a] border border-gray-800 rounded-lg p-6'>
                                    <h4 className='text-gray-200 font-medium mb-4'>Process Management</h4>
                                    <div className='mb-4'>
                                        <label className='block text-sm text-gray-400 mb-1'>Copy Settings From (Egg ID)</label>
                                        <input type='number' value={configFrom ?? ''} onChange={(e) => setConfigFrom(e.target.value ? Number(e.target.value) : null)}
                                            className='w-full bg-transparent border border-gray-700 rounded px-3 py-2 text-gray-200' />
                                    </div>
                                    <div className='mb-4'>
                                        <label className='block text-sm text-gray-400 mb-1'>Stop Command</label>
                                        <input value={configStop} onChange={(e) => setConfigStop(e.target.value)}
                                            className='w-full bg-transparent border border-gray-700 rounded px-3 py-2 text-gray-200 font-mono' />
                                    </div>
                                    <div className='mb-4'>
                                        <label className='block text-sm text-gray-400 mb-1'>Startup Configuration (JSON)</label>
                                        <textarea value={configStartup} onChange={(e) => setConfigStartup(e.target.value)}
                                            className='w-full bg-transparent border border-gray-700 rounded px-3 py-2 text-gray-200 text-sm font-mono' rows={3} />
                                    </div>
                                    <div className='mb-4'>
                                        <label className='block text-sm text-gray-400 mb-1'>Log Configuration (JSON)</label>
                                        <textarea value={configLogs} onChange={(e) => setConfigLogs(e.target.value)}
                                            className='w-full bg-transparent border border-gray-700 rounded px-3 py-2 text-gray-200 text-sm font-mono' rows={3} />
                                    </div>
                                    <div>
                                        <label className='block text-sm text-gray-400 mb-1'>Configuration Files (JSON)</label>
                                        <textarea value={configFiles} onChange={(e) => setConfigFiles(e.target.value)}
                                            className='w-full bg-transparent border border-gray-700 rounded px-3 py-2 text-gray-200 text-sm font-mono' rows={4} />
                                    </div>
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
