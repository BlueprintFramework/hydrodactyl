import { useState } from 'react';
import useSWR from 'swr';
import Spinner from '@/components/elements/Spinner';
import ButtonV2 from '@/components/elements/ButtonV2';
import { getEgg, updateEgg, getNestEggs, type AdminEgg } from '@/api/admin/nests';
import { httpErrorToHuman } from '@/api/http';

interface Props {
    nestId: number;
    eggId: number;
}

const AdminEggScriptsContainer = ({ nestId, eggId }: Props) => {
    const { data: egg, error: eggError, mutate: eggMutate } = useSWR(
        ['admin:egg:scripts', nestId, eggId],
        () => getEgg(nestId, eggId),
    );

    const { data: siblings } = useSWR(
        ['admin:nest:eggs:siblings', nestId],
        () => getNestEggs(nestId),
    );

    const [scriptInstall, setScriptInstall] = useState('');
    const [scriptEntry, setScriptEntry] = useState('');
    const [scriptContainer, setScriptContainer] = useState('');
    const [copyScriptFrom, setCopyScriptFrom] = useState<number | null>(null);
    const [scriptIsPrivileged, setScriptIsPrivileged] = useState(false);
    const [initialized, setInitialized] = useState(false);

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    if (egg && !initialized) {
        setScriptInstall(egg.script.install || '');
        setScriptEntry(egg.script.entry);
        setScriptContainer(egg.script.container);
        setCopyScriptFrom(egg.script.extends);
        setScriptIsPrivileged(egg.script.privileged);
        setInitialized(true);
    }

    const handleSave = () => {
        setError(null);
        setSuccess(false);
        setSaving(true);

        updateEgg(nestId, eggId, {
            script_install: scriptInstall || null,
            script_entry: scriptEntry,
            script_container: scriptContainer,
            copy_script_from: copyScriptFrom,
            script_is_privileged: scriptIsPrivileged,
        })
            .then(() => {
                setSuccess(true);
                eggMutate();
                setTimeout(() => setSuccess(false), 3000);
            })
            .catch((e) => setError(httpErrorToHuman(e)))
            .finally(() => setSaving(false));
    };

    if (eggError) return <div className='text-red-400 text-sm p-4'>{httpErrorToHuman(eggError)}</div>;
    if (!egg) return <Spinner />;

    const copyOptions = (siblings?.items || []).filter((e) => e.id !== eggId && !e.script.extends);

    const isCopying = copyScriptFrom !== null;

    return (
        <div className='mt-4'>
            {error && <div className='text-red-400 mb-4 text-sm'>{error}</div>}
            {success && <div className='text-green-400 mb-4 text-sm'>Script updated.</div>}

            {isCopying && (
                <div className='bg-yellow-900/30 border border-yellow-700/50 rounded-lg p-4 mb-6 text-sm text-yellow-300'>
                    This egg is copying its install script from another egg. Changes to the script fields below will be ignored in favor of the copied values.
                </div>
            )}

            <div className='bg-[#1a1a1a] border border-gray-800 rounded-lg p-6 mb-6'>
                <h4 className='text-gray-200 font-medium mb-4'>Copy Script From</h4>
                <select
                    value={copyScriptFrom ?? ''}
                    onChange={(e) => setCopyScriptFrom(e.target.value ? Number(e.target.value) : null)}
                    className='w-full bg-transparent border border-gray-700 rounded px-3 py-2 text-gray-200 text-sm'
                >
                    <option value=''>None (use own script)</option>
                    {copyOptions.map((e) => (
                        <option key={e.id} value={e.id}>{e.name} ({e.id})</option>
                    ))}
                </select>
            </div>

            <div className='bg-[#1a1a1a] border border-gray-800 rounded-lg p-6 mb-6'>
                <h4 className='text-gray-200 font-medium mb-4'>Install Script</h4>
                <div className='mb-4'>
                    <label className='block text-sm text-gray-400 mb-1'>Script (Bash/Dockerfile)</label>
                    <textarea
                        value={scriptInstall}
                        onChange={(e) => setScriptInstall(e.target.value)}
                        className='w-full bg-transparent border border-gray-700 rounded px-3 py-2 text-gray-200 text-sm font-mono'
                        rows={15}
                        placeholder='#!/bin/bash&#10;# Installation script...'
                        disabled={isCopying}
                    />
                </div>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div>
                        <label className='block text-sm text-gray-400 mb-1'>Script Container</label>
                        <input
                            value={scriptContainer}
                            onChange={(e) => setScriptContainer(e.target.value)}
                            className='w-full bg-transparent border border-gray-700 rounded px-3 py-2 text-gray-200 text-sm'
                            disabled={isCopying}
                        />
                    </div>
                    <div>
                        <label className='block text-sm text-gray-400 mb-1'>Script Entrypoint Command</label>
                        <input
                            value={scriptEntry}
                            onChange={(e) => setScriptEntry(e.target.value)}
                            className='w-full bg-transparent border border-gray-700 rounded px-3 py-2 text-gray-200 text-sm'
                            disabled={isCopying}
                        />
                    </div>
                </div>
                <div className='mt-4'>
                    <label className='flex items-center gap-2 text-sm text-gray-400'>
                        <input
                            type='checkbox'
                            checked={scriptIsPrivileged}
                            onChange={(e) => setScriptIsPrivileged(e.target.checked)}
                            className='rounded border-gray-700 bg-transparent'
                            disabled={isCopying}
                        />
                        Privileged Install (run as root)
                    </label>
                </div>
            </div>

            <ButtonV2 onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Script'}
            </ButtonV2>
        </div>
    );
};

export default AdminEggScriptsContainer;
