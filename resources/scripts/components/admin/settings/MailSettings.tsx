import { useState } from 'react';
import { toast } from 'sonner';
import { errorToMessage, parseValidationErrors } from '@/api/admin/errors';
import { updateSettings } from '@/api/admin/settings';
import { useSettings } from '@/api/admin/useSettings';
import { Field } from '@/components/admin/Field';
import Dropdown from '@/components/elements/Dropdown';
import { Input } from '@/components/elements/inputs';
import Spinner from '@/components/elements/Spinner';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/I18nProvider';

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
    const { t } = useTranslation();
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
            toast.success(t('admin.settings.saved'));
        } catch (error) {
            setErrors(parseValidationErrors(error));
            toast.error(errorToMessage(error, t('admin.settings.save_failed')));
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
                <h2 className='text-sm font-semibold text-cream-50'>{t('admin.settings.smtp_server')}</h2>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <Field label={t('admin.databases.host')} error={errors['mail:mailers:smtp:host']}>
                        <Input.Text
                            value={values.host}
                            onChange={(e) => setValues({ ...values, host: e.target.value })}
                        />
                    </Field>
                    <Field label={t('admin.common.port')} error={errors['mail:mailers:smtp:port']}>
                        <Input.Text
                            type='number'
                            value={values.port}
                            onChange={(e) => setValues({ ...values, port: e.target.value })}
                        />
                    </Field>
                    <Field label={t('admin.settings.encryption')} error={errors['mail:mailers:smtp:encryption']}>
                        <Dropdown
                            value={values.encryption}
                            onChange={(value) => setValues({ ...values, encryption: value })}
                            options={[
                                { value: '', label: t('common.none') },
                                { value: 'tls', label: 'TLS' },
                                { value: 'ssl', label: 'SSL' },
                            ]}
                        />
                    </Field>
                    <Field label={t('admin.common.username')} error={errors['mail:mailers:smtp:username']}>
                        <Input.Text
                            value={values.username}
                            onChange={(e) => setValues({ ...values, username: e.target.value })}
                        />
                    </Field>
                    <Field
                        label={t('admin.common.password')}
                        error={errors['mail:mailers:smtp:password']}
                        hint={t('admin.databases.password_keep_hint')}
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
                <h2 className='text-sm font-semibold text-cream-50'>{t('admin.settings.sender')}</h2>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <Field label={t('admin.settings.from_address')} error={errors['mail:from:address']}>
                        <Input.Text
                            type='email'
                            value={values.fromAddress}
                            onChange={(e) => setValues({ ...values, fromAddress: e.target.value })}
                        />
                    </Field>
                    <Field label={t('admin.settings.from_name')} error={errors['mail:from:name']}>
                        <Input.Text
                            value={values.fromName}
                            onChange={(e) => setValues({ ...values, fromName: e.target.value })}
                        />
                    </Field>
                </div>
            </div>

            <div className='flex justify-end'>
                <Button type='submit' disabled={submitting}>
                    {t('common.save')}
                </Button>
            </div>
        </form>
    );
};

const MailSettings = () => {
    const { t } = useTranslation();
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
                {t('admin.settings.smtp_only')}
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
