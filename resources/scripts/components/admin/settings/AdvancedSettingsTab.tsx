import { useState } from 'react';
import useSWR from 'swr';

import Spinner from '@/components/elements/Spinner';
import { getAdvancedSettings, updateAdvancedSettings } from '@/api/admin/settings';
import { httpErrorToHuman } from '@/api/http';

const AdvancedSettingsTab = () => {
    const { data: settings, isLoading, error: fetchError, mutate } = useSWR('admin:settings:advanced', getAdvancedSettings);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        'pterodactyl:guzzle:connect_timeout': 5,
        'pterodactyl:guzzle:timeout': 30,
        'pterodactyl:client_features:allocations:enabled': 'false',
        'pterodactyl:client_features:allocations:range_start': null as number | null,
        'pterodactyl:client_features:allocations:range_end': null as number | null,
    });
    const [formInit, setFormInit] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    if (settings && !formInit) {
        setFormInit(true);
        setForm(settings);
    }

    const handleSave = () => {
        setError(null);
        setSuccess(false);
        setSaving(true);
        updateAdvancedSettings(form)
            .then(() => {
                setSuccess(true);
                mutate();
                setTimeout(() => setSuccess(false), 3000);
            })
            .catch((e) => setError(httpErrorToHuman(e)))
            .finally(() => setSaving(false));
    };

    const allocationsEnabled = form['pterodactyl:client_features:allocations:enabled'] === 'true';

    if (isLoading || !settings) {
        return (
            <div className='flex items-center justify-center py-16'>
                <Spinner />
            </div>
        );
    }

    if (fetchError) {
        return <div className='text-red-400 py-8 text-center'>{httpErrorToHuman(fetchError)}</div>;
    }

    return (
        <div className='max-w-3xl mx-auto mt-6 space-y-6'>
            <div className='bg-[#1a1a1a] rounded-lg border border-gray-800 overflow-hidden'>
                <div className='px-5 py-4 border-b border-gray-800 flex items-center space-x-2'>
                    <svg className='w-5 h-5 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M13 10V3L4 14h7v7l9-11h-7z' />
                    </svg>
                    <h3 className='text-sm font-semibold text-gray-300 uppercase tracking-wider'>HTTP Connections</h3>
                </div>
                <div className='p-5'>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <div>
                            <label className='block text-sm font-medium text-gray-400 mb-1'>Connection Timeout</label>
                            <input
                                type='number'
                                className='w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500'
                                value={form['pterodactyl:guzzle:connect_timeout']}
                                onChange={(e) => setForm({ ...form, 'pterodactyl:guzzle:connect_timeout': parseInt(e.target.value) || 0 })}
                                min={1}
                                max={60}
                                required
                            />
                            <p className='text-xs text-gray-600 mt-1'>Seconds to wait before timing out a connection attempt.</p>
                        </div>
                        <div>
                            <label className='block text-sm font-medium text-gray-400 mb-1'>Request Timeout</label>
                            <input
                                type='number'
                                className='w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500'
                                value={form['pterodactyl:guzzle:timeout']}
                                onChange={(e) => setForm({ ...form, 'pterodactyl:guzzle:timeout': parseInt(e.target.value) || 0 })}
                                min={1}
                                max={60}
                                required
                            />
                            <p className='text-xs text-gray-600 mt-1'>Seconds to wait before timing out an active request.</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className='bg-[#1a1a1a] rounded-lg border border-gray-800 overflow-hidden'>
                <div className='px-5 py-4 border-b border-gray-800 flex items-center space-x-2'>
                    <svg className='w-5 h-5 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4' />
                    </svg>
                    <h3 className='text-sm font-semibold text-gray-300 uppercase tracking-wider'>Automatic Allocation Creation</h3>
                </div>
                <div className='p-5'>
                    <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                        <div>
                            <label className='block text-sm font-medium text-gray-400 mb-1'>Status</label>
                            <select
                                className='w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500'
                                value={form['pterodactyl:client_features:allocations:enabled']}
                                onChange={(e) => setForm({ ...form, 'pterodactyl:client_features:allocations:enabled': e.target.value })}
                            >
                                <option value='false'>Disabled</option>
                                <option value='true'>Enabled</option>
                            </select>
                            <p className='text-xs text-gray-600 mt-1'>Let users automatically create allocations from the frontend.</p>
                        </div>
                        <div>
                            <label className='block text-sm font-medium text-gray-400 mb-1'>Starting Port</label>
                            <input
                                type='number'
                                className='w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500'
                                value={form['pterodactyl:client_features:allocations:range_start'] ?? ''}
                                onChange={(e) => setForm({ ...form, 'pterodactyl:client_features:allocations:range_start': e.target.value ? parseInt(e.target.value) : null })}
                                disabled={!allocationsEnabled}
                                min={1024}
                                max={65535}
                            />
                            <p className='text-xs text-gray-600 mt-1'>First port in the allocatable range.</p>
                        </div>
                        <div>
                            <label className='block text-sm font-medium text-gray-400 mb-1'>Ending Port</label>
                            <input
                                type='number'
                                className='w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500'
                                value={form['pterodactyl:client_features:allocations:range_end'] ?? ''}
                                onChange={(e) => setForm({ ...form, 'pterodactyl:client_features:allocations:range_end': e.target.value ? parseInt(e.target.value) : null })}
                                disabled={!allocationsEnabled}
                                min={1024}
                                max={65535}
                            />
                            <p className='text-xs text-gray-600 mt-1'>Last port in the allocatable range.</p>
                        </div>
                    </div>
                </div>
                <div className='px-5 py-4 border-t border-gray-800 flex items-center justify-end gap-3'>
                    {error && <span className='text-red-400 text-sm'>{error}</span>}
                    {success && <span className='text-green-400 text-sm'>Advanced settings saved successfully.</span>}
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className='px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm rounded font-medium transition-colors flex items-center gap-1.5'
                    >
                        {saving && (
                            <svg className='w-4 h-4 animate-spin' fill='none' viewBox='0 0 24 24'>
                                <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
                                <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z' />
                            </svg>
                        )}
                        <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4' />
                        </svg>
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdvancedSettingsTab;
