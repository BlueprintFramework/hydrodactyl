import { useState } from 'react';
import { toast } from 'sonner';
import { errorToMessage, parseValidationErrors } from '@/api/admin/errors';
import { updateSettings } from '@/api/admin/settings';
import { useSettings } from '@/api/admin/useSettings';
import { Field } from '@/components/admin/Field';
import { Input } from '@/components/elements/inputs';
import Select from '@/components/elements/Select';
import Spinner from '@/components/elements/Spinner';
import { Button } from '@/components/ui/button';

interface Props {
    host: string;
    port: number;
    encryption: string | null;
    username: string | null;
    fromAddress: string;
    fromName: string | null;
    onSaved: () => void;
}

const MailForm = ({ host, port, encryption, username, fromAddress, fromName, onSaved }: Props) => {
    const [values, setValues] = useState({
        host,
        port: String(port),
        encryption: encryption ?? '',
        username: username ?? '',
        password: '',
        fromAddress,
        fromName: fromName ?? '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const save = async () => {
        setSubmitting(true);
        setErrors({});

        try {
            await updateSettings('mail', {
                'mail:mailers:smtp:host': values.host,
                'mail:mailers:smtp:port': values.port,
                'mail:mailers:smtp:encryption': values.encryption === '' ? null : values.encryption,
                'mail:mailers:smtp:username': values.username,
                ...(values.password !== '' ? { 'mail:mailers:smtp:password': values.password } : {}),
                'mail:from:address': values.fromAddress,
                'mail:from:name': values.fromName,
            });
            await onSaved();
            setValues({ ...values, password: '' });
            toast.success('Settings saved.');
        } catch (error) {
            setErrors(parseValidationErrors(error));
            toast.error(errorToMessage(error, 'Failed to save settings.'));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form
            onSubmit={(event) => {
                event.preventDefault();
                void save();
            }}
            className='space-y-4'
        >
            <div className='space-y-4 rounded-xl border border-mocha-400 bg-mocha-500 p-4'>
                <h2 className='text-sm font-semibold text-cream-50'>SMTP Server</h2>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <Field label='Host' error={errors['mail:mailers:smtp:host']}>
                        <Input.Text
                            value={values.host}
                            onChange={(e) => setValues({ ...values, host: e.target.value })}
                        />
                    </Field>
                    <Field label='Port' error={errors['mail:mailers:smtp:port']}>
                        <Input.Text
                            type='number'
                            value={values.port}
                            onChange={(e) => setValues({ ...values, port: e.target.value })}
                        />
                    </Field>
                    <Field label='Encryption' error={errors['mail:mailers:smtp:encryption']}>
                        <Select
                            className='w-full'
                            value={values.encryption}
                            onChange={(e) => setValues({ ...values, encryption: e.target.value })}
                        >
                            <option value=''>None</option>
                            <option value='tls'>TLS</option>
                            <option value='ssl'>SSL</option>
                        </Select>
                    </Field>
                    <Field label='Username' error={errors['mail:mailers:smtp:username']}>
                        <Input.Text
                            value={values.username}
                            onChange={(e) => setValues({ ...values, username: e.target.value })}
                        />
                    </Field>
                    <Field
                        label='Password'
                        error={errors['mail:mailers:smtp:password']}
                        hint='Leave blank to keep the current password.'
                    >
                        <Input.Text
                            type='password'
                            autoComplete='new-password'
                            value={values.password}
                            onChange={(e) => setValues({ ...values, password: e.target.value })}
                        />
                    </Field>
                </div>
            </div>

            <div className='space-y-4 rounded-xl border border-mocha-400 bg-mocha-500 p-4'>
                <h2 className='text-sm font-semibold text-cream-50'>Sender</h2>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <Field label='From Address' error={errors['mail:from:address']}>
                        <Input.Text
                            type='email'
                            value={values.fromAddress}
                            onChange={(e) => setValues({ ...values, fromAddress: e.target.value })}
                        />
                    </Field>
                    <Field label='From Name' error={errors['mail:from:name']}>
                        <Input.Text
                            value={values.fromName}
                            onChange={(e) => setValues({ ...values, fromName: e.target.value })}
                        />
                    </Field>
                </div>
            </div>

            <div className='flex justify-end'>
                <Button type='submit' disabled={submitting}>
                    Save
                </Button>
            </div>
        </form>
    );
};

const MailSettings = () => {
    const { data, mutate } = useSettings();

    if (!data) {
        return (
            <div className='flex items-center justify-center py-16'>
                <Spinner centered size={Spinner.Size.LARGE} />
            </div>
        );
    }

    if (!data.mail.enabled) {
        return (
            <div className='rounded-xl border border-mocha-400 bg-mocha-500 p-4 text-sm text-cream-400/70'>
                Mail settings can only be edited when SMTP is the configured mail driver.
            </div>
        );
    }

    return (
        <MailForm
            host={data.mail['mail:mailers:smtp:host']}
            port={data.mail['mail:mailers:smtp:port']}
            encryption={data.mail['mail:mailers:smtp:encryption']}
            username={data.mail['mail:mailers:smtp:username']}
            fromAddress={data.mail['mail:from:address']}
            fromName={data.mail['mail:from:name']}
            onSaved={mutate}
        />
    );
};

export default MailSettings;
