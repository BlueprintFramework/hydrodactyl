import { useEffect, useState } from 'react';

import Spinner from '@/components/elements/Spinner';
import { getCaptchaSettings, type CaptchaSettings, updateCaptchaSettings } from '@/api/admin/settings';
import { httpErrorToHuman } from '@/api/http';

const providerConfigs: Record<string, { title: string; fields: { key: string; label: string; sensitive: boolean }[]; instructions: { text: string; url: string; urlLabel: string }[] }> = {
    turnstile: {
        title: 'Cloudflare Turnstile Configuration',
        fields: [
            { key: 'pterodactyl:captcha:turnstile:site_key', label: 'Site Key', sensitive: false },
            { key: 'pterodactyl:captcha:turnstile:secret_key', label: 'Secret Key', sensitive: true },
        ],
        instructions: [
            { text: 'Visit the Cloudflare Turnstile dashboard', url: 'https://dash.cloudflare.com/?to=/:account/turnstile', urlLabel: 'Cloudflare Turnstile' },
            { text: 'Create a new site or select an existing one', url: '', urlLabel: '' },
            { text: 'Add your domain to the site configuration', url: '', urlLabel: '' },
            { text: 'Copy the Site Key and Secret Key from the dashboard', url: '', urlLabel: '' },
            { text: 'Paste them into the fields above', url: '', urlLabel: '' },
        ],
    },
    hcaptcha: {
        title: 'hCaptcha Configuration',
        fields: [
            { key: 'pterodactyl:captcha:hcaptcha:site_key', label: 'Site Key', sensitive: false },
            { key: 'pterodactyl:captcha:hcaptcha:secret_key', label: 'Secret Key', sensitive: true },
        ],
        instructions: [
            { text: 'Visit the hCaptcha dashboard', url: 'https://dashboard.hcaptcha.com/sites', urlLabel: 'hCaptcha dashboard' },
            { text: 'Create a new site or select an existing one', url: '', urlLabel: '' },
            { text: 'Add your domain to the site configuration', url: '', urlLabel: '' },
            { text: 'Copy the Site Key and Secret Key from the dashboard', url: '', urlLabel: '' },
            { text: 'Paste them into the fields above', url: '', urlLabel: '' },
        ],
    },
    recaptcha: {
        title: 'Google reCAPTCHA v3 Configuration',
        fields: [
            { key: 'pterodactyl:captcha:recaptcha:site_key', label: 'Site Key', sensitive: false },
            { key: 'pterodactyl:captcha:recaptcha:secret_key', label: 'Secret Key', sensitive: true },
        ],
        instructions: [
            { text: 'Visit the Google reCAPTCHA admin console', url: 'https://www.google.com/recaptcha/admin', urlLabel: 'reCAPTCHA admin' },
            { text: 'Create a new site and select reCAPTCHA v3', url: '', urlLabel: '' },
            { text: 'Add your domain(s) to the site configuration', url: '', urlLabel: '' },
            { text: 'Copy the Site Key and Secret Key from the dashboard', url: '', urlLabel: '' },
        ],
    },
};

const CaptchaSettingsTab = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<CaptchaSettings | null>(null);
    const [provider, setProvider] = useState('none');
    const [form, setForm] = useState<Record<string, string>>({});
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        getCaptchaSettings()
            .then((data) => {
                setSettings(data);
                setProvider(data['pterodactyl:captcha:provider']);
                setForm({
                    'pterodactyl:captcha:turnstile:site_key': data['pterodactyl:captcha:turnstile:site_key'] || '',
                    'pterodactyl:captcha:turnstile:secret_key': '',
                    'pterodactyl:captcha:hcaptcha:site_key': data['pterodactyl:captcha:hcaptcha:site_key'] || '',
                    'pterodactyl:captcha:hcaptcha:secret_key': '',
                    'pterodactyl:captcha:recaptcha:site_key': data['pterodactyl:captcha:recaptcha:site_key'] || '',
                    'pterodactyl:captcha:recaptcha:secret_key': '',
                });
            })
            .catch((e) => setError(httpErrorToHuman(e)))
            .finally(() => setLoading(false));
    }, []);

    const handleSave = () => {
        setError(null);
        setSuccess(false);
        setSaving(true);
        const payload: Record<string, unknown> = { 'pterodactyl:captcha:provider': provider, ...form };
        updateCaptchaSettings(payload)
            .then(() => {
                setSuccess(true);
                setTimeout(() => setSuccess(false), 3000);
            })
            .catch((e) => setError(httpErrorToHuman(e)))
            .finally(() => setSaving(false));
    };

    if (loading) {
        return (
            <div className='flex items-center justify-center py-16'>
                <Spinner />
            </div>
        );
    }

    const providers = settings?.providers || {};
    const config = providerConfigs[provider];

    return (
        <div className='max-w-3xl mx-auto mt-6 space-y-6'>
            <div className='bg-[#1a1a1a] rounded-lg border border-gray-800 overflow-hidden'>
                <div className='px-5 py-4 border-b border-gray-800'>
                    <h3 className='text-sm font-semibold text-gray-300 uppercase tracking-wider'>Captcha Provider</h3>
                </div>
                <div className='p-5'>
                    <div className='max-w-xs'>
                        <label className='block text-sm font-medium text-gray-400 mb-1'>Provider</label>
                        <select
                            className='w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500'
                            value={provider}
                            onChange={(e) => setProvider(e.target.value)}
                        >
                            {Object.entries(providers).map(([key, name]) => (
                                <option key={key} value={key}>{name}</option>
                            ))}
                        </select>
                        <p className='text-xs text-gray-600 mt-1'>Select the captcha provider to use for authentication forms.</p>
                    </div>
                </div>
            </div>

            {config && (
                <div className='bg-[#1a1a1a] rounded-lg border border-gray-800 overflow-hidden'>
                    <div className='px-5 py-4 border-b border-gray-800'>
                        <h3 className='text-sm font-semibold text-gray-300 uppercase tracking-wider'>{config.title}</h3>
                    </div>
                    <div className='p-5'>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                            {config.fields.map((field) => (
                                <div key={field.key}>
                                    <label className='block text-sm font-medium text-gray-400 mb-1'>{field.label}</label>
                                    <input
                                        type={field.sensitive ? 'password' : 'text'}
                                        className='w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500'
                                        value={form[field.key] || ''}
                                        onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                                    />
                                </div>
                            ))}
                        </div>
                        <div className='mt-4 bg-gray-900 border border-gray-700 rounded-lg p-4 text-sm text-gray-400'>
                            <strong className='text-gray-300'>Setup Instructions:</strong>
                            <ol className='list-decimal list-inside mt-2 space-y-1'>
                                {config.instructions.map((inst, i) => (
                                    <li key={i}>
                                        {inst.url ? (
                                            <>
                                                {inst.text.replace(inst.urlLabel, '')}
                                                <a href={inst.url} target='_blank' rel='noopener noreferrer' className='text-blue-400 hover:text-blue-300 underline'>{inst.urlLabel}</a>
                                            </>
                                        ) : (
                                            inst.text
                                        )}
                                    </li>
                                ))}
                            </ol>
                        </div>
                    </div>
                </div>
            )}

            <div className='bg-[#1a1a1a] rounded-lg border border-gray-800 px-5 py-4 flex items-center justify-end gap-3'>
                {error && <span className='text-red-400 text-sm'>{error}</span>}
                {success && <span className='text-green-400 text-sm'>Captcha settings saved successfully.</span>}
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
    );
};

export default CaptchaSettingsTab;
