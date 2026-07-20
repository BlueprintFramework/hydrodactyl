import { useState } from 'react';
import useSWR from 'swr';

import Spinner from '@/components/elements/Spinner';
import { getMailSettings, updateMailSettings, testMailSettings } from '@/api/admin/settings';
import { httpErrorToHuman } from '@/api/http';
import { Button } from '@/components/ui/button';

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
                <div className='bg-mocha-500 rounded-lg border border-mocha-400 p-6'>
                    <div className='flex items-start gap-3 text-cream-400'>
                        <svg className='w-5 h-5 mt-0.5 shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                        </svg>
                        <div>
                            <p className='text-sm'>
                                This interface requires the <code className='text-cream-400'>smtp</code> mail driver. Use
                                {' '}<code className='text-cream-400'>php artisan p:environment:mail</code> or set{' '}
                                <code className='text-cream-400'>MAIL_DRIVER=smtp</code> in your environment file.
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
            <div className='bg-mocha-500 rounded-lg border border-mocha-400 overflow-hidden'>
                <div className='px-5 py-4 border-b border-mocha-400 flex items-center space-x-2'>
                    <svg className='w-5 h-5 text-mocha-200' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' />
                    </svg>
                    <h3 className='text-sm font-semibold text-mocha-100 uppercase tracking-wider'>SMTP Settings</h3>
                </div>

                <div className='p-5 space-y-5'>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <div>
                            <label className='block text-sm font-medium text-mocha-200 mb-1'>SMTP Host</label>
                            <input
                                type='text'
                                className='w-full bg-mocha-600 border border-mocha-400 rounded px-3 py-2 text-sm text-cream-400 focus:outline-none focus:border-mocha-300'
                                value={form['mail:mailers:smtp:host']}
                                onChange={(e) => setForm({ ...form, 'mail:mailers:smtp:host': e.target.value })}
                                required
                            />
                            <p className='text-xs text-mocha-200/60 mt-1'>SMTP server address.</p>
                        </div>
                        <div className='grid grid-cols-2 gap-4'>
                            <div>
                                <label className='block text-sm font-medium text-mocha-200 mb-1'>Port</label>
                                <input
                                    type='number'
                                    className='w-full bg-mocha-600 border border-mocha-400 rounded px-3 py-2 text-sm text-cream-400 focus:outline-none focus:border-mocha-300'
                                    value={form['mail:mailers:smtp:port']}
                                    onChange={(e) => setForm({ ...form, 'mail:mailers:smtp:port': parseInt(e.target.value) || 0 })}
                                    required
                                />
                                <p className='text-xs text-mocha-200/60 mt-1'>SMTP server port.</p>
                            </div>
                            <div>
                                <label className='block text-sm font-medium text-mocha-200 mb-1'>Encryption</label>
                                <select
                                    className='w-full bg-mocha-600 border border-mocha-400 rounded px-3 py-2 text-sm text-cream-400 focus:outline-none focus:border-mocha-300'
                                    value={form['mail:mailers:smtp:encryption']}
                                    onChange={(e) => setForm({ ...form, 'mail:mailers:smtp:encryption': e.target.value })}
                                >
                                    {encryptionOptions.map((opt) => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                                <p className='text-xs text-mocha-200/60 mt-1'>Encryption protocol.</p>
                            </div>
                        </div>
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <div>
                            <label className='block text-sm font-medium text-mocha-200 mb-1'>Username</label>
                            <input
                                type='text'
                                className='w-full bg-mocha-600 border border-mocha-400 rounded px-3 py-2 text-sm text-cream-400 focus:outline-none focus:border-mocha-300'
                                value={form['mail:mailers:smtp:username']}
                                onChange={(e) => setForm({ ...form, 'mail:mailers:smtp:username': e.target.value })}
                            />
                            <p className='text-xs text-mocha-200/60 mt-1'>SMTP authentication username.</p>
                        </div>
                        <div>
                            <label className='block text-sm font-medium text-mocha-200 mb-1'>Password</label>
                            <input
                                type='password'
                                className='w-full bg-mocha-600 border border-mocha-400 rounded px-3 py-2 text-sm text-cream-400 focus:outline-none focus:border-mocha-300'
                                value={form['mail:mailers:smtp:password']}
                                onChange={(e) => setForm({ ...form, 'mail:mailers:smtp:password': e.target.value })}
                                placeholder='Leave blank to keep existing'
                            />
                            <p className='text-xs text-mocha-200/60 mt-1'>Leave blank to keep the existing password.</p>
                        </div>
                    </div>

                    <hr className='border-mocha-400' />

                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <div>
                            <label className='block text-sm font-medium text-mocha-200 mb-1'>Mail From Address</label>
                            <input
                                type='email'
                                className='w-full bg-mocha-600 border border-mocha-400 rounded px-3 py-2 text-sm text-cream-400 focus:outline-none focus:border-mocha-300'
                                value={form['mail:from:address']}
                                onChange={(e) => setForm({ ...form, 'mail:from:address': e.target.value })}
                                required
                            />
                            <p className='text-xs text-mocha-200/60 mt-1'>All outgoing emails will use this address.</p>
                        </div>
                        <div>
                            <label className='block text-sm font-medium text-mocha-200 mb-1'>Mail From Name</label>
                            <input
                                type='text'
                                className='w-full bg-mocha-600 border border-mocha-400 rounded px-3 py-2 text-sm text-cream-400 focus:outline-none focus:border-mocha-300'
                                value={form['mail:from:name']}
                                onChange={(e) => setForm({ ...form, 'mail:from:name': e.target.value })}
                            />
                            <p className='text-xs text-mocha-200/60 mt-1'>Display name for outgoing emails.</p>
                        </div>
                    </div>
                </div>

                <div className='px-5 py-4 border-t border-mocha-400 flex items-center justify-end gap-3'>
                    {error && <span className='text-red-400 text-sm'>{error}</span>}
                    {success && <span className='text-green-400 text-sm'>Operation completed successfully.</span>}
                    <Button
                        onClick={() => { handleSave(); handleTest(); }}
                        disabled={saving || testing}
                    >
                        <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M12 19l9 2-9-18-9 18 9-2zm0 0v-8' />
                        </svg>
                        Save & Test
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default MailSettingsTab;
