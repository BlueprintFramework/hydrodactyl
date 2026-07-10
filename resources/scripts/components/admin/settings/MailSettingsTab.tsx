import { useState } from 'react';
import useSWR from 'swr';

import Spinner from '@/components/elements/Spinner';
import { getMailSettings, updateMailSettings, testMailSettings } from '@/api/admin/settings';
import { httpErrorToHuman } from '@/api/http';

const MailSettingsTab = () => {
    const { data: settings, isLoading, error: fetchError, mutate } = useSWR('admin:settings:mail', getMailSettings);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [form, setForm] = useState({
        'mail:mailers:smtp:host': '',
        'mail:mailers:smtp:port': 587,
        'mail:mailers:smtp:encryption': 'tls',
        'mail:mailers:smtp:username': '',
        'mail:mailers:smtp:password': '',
        'mail:from:address': '',
        'mail:from:name': '',
    });
    const [formInit, setFormInit] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    if (settings && !formInit) {
        setFormInit(true);
        if (!settings.disabled) {
            setForm({
                'mail:mailers:smtp:host': settings['mail:mailers:smtp:host'] || '',
                'mail:mailers:smtp:port': settings['mail:mailers:smtp:port'] || 587,
                'mail:mailers:smtp:encryption': settings['mail:mailers:smtp:encryption'] || 'tls',
                'mail:mailers:smtp:username': settings['mail:mailers:smtp:username'] || '',
                'mail:mailers:smtp:password': '',
                'mail:from:address': settings['mail:from:address'] || '',
                'mail:from:name': settings['mail:from:name'] || '',
            });
        }
    }

    const handleSave = () => {
        setError(null);
        setSuccess(false);
        setSaving(true);
        updateMailSettings(form)
            .then(() => {
                setSuccess(true);
                mutate();
                setTimeout(() => setSuccess(false), 3000);
            })
            .catch((e) => setError(httpErrorToHuman(e)))
            .finally(() => setSaving(false));
    };

    const handleTest = () => {
        setError(null);
        setTesting(true);
        testMailSettings()
            .then(() => {
                setSuccess(true);
                setTimeout(() => setSuccess(false), 3000);
            })
            .catch((e) => setError(httpErrorToHuman(e)))
            .finally(() => setTesting(false));
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

    if (settings.disabled) {
        return (
            <div className='max-w-3xl mx-auto mt-6'>
                <div className='bg-[#1a1a1a] rounded-lg border border-gray-800 p-6'>
                    <div className='flex items-start gap-3 text-blue-400'>
                        <svg className='w-5 h-5 mt-0.5 shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                        </svg>
                        <div>
                            <p className='text-sm'>
                                This interface requires the <code className='text-blue-300'>smtp</code> mail driver. Use
                                {' '}<code className='text-blue-300'>php artisan p:environment:mail</code> or set{' '}
                                <code className='text-blue-300'>MAIL_DRIVER=smtp</code> in your environment file.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const encryptionOptions = [
        { value: '', label: 'None' },
        { value: 'tls', label: 'TLS' },
        { value: 'ssl', label: 'SSL' },
    ];

    return (
        <div className='max-w-3xl mx-auto mt-6'>
            <div className='bg-[#1a1a1a] rounded-lg border border-gray-800 overflow-hidden'>
                <div className='px-5 py-4 border-b border-gray-800 flex items-center space-x-2'>
                    <svg className='w-5 h-5 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' />
                    </svg>
                    <h3 className='text-sm font-semibold text-gray-300 uppercase tracking-wider'>SMTP Settings</h3>
                </div>

                <div className='p-5 space-y-5'>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <div>
                            <label className='block text-sm font-medium text-gray-400 mb-1'>SMTP Host</label>
                            <input
                                type='text'
                                className='w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500'
                                value={form['mail:mailers:smtp:host']}
                                onChange={(e) => setForm({ ...form, 'mail:mailers:smtp:host': e.target.value })}
                                required
                            />
                            <p className='text-xs text-gray-600 mt-1'>SMTP server address.</p>
                        </div>
                        <div className='grid grid-cols-2 gap-4'>
                            <div>
                                <label className='block text-sm font-medium text-gray-400 mb-1'>Port</label>
                                <input
                                    type='number'
                                    className='w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500'
                                    value={form['mail:mailers:smtp:port']}
                                    onChange={(e) => setForm({ ...form, 'mail:mailers:smtp:port': parseInt(e.target.value) || 0 })}
                                    required
                                />
                                <p className='text-xs text-gray-600 mt-1'>SMTP server port.</p>
                            </div>
                            <div>
                                <label className='block text-sm font-medium text-gray-400 mb-1'>Encryption</label>
                                <select
                                    className='w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500'
                                    value={form['mail:mailers:smtp:encryption']}
                                    onChange={(e) => setForm({ ...form, 'mail:mailers:smtp:encryption': e.target.value })}
                                >
                                    {encryptionOptions.map((opt) => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                                <p className='text-xs text-gray-600 mt-1'>Encryption protocol.</p>
                            </div>
                        </div>
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <div>
                            <label className='block text-sm font-medium text-gray-400 mb-1'>Username</label>
                            <input
                                type='text'
                                className='w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500'
                                value={form['mail:mailers:smtp:username']}
                                onChange={(e) => setForm({ ...form, 'mail:mailers:smtp:username': e.target.value })}
                            />
                            <p className='text-xs text-gray-600 mt-1'>SMTP authentication username.</p>
                        </div>
                        <div>
                            <label className='block text-sm font-medium text-gray-400 mb-1'>Password</label>
                            <input
                                type='password'
                                className='w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500'
                                value={form['mail:mailers:smtp:password']}
                                onChange={(e) => setForm({ ...form, 'mail:mailers:smtp:password': e.target.value })}
                                placeholder='Leave blank to keep existing'
                            />
                            <p className='text-xs text-gray-600 mt-1'>Leave blank to keep the existing password.</p>
                        </div>
                    </div>

                    <hr className='border-gray-800' />

                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <div>
                            <label className='block text-sm font-medium text-gray-400 mb-1'>Mail From Address</label>
                            <input
                                type='email'
                                className='w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500'
                                value={form['mail:from:address']}
                                onChange={(e) => setForm({ ...form, 'mail:from:address': e.target.value })}
                                required
                            />
                            <p className='text-xs text-gray-600 mt-1'>All outgoing emails will use this address.</p>
                        </div>
                        <div>
                            <label className='block text-sm font-medium text-gray-400 mb-1'>Mail From Name</label>
                            <input
                                type='text'
                                className='w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500'
                                value={form['mail:from:name']}
                                onChange={(e) => setForm({ ...form, 'mail:from:name': e.target.value })}
                            />
                            <p className='text-xs text-gray-600 mt-1'>Display name for outgoing emails.</p>
                        </div>
                    </div>
                </div>

                <div className='px-5 py-4 border-t border-gray-800 flex items-center justify-end gap-3'>
                    {error && <span className='text-red-400 text-sm'>{error}</span>}
                    {success && <span className='text-green-400 text-sm'>Operation completed successfully.</span>}
                    <button
                        onClick={() => { handleSave(); handleTest(); }}
                        disabled={saving || testing}
                        className='px-4 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-sm rounded font-medium transition-colors flex items-center gap-1.5'
                    >
                        <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M12 19l9 2-9-18-9 18 9-2zm0 0v-8' />
                        </svg>
                        Save & Test
                    </button>
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

export default MailSettingsTab;
