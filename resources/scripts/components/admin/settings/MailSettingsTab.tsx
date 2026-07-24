import { Edit02Icon, Mail01Icon, Mail02Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import useSWR from 'swr';
import { getMailSettings, testMailSettings, updateMailSettings } from '@/api/admin/settings';
import { httpErrorToHuman } from '@/api/http';
import Spinner from '@/components/elements/Spinner';
import { Button } from '@/components/ui/button';

const inputClass =
    'w-full bg-mocha-600 border border-mocha-400 rounded px-3 py-2 text-sm text-cream-400 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 transition-all';
const labelClass = 'block text-sm text-mocha-200 mb-1';

const MailSettingsTab = () => {
    const { data: settings, isLoading, error: fetchError, mutate } = useSWR('admin:settings:mail', getMailSettings);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({
        'mail:mailers:smtp:host': '',
        'mail:mailers:smtp:port': 587,
        'mail:mailers:smtp:encryption': 'tls',
        'mail:mailers:smtp:username': '',
        'mail:mailers:smtp:password': '',
        'mail:from:address': '',
        'mail:from:name': '',
    });

    useEffect(() => {
        if (settings && !settings.disabled) {
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
    }, [settings]);

    const handleSave = () => {
        setSaving(true);
        updateMailSettings(form)
            .then(() => {
                toast.success('Mail settings updated successfully');
                mutate();
                setEditing(false);
            })
            .catch((e) => toast.error(httpErrorToHuman(e)))
            .finally(() => setSaving(false));
    };

    const handleTest = () => {
        setTesting(true);
        testMailSettings()
            .then(() => toast.success('Test email sent successfully'))
            .catch((e) => toast.error(httpErrorToHuman(e)))
            .finally(() => setTesting(false));
    };

    const handleCancel = () => {
        if (settings && !settings.disabled) {
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
        setEditing(false);
    };

    if (isLoading || !settings) {
        return (
            <div className='flex items-center justify-center py-16'>
                <Spinner />
            </div>
        );
    }

    if (fetchError) {
        return <div className='text-red-400 p-4'>Error: {httpErrorToHuman(fetchError)}</div>;
    }

    if (settings.disabled) {
        return (
            <div className='space-y-6 mt-4'>
                <div className='bg-mocha-500 border border-mocha-400 rounded-xl p-6'>
                    <div className='flex flex-col sm:flex-row items-start sm:items-center gap-5'>
                        <div className='w-16 h-16 rounded-xl bg-amber-900/30 flex items-center justify-center shrink-0 border border-mocha-400'>
                            <HugeiconsIcon icon={Mail02Icon} className='w-8 h-8 text-amber-400' />
                        </div>
                        <div className='flex-1'>
                            <h2 className='text-xl font-bold text-cream-400'>Mail Not Configured</h2>
                            <p className='text-mocha-200 text-sm mt-1'>SMTP mail driver is not enabled</p>
                        </div>
                    </div>
                </div>
                <div className='bg-mocha-500 border border-mocha-400 rounded-xl p-6'>
                    <div className='flex items-start gap-3 text-cream-400'>
                        <HugeiconsIcon icon={Mail02Icon} className='w-5 h-5 mt-0.5 shrink-0 text-amber-400' />
                        <div>
                            <p className='text-sm'>
                                This interface requires the{' '}
                                <code className='text-cream-400 bg-mocha-600/50 px-1.5 py-0.5 rounded'>smtp</code> mail
                                driver. Use{' '}
                                <code className='text-cream-400 bg-mocha-600/50 px-1.5 py-0.5 rounded'>
                                    php artisan p:environment:mail
                                </code>{' '}
                                or set{' '}
                                <code className='text-cream-400 bg-mocha-600/50 px-1.5 py-0.5 rounded'>
                                    MAIL_DRIVER=smtp
                                </code>{' '}
                                in your environment file.
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
        <div className='space-y-6 mt-4'>
            {/* Profile Card */}
            <div className='bg-mocha-500 border border-mocha-400 rounded-xl p-6'>
                <div className='flex flex-col sm:flex-row items-start sm:items-center gap-5'>
                    <div className='w-16 h-16 rounded-xl bg-brand/10 flex items-center justify-center shrink-0 border border-mocha-400'>
                        <HugeiconsIcon icon={Mail02Icon} className='w-8 h-8 text-brand' />
                    </div>
                    <div className='flex-1'>
                        <h2 className='text-xl font-bold text-cream-400'>Mail Configuration</h2>
                        <p className='text-mocha-200 text-sm mt-1'>
                            SMTP server settings and outgoing mail configuration
                        </p>
                    </div>
                    <div className='flex items-center gap-3'>
                        <div className='text-center bg-mocha-600/50 rounded-lg px-4 py-3'>
                            <p className='text-2xl font-bold text-cream-400'>
                                {settings['mail:mailers:smtp:host'] || '—'}
                            </p>
                            <p className='text-xs text-mocha-200'>SMTP Host</p>
                        </div>
                        <div className='text-center bg-mocha-600/50 rounded-lg px-4 py-3'>
                            <p className='text-2xl font-bold text-cream-400'>{settings['mail:from:address'] || '—'}</p>
                            <p className='text-xs text-mocha-200'>From Address</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* SMTP Settings Card */}
            <div
                className={`rounded-xl p-6 transition-all duration-200 ${
                    editing
                        ? 'bg-mocha-500 border border-cream-400/20 shadow-[0_0_20px_rgba(245,240,232,0.04)]'
                        : 'bg-mocha-500 border border-mocha-400'
                }`}
            >
                <div className='flex items-center justify-between mb-6'>
                    <div className='flex items-center gap-3'>
                        <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${editing ? 'bg-cream-400/10' : 'bg-mocha-400'}`}
                        >
                            <HugeiconsIcon icon={Mail02Icon} className='w-5 h-5 text-cream-400' />
                        </div>
                        <div>
                            <div className='flex items-center gap-2'>
                                <h3 className='text-cream-400 font-semibold text-lg'>SMTP Settings</h3>
                                {editing && (
                                    <span className='inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-cream-400/10 text-cream-400 border border-cream-400/20'>
                                        Editing
                                    </span>
                                )}
                            </div>
                            <p className='text-mocha-200 text-sm'>Server connection and authentication details</p>
                        </div>
                    </div>
                    {!editing && (
                        <Button variant='secondary' onClick={() => setEditing(true)}>
                            <HugeiconsIcon icon={Edit02Icon} className='w-4 h-4' />
                            Edit Settings
                        </Button>
                    )}
                </div>

                {editing ? (
                    <div className='space-y-5'>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
                            <div>
                                <label className={labelClass} htmlFor='smtp-host'>
                                    SMTP Host
                                </label>
                                <input
                                    type='text'
                                    className={inputClass}
                                    id='smtp-host'
                                    value={form['mail:mailers:smtp:host']}
                                    onChange={(e) => setForm({ ...form, 'mail:mailers:smtp:host': e.target.value })}
                                    required
                                />
                                <p className='text-xs text-mocha-200/60 mt-1'>SMTP server address.</p>
                            </div>
                            <div className='grid grid-cols-2 gap-4'>
                                <div>
                                    <label className={labelClass} htmlFor='smtp-port'>
                                        Port
                                    </label>
                                    <input
                                        type='number'
                                        className={inputClass}
                                        id='smtp-port'
                                        value={form['mail:mailers:smtp:port']}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                'mail:mailers:smtp:port': parseInt(e.target.value, 10) || 0,
                                            })
                                        }
                                        required
                                    />
                                    <p className='text-xs text-mocha-200/60 mt-1'>SMTP server port.</p>
                                </div>
                                <div>
                                    <label className={labelClass} htmlFor='smtp-encryption'>
                                        Encryption
                                    </label>
                                    <select
                                        className={inputClass}
                                        id='smtp-encryption'
                                        value={form['mail:mailers:smtp:encryption']}
                                        onChange={(e) =>
                                            setForm({ ...form, 'mail:mailers:smtp:encryption': e.target.value })
                                        }
                                    >
                                        {encryptionOptions.map((opt) => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                    <p className='text-xs text-mocha-200/60 mt-1'>Encryption protocol.</p>
                                </div>
                            </div>
                        </div>

                        <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
                            <div>
                                <label className={labelClass} htmlFor='smtp-username'>
                                    Username
                                </label>
                                <input
                                    type='text'
                                    className={inputClass}
                                    id='smtp-username'
                                    value={form['mail:mailers:smtp:username']}
                                    onChange={(e) => setForm({ ...form, 'mail:mailers:smtp:username': e.target.value })}
                                />
                                <p className='text-xs text-mocha-200/60 mt-1'>SMTP authentication username.</p>
                            </div>
                            <div>
                                <label className={labelClass} htmlFor='smtp-password'>
                                    Password
                                </label>
                                <input
                                    type='password'
                                    className={inputClass}
                                    id='smtp-password'
                                    value={form['mail:mailers:smtp:password']}
                                    onChange={(e) => setForm({ ...form, 'mail:mailers:smtp:password': e.target.value })}
                                    placeholder='Leave blank to keep existing'
                                />
                                <p className='text-xs text-mocha-200/60 mt-1'>
                                    Leave blank to keep the existing password.
                                </p>
                            </div>
                        </div>

                        <div className='flex items-center gap-3 pt-3 border-t border-mocha-400'>
                            <Button variant='default' onClick={handleSave} disabled={saving}>
                                {saving ? 'Saving...' : 'Save Changes'}
                            </Button>
                            <Button variant='secondary' onClick={handleCancel}>
                                Discard
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                        <div className='bg-mocha-600/50 rounded-lg p-4'>
                            <p className='text-mocha-200 text-xs uppercase tracking-wider'>SMTP Host</p>
                            <p className='text-cream-400 font-medium mt-1 font-mono text-sm'>
                                {settings['mail:mailers:smtp:host'] || '—'}
                            </p>
                        </div>
                        <div className='bg-mocha-600/50 rounded-lg p-4'>
                            <p className='text-mocha-200 text-xs uppercase tracking-wider'>Port</p>
                            <p className='text-cream-400 font-medium mt-1'>
                                {settings['mail:mailers:smtp:port'] || '—'}
                            </p>
                        </div>
                        <div className='bg-mocha-600/50 rounded-lg p-4'>
                            <p className='text-mocha-200 text-xs uppercase tracking-wider'>Encryption</p>
                            <p className='text-cream-400 font-medium mt-1'>
                                {settings['mail:mailers:smtp:encryption'] || 'None'}
                            </p>
                        </div>
                        <div className='bg-mocha-600/50 rounded-lg p-4'>
                            <p className='text-mocha-200 text-xs uppercase tracking-wider'>Username</p>
                            <p className='text-cream-400 font-medium mt-1 font-mono text-sm truncate'>
                                {settings['mail:mailers:smtp:username'] || '—'}
                            </p>
                        </div>
                        <div className='bg-mocha-600/50 rounded-lg p-4'>
                            <p className='text-mocha-200 text-xs uppercase tracking-wider'>From Address</p>
                            <p className='text-cream-400 font-medium mt-1 font-mono text-sm'>
                                {settings['mail:from:address'] || '—'}
                            </p>
                        </div>
                        <div className='bg-mocha-600/50 rounded-lg p-4'>
                            <p className='text-mocha-200 text-xs uppercase tracking-wider'>From Name</p>
                            <p className='text-cream-400 font-medium mt-1'>{settings['mail:from:name'] || '—'}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Mail From Card */}
            {!editing && (
                <div className='bg-mocha-500 border border-mocha-400 rounded-xl p-6'>
                    <div className='flex items-center justify-between mb-6'>
                        <div className='flex items-center gap-3'>
                            <div className='w-10 h-10 bg-mocha-400 rounded-lg flex items-center justify-center'>
                                <HugeiconsIcon icon={Mail01Icon} className='w-5 h-5 text-cream-400' />
                            </div>
                            <div>
                                <h3 className='text-cream-400 font-semibold text-lg'>Mail From</h3>
                                <p className='text-mocha-200 text-sm'>Outgoing email sender details</p>
                            </div>
                        </div>
                    </div>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <div className='bg-mocha-600/50 rounded-lg p-4'>
                            <p className='text-mocha-200 text-xs uppercase tracking-wider'>From Address</p>
                            <p className='text-cream-400 font-medium mt-1 font-mono text-sm'>
                                {settings['mail:from:address'] || '—'}
                            </p>
                        </div>
                        <div className='bg-mocha-600/50 rounded-lg p-4'>
                            <p className='text-mocha-200 text-xs uppercase tracking-wider'>From Name</p>
                            <p className='text-cream-400 font-medium mt-1'>{settings['mail:from:name'] || '—'}</p>
                        </div>
                    </div>
                    <div className='flex items-center gap-3 pt-4'>
                        <Button variant='secondary' onClick={handleTest} disabled={testing}>
                            {testing ? 'Sending...' : 'Send Test Email'}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MailSettingsTab;
