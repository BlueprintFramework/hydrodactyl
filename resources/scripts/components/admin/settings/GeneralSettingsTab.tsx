import { useState } from 'react';
import useSWR from 'swr';

import Spinner from '@/components/elements/Spinner';
import { getGeneralSettings, updateGeneralSettings } from '@/api/admin/settings';
import { httpErrorToHuman } from '@/api/http';

const GeneralSettingsTab = () => {
    const { data: settings, isLoading, error: fetchError, mutate } = useSWR('admin:settings:general', getGeneralSettings);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ 'app:name': '', 'app:locale': '', 'pterodactyl:auth:2fa_required': 0 });
    const [formInit, setFormInit] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    if (settings && !formInit) {
        setFormInit(true);
        setForm({
            'app:name': settings['app:name'],
            'app:locale': settings['app:locale'],
            'pterodactyl:auth:2fa_required': settings['pterodactyl:auth:2fa_required'],
        });
    }

    const handleSave = () => {
        setError(null);
        setSuccess(false);
        setSaving(true);
        updateGeneralSettings(form)
            .then(() => {
                setSuccess(true);
                mutate();
                setTimeout(() => setSuccess(false), 3000);
            })
            .catch((e) => setError(httpErrorToHuman(e)))
            .finally(() => setSaving(false));
    };

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

    const languages = settings.available_languages || {};
    const levels: [number, string, string][] = [
        [0, 'Not Required', '2FA is optional for all users.'],
        [1, 'Admin Only', 'Only administrators must have 2FA enabled.'],
        [2, 'All Users', 'Every account must have 2FA enabled.'],
    ];

    return (
        <div className='max-w-3xl mx-auto mt-6'>
            <div className='bg-[#1a1a1a] rounded-lg border border-gray-800 overflow-hidden'>
                <div className='px-5 py-4 border-b border-gray-800 flex items-center space-x-2'>
                    <svg className='w-5 h-5 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' />
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' />
                    </svg>
                    <h3 className='text-sm font-semibold text-gray-300 uppercase tracking-wider'>General Settings</h3>
                </div>

                <div className='p-5 space-y-5'>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <div>
                            <label className='block text-sm font-medium text-gray-400 mb-1'>Company Name</label>
                            <input
                                type='text'
                                className='w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500'
                                value={form['app:name']}
                                onChange={(e) => setForm({ ...form, 'app:name': e.target.value })}
                            />
                            <p className='text-xs text-gray-600 mt-1'>Displayed throughout the panel and in outgoing emails.</p>
                        </div>
                        <div>
                            <label className='block text-sm font-medium text-gray-400 mb-1'>Default Language</label>
                            <select
                                className='w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500'
                                value={form['app:locale']}
                                onChange={(e) => setForm({ ...form, 'app:locale': e.target.value })}
                            >
                                {Object.entries(languages).map(([key, value]) => (
                                    <option key={key} value={key}>{value}</option>
                                ))}
                            </select>
                            <p className='text-xs text-gray-600 mt-1'>Default language for UI components.</p>
                        </div>
                    </div>

                    <div>
                        <label className='block text-sm font-medium text-gray-400 mb-3'>Require 2-Factor Authentication</label>
                        <div className='flex gap-2'>
                            {levels.map(([val, label, desc]) => (
                                <label key={val} className='flex-1 cursor-pointer'>
                                    <input
                                        type='radio'
                                        name='2fa_required'
                                        value={val}
                                        checked={form['pterodactyl:auth:2fa_required'] === val}
                                        onChange={() => setForm({ ...form, 'pterodactyl:auth:2fa_required': val })}
                                        className='hidden peer'
                                    />
                                    <div className='px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-center peer-checked:border-blue-500 peer-checked:bg-blue-900/20 transition-colors'>
                                        <div className={`text-sm font-medium ${form['pterodactyl:auth:2fa_required'] === val ? 'text-blue-400' : 'text-gray-300'}`}>{label}</div>
                                        <div className='text-xs text-gray-600 mt-1'>{desc}</div>
                                    </div>
                                </label>
                            ))}
                        </div>
                        <p className='text-xs text-gray-600 mt-2'>Accounts in the selected group must have 2FA enabled to use the panel.</p>
                    </div>
                </div>

                <div className='px-5 py-4 border-t border-gray-800 flex items-center justify-end gap-3'>
                    {error && <span className='text-red-400 text-sm'>{error}</span>}
                    {success && <span className='text-green-400 text-sm'>Settings saved successfully.</span>}
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
                        Save Settings
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GeneralSettingsTab;
