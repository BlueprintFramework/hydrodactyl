import { CheckmarkBadge01Icon, Edit02Icon, Shield01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { type CaptchaSettings, getCaptchaSettings, updateCaptchaSettings } from '@/api/admin/settings';
import { httpErrorToHuman } from '@/api/http';
import Spinner from '@/components/elements/Spinner';
import { Button } from '@/components/ui/button';

const inputClass =
    'w-full bg-mocha-600 border border-mocha-400 rounded px-3 py-2 text-sm text-cream-400 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 transition-all';
const labelClass = 'block text-sm text-mocha-200 mb-1';

const providerConfigs: Record<
    string,
    {
        title: string;
        fields: { key: string; label: string; sensitive: boolean }[];
        instructions: { text: string; url: string; urlLabel: string }[];
    }
> = {
    turnstile: {
        title: 'Cloudflare Turnstile Configuration',
        fields: [
            { key: 'pterodactyl:captcha:turnstile:site_key', label: 'Site Key', sensitive: false },
            { key: 'pterodactyl:captcha:turnstile:secret_key', label: 'Secret Key', sensitive: true },
        ],
        instructions: [
            {
                text: 'Visit the Cloudflare Turnstile dashboard',
                url: 'https://dash.cloudflare.com/?to=/:account/turnstile',
                urlLabel: 'Cloudflare Turnstile',
            },
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
            {
                text: 'Visit the hCaptcha dashboard',
                url: 'https://dashboard.hcaptcha.com/sites',
                urlLabel: 'hCaptcha dashboard',
            },
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
            {
                text: 'Visit the Google reCAPTCHA admin console',
                url: 'https://www.google.com/recaptcha/admin',
                urlLabel: 'reCAPTCHA admin',
            },
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
    const [editing, setEditing] = useState(false);

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
            .catch((e) => toast.error(httpErrorToHuman(e)))
            .finally(() => setLoading(false));
    }, []);

    const handleSave = () => {
        setSaving(true);
        const payload: Record<string, unknown> = { 'pterodactyl:captcha:provider': provider };
        for (const [key, value] of Object.entries(form)) {
            if (value.trim() || !key.endsWith(':secret_key')) {
                payload[key] = value;
            }
        }
        updateCaptchaSettings(payload)
            .then(() => {
                toast.success('Captcha settings updated successfully');
                setEditing(false);
                return getCaptchaSettings();
            })
            .then((data) => setSettings(data))
            .catch((e) => toast.error(httpErrorToHuman(e)))
            .finally(() => setSaving(false));
    };

    const handleCancel = () => {
        if (settings) {
            setProvider(settings['pterodactyl:captcha:provider']);
            setForm({
                'pterodactyl:captcha:turnstile:site_key': settings['pterodactyl:captcha:turnstile:site_key'] || '',
                'pterodactyl:captcha:turnstile:secret_key': '',
                'pterodactyl:captcha:hcaptcha:site_key': settings['pterodactyl:captcha:hcaptcha:site_key'] || '',
                'pterodactyl:captcha:hcaptcha:secret_key': '',
                'pterodactyl:captcha:recaptcha:site_key': settings['pterodactyl:captcha:recaptcha:site_key'] || '',
                'pterodactyl:captcha:recaptcha:secret_key': '',
            });
        }
        setEditing(false);
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
    const providerName = settings?.providers?.[provider] || provider;
    const isActive = provider !== 'none';

    return (
        <div className='space-y-6 mt-4'>
            {/* Profile Card */}
            <div className='bg-mocha-500 border border-mocha-400 rounded-xl p-6'>
                <div className='flex flex-col sm:flex-row items-start sm:items-center gap-5'>
                    <div className='w-16 h-16 rounded-xl bg-brand/10 flex items-center justify-center shrink-0 border border-mocha-400'>
                        <HugeiconsIcon icon={Shield01Icon} className='w-8 h-8 text-brand' />
                    </div>
                    <div className='flex-1'>
                        <h2 className='text-xl font-bold text-cream-400'>Captcha Configuration</h2>
                        <p className='text-mocha-200 text-sm mt-1'>Bot protection for authentication forms</p>
                    </div>
                    <div className='flex items-center gap-3'>
                        <div className='text-center bg-mocha-600/50 rounded-lg px-4 py-3'>
                            <p className='text-2xl font-bold text-cream-400'>{providerName}</p>
                            <p className='text-xs text-mocha-200'>Provider</p>
                        </div>
                        <div className='text-center bg-mocha-600/50 rounded-lg px-4 py-3'>
                            <p className={`text-2xl font-bold ${isActive ? 'text-green-400' : 'text-mocha-200'}`}>
                                {isActive ? 'ON' : 'OFF'}
                            </p>
                            <p className='text-xs text-mocha-200'>Status</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Provider Selection Card */}
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
                            <HugeiconsIcon icon={Shield01Icon} className='w-5 h-5 text-cream-400' />
                        </div>
                        <div>
                            <div className='flex items-center gap-2'>
                                <h3 className='text-cream-400 font-semibold text-lg'>Captcha Provider</h3>
                                {editing && (
                                    <span className='inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-cream-400/10 text-cream-400 border border-cream-400/20'>
                                        Editing
                                    </span>
                                )}
                            </div>
                            <p className='text-mocha-200 text-sm'>Select and configure your captcha service</p>
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
                        <div>
                            <label className={labelClass} htmlFor='captcha-provider'>
                                Provider
                            </label>
                            <div className='max-w-xs'>
                                <select
                                    className={inputClass}
                                    id='captcha-provider'
                                    value={provider}
                                    onChange={(e) => setProvider(e.target.value)}
                                >
                                    {Object.keys(providers).length === 0 && (
                                        <option value='' disabled className='bg-mocha-600 text-mocha-200'>
                                            No providers available
                                        </option>
                                    )}
                                    {Object.entries(providers).map(([key, name]) => (
                                        <option key={key} value={key} className='bg-mocha-600 text-cream-400'>
                                            {name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <p className='text-xs text-mocha-200/60 mt-1'>
                                Select the captcha provider to use for authentication forms.
                            </p>
                        </div>

                        {config && (
                            <div className='bg-mocha-600/50 rounded-xl p-5 space-y-4'>
                                <h4 className='text-cream-400 font-semibold'>{config.title}</h4>
                                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                    {config.fields.map((field) => (
                                        <div key={field.key}>
                                            <label className={labelClass} htmlFor={field.key.replace(/:/g, '-')}>
                                                {field.label}
                                            </label>
                                            <input
                                                type={field.sensitive ? 'password' : 'text'}
                                                className={inputClass}
                                                id={field.key.replace(/:/g, '-')}
                                                value={form[field.key] || ''}
                                                onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                                            />
                                        </div>
                                    ))}
                                </div>
                                <div className='bg-mocha-600 border border-mocha-400 rounded-lg p-4 text-sm text-mocha-200'>
                                    <strong className='text-mocha-100'>Setup Instructions:</strong>
                                    <ol className='list-decimal list-inside mt-2 space-y-1'>
                                        {config.instructions.map((inst, i) => (
                                            <li key={i}>
                                                {inst.url ? (
                                                    <>
                                                        {inst.text.replace(inst.urlLabel, '')}
                                                        <a
                                                            href={inst.url}
                                                            target='_blank'
                                                            rel='noopener noreferrer'
                                                            className='text-cream-400 hover:text-cream-500 underline'
                                                        >
                                                            {inst.urlLabel}
                                                        </a>
                                                    </>
                                                ) : (
                                                    inst.text
                                                )}
                                            </li>
                                        ))}
                                    </ol>
                                </div>
                            </div>
                        )}

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
                    <div className='space-y-4'>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                            <div className='bg-mocha-600/50 rounded-lg p-4'>
                                <p className='text-mocha-200 text-xs uppercase tracking-wider'>Active Provider</p>
                                <p className='text-cream-400 font-medium mt-1'>{providerName}</p>
                            </div>
                            <div className='bg-mocha-600/50 rounded-lg p-4'>
                                <p className='text-mocha-200 text-xs uppercase tracking-wider'>Status</p>
                                <div className='flex items-center gap-2 mt-1'>
                                    {isActive ? (
                                        <HugeiconsIcon icon={CheckmarkBadge01Icon} className='w-5 h-5 text-green-400' />
                                    ) : null}
                                    <p className={`font-medium ${isActive ? 'text-green-400' : 'text-mocha-200'}`}>
                                        {isActive ? 'Enabled' : 'Disabled'}
                                    </p>
                                </div>
                            </div>
                        </div>
                        {config && (
                            <div className='bg-mocha-600/50 rounded-lg p-4'>
                                <p className='text-mocha-200 text-xs uppercase tracking-wider mb-2'>
                                    Configured Fields
                                </p>
                                <div className='flex flex-wrap gap-2'>
                                    {config.fields.map((field) => (
                                        <span
                                            key={field.key}
                                            className='inline-flex items-center px-2 py-0.5 rounded text-xs bg-mocha-400/50 text-mocha-200 border border-mocha-400/50'
                                        >
                                            {field.label}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CaptchaSettingsTab;
