import { Edit02Icon, InformationCircleIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import useSWR from 'swr';
import { getGeneralSettings, updateGeneralSettings } from '@/api/admin/settings';
import { httpErrorToHuman } from '@/api/http';
import Spinner from '@/components/elements/Spinner';
import { Button } from '@/components/ui/button';

const inputClass =
    'w-full bg-mocha-600 border border-mocha-400 rounded px-3 py-2 text-sm text-cream-400 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 transition-all';
const labelClass = 'block text-sm text-mocha-200 mb-1';

const GeneralSettingsTab = () => {
    const {
        data: settings,
        isLoading,
        error: fetchError,
        mutate,
    } = useSWR('admin:settings:general', getGeneralSettings);
    const [saving, setSaving] = useState(false);
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({ 'app:locale': '', 'pterodactyl:auth:2fa_required': 0 });

    useEffect(() => {
        if (settings) {
            setForm({
                'app:locale': settings['app:locale'],
                'pterodactyl:auth:2fa_required': settings['pterodactyl:auth:2fa_required'],
            });
        }
    }, [settings]);

    const handleSave = () => {
        setSaving(true);
        updateGeneralSettings(form)
            .then(() => {
                toast.success('General settings updated successfully');
                mutate();
                setEditing(false);
            })
            .catch((e) => toast.error(httpErrorToHuman(e)))
            .finally(() => setSaving(false));
    };

    const handleCancel = () => {
        if (settings) {
            setForm({
                'app:locale': settings['app:locale'],
                'pterodactyl:auth:2fa_required': settings['pterodactyl:auth:2fa_required'],
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

    const languages = settings.available_languages || {};
    const levels: [number, string, string][] = [
        [0, 'Not Required', '2FA is optional for all users'],
        [1, 'Admin Only', 'Only administrators must have 2FA enabled'],
        [2, 'All Users', 'Every account must have 2FA enabled'],
    ];

    const twoFaLabel = levels.find(([val]) => val === settings['pterodactyl:auth:2fa_required'])?.[1] || 'Unknown';

    return (
        <div className='space-y-6 mt-4'>
            {/* Profile Card */}
            <div className='bg-mocha-500 border border-mocha-400 rounded-xl p-6'>
                <div className='flex flex-col sm:flex-row items-start sm:items-center gap-5'>
                    <div className='w-16 h-16 rounded-xl bg-brand/10 flex items-center justify-center shrink-0 border border-mocha-400'>
                        <HugeiconsIcon icon={InformationCircleIcon} className='w-8 h-8 text-brand' />
                    </div>
                    <div className='flex-1'>
                        <h2 className='text-xl font-bold text-cream-400'>General</h2>
                        <p className='text-mocha-200 text-sm mt-1'>Locale and authentication settings</p>
                    </div>
                    <div className='flex items-center gap-3'>
                        <div className='text-center bg-mocha-600/50 rounded-lg px-4 py-3'>
                            <p className='text-2xl font-bold text-cream-400'>{settings['app:locale'] || 'en'}</p>
                            <p className='text-xs text-mocha-200'>Locale</p>
                        </div>
                        <div className='text-center bg-mocha-600/50 rounded-lg px-4 py-3'>
                            <p className='text-2xl font-bold text-cream-400'>2FA</p>
                            <p className='text-xs text-mocha-200'>{twoFaLabel}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Settings Card */}
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
                            <HugeiconsIcon
                                icon={InformationCircleIcon}
                                className={`w-5 h-5 ${editing ? 'text-cream-400' : 'text-cream-400'}`}
                            />
                        </div>
                        <div>
                            <div className='flex items-center gap-2'>
                                <h3 className='text-cream-400 font-semibold text-lg'>General Settings</h3>
                                {editing && (
                                    <span className='inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-cream-400/10 text-cream-400 border border-cream-400/20'>
                                        Editing
                                    </span>
                                )}
                            </div>
                            <p className='text-mocha-200 text-sm'>Locale and authentication</p>
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
                            <label className={labelClass} htmlFor='default-language'>
                                Default Language
                            </label>
                            <select
                                className={inputClass}
                                id='default-language'
                                value={form['app:locale']}
                                onChange={(e) => setForm({ ...form, 'app:locale': e.target.value })}
                            >
                                {Object.keys(languages).length === 0 && (
                                    <option value='' disabled className='bg-mocha-600 text-mocha-200'>
                                        No languages available
                                    </option>
                                )}
                                {Object.entries(languages).map(([key, value]) => (
                                    <option key={key} value={key} className='bg-mocha-600 text-cream-400'>
                                        {value}
                                    </option>
                                ))}
                            </select>
                            <p className='text-xs text-mocha-200/60 mt-1'>Default language for UI components.</p>
                        </div>

                        <div>
                            <label className={labelClass} htmlFor='2fa-required'>
                                Require 2-Factor Authentication
                            </label>
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
                                            id={val === 2 ? '2fa-required' : undefined}
                                        />
                                        <div className='px-4 py-3 bg-mocha-600 border border-mocha-400 rounded-lg text-center peer-checked:border-brand peer-checked:bg-brand/10 transition-all'>
                                            <div
                                                className={`text-sm font-medium ${form['pterodactyl:auth:2fa_required'] === val ? 'text-cream-400' : 'text-mocha-100'}`}
                                            >
                                                {label}
                                            </div>
                                            <div className='text-xs text-mocha-200/60 mt-1'>{desc}</div>
                                        </div>
                                    </label>
                                ))}
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
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <div className='bg-mocha-600/50 rounded-lg p-4'>
                            <p className='text-mocha-200 text-xs uppercase tracking-wider'>Default Locale</p>
                            <p className='text-cream-400 font-medium mt-1'>{settings['app:locale'] || '—'}</p>
                        </div>
                        <div className='bg-mocha-600/50 rounded-lg p-4'>
                            <p className='text-mocha-200 text-xs uppercase tracking-wider'>2FA Requirement</p>
                            <p className='text-cream-400 font-medium mt-1'>{twoFaLabel}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GeneralSettingsTab;
