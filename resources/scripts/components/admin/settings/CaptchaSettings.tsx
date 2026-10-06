import { useState } from 'react';
import { toast } from 'sonner';
import { errorToMessage, parseValidationErrors } from '@/api/admin/errors';
import { type CaptchaSettings as CaptchaValues, updateSettings } from '@/api/admin/settings';
import { useSettings } from '@/api/admin/useSettings';
import { Field } from '@/components/admin/Field';
import Dropdown from '@/components/elements/Dropdown';
import { Input } from '@/components/elements/inputs';
import Spinner from '@/components/elements/Spinner';
import { Button } from '@/components/ui/button';

const providerFields: Record<string, { key: keyof CaptchaValues; label: string; secret?: boolean }[]> = {
    turnstile: [
        { key: 'pterodactyl:captcha:turnstile:site_key', label: 'Site Key' },
        { key: 'pterodactyl:captcha:turnstile:secret_key', label: 'Secret Key', secret: true },
    ],
    hcaptcha: [
        { key: 'pterodactyl:captcha:hcaptcha:site_key', label: 'Site Key' },
        { key: 'pterodactyl:captcha:hcaptcha:secret_key', label: 'Secret Key', secret: true },
    ],
    recaptcha: [
        { key: 'pterodactyl:captcha:recaptcha:site_key', label: 'Site Key' },
        { key: 'pterodactyl:captcha:recaptcha:secret_key', label: 'Secret Key', secret: true },
    ],
    cap: [
        { key: 'pterodactyl:captcha:cap:server_url', label: 'Server URL' },
        { key: 'pterodactyl:captcha:cap:site_key', label: 'Site Key' },
        { key: 'pterodactyl:captcha:cap:secret_key', label: 'Secret Key', secret: true },
    ],
};

const CaptchaForm = ({ settings, onSaved }: { settings: CaptchaValues; onSaved: () => void }) => {
    const [provider, setProvider] = useState(settings['pterodactyl:captcha:provider']);
    const [fields, setFields] = useState<Record<string, string>>(() =>
        Object.fromEntries(
            Object.values(providerFields)
                .flat()
                .map(({ key }) => [key, (settings[key] as string | undefined) ?? '']),
        ),
    );
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const save = async () => {
        setSubmitting(true);
        setErrors({});

        try {
            await updateSettings('captcha', {
                'pterodactyl:captcha:provider': provider,
                ...fields,
            });
            await onSaved();
            toast.success('Settings saved.');
        } catch (error) {
            setErrors(parseValidationErrors(error));
            toast.error(errorToMessage(error, 'Failed to save settings.'));
        } finally {
            setSubmitting(false);
        }
    };

    const active = providerFields[provider] ?? [];

    return (
        <form
            onSubmit={(event) => {
                event.preventDefault();
                void save();
            }}
            className='space-y-4'
        >
            <div className='space-y-4 rounded-xl border border-mocha-400 bg-mocha-500 p-4'>
                <Field label='Provider' error={errors['pterodactyl:captcha:provider']}>
                    <Dropdown
                        className='md:w-1/3'
                        value={provider}
                        onChange={setProvider}
                        options={Object.entries(settings.providers).map(([value, label]) => ({ value, label }))}
                    />
                </Field>
            </div>

            {active.length > 0 && (
                <div className='space-y-4 rounded-xl border border-mocha-400 bg-mocha-500 p-4'>
                    <h2 className='text-sm font-semibold text-cream-50'>Configuration</h2>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        {active.map(({ key, label, secret }) => (
                            <Field key={key} label={label} error={errors[key]}>
                                <Input.Text
                                    type={secret ? 'password' : 'text'}
                                    autoComplete='off'
                                    value={fields[key] ?? ''}
                                    onChange={(e) => setFields({ ...fields, [key]: e.target.value })}
                                />
                            </Field>
                        ))}
                    </div>
                </div>
            )}

            <div className='flex justify-end'>
                <Button type='submit' disabled={submitting}>
                    Save
                </Button>
            </div>
        </form>
    );
};

const CaptchaSettings = () => {
    const { data, mutate } = useSettings();

    if (!data) {
        return (
            <div className='flex items-center justify-center py-16'>
                <Spinner centered size={Spinner.Size.LARGE} />
            </div>
        );
    }

    return <CaptchaForm settings={data.captcha} onSaved={mutate} />;
};

export default CaptchaSettings;
