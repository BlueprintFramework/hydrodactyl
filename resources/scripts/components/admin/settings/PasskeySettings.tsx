import { useState } from 'react';
import { toast } from 'sonner';
import { errorToMessage, parseValidationErrors } from '@/api/admin/errors';
import { type PasskeySettings as PasskeyValues, updateSettings } from '@/api/admin/settings';
import { useSettings } from '@/api/admin/useSettings';
import { Field } from '@/components/admin/Field';
import { Input } from '@/components/elements/inputs';
import Spinner from '@/components/elements/Spinner';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/I18nProvider';

const PasskeyForm = ({ settings, onSaved }: { settings: PasskeyValues; onSaved: () => void }) => {
    const { t } = useTranslation();
    const [enabled, setEnabled] = useState(settings['passkeys:enabled']);
    const [relyingPartyId, setRelyingPartyId] = useState(settings['passkeys:relying_party_id']);
    const [allowedOrigins, setAllowedOrigins] = useState(settings['passkeys:allowed_origins']);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const save = async () => {
        setSubmitting(true);
        setErrors({});

        try {
            await updateSettings('passkeys', {
                'passkeys:enabled': enabled,
                'passkeys:relying_party_id': relyingPartyId,
                'passkeys:allowed_origins': allowedOrigins,
            });
            await onSaved();
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
            className='space-y-4 rounded-xl border border-mocha-400 bg-mocha-500 p-4'
        >
            <div className='flex items-center justify-between gap-4 rounded-lg border border-mocha-400/70 p-4'>
                <div>
                    <p className='text-sm font-medium text-cream-50'>{t('admin.settings.passkeys_enabled')}</p>
                    <p className='mt-1 text-xs text-neutral-400'>{t('admin.settings.passkeys_enabled_hint')}</p>
                </div>
                <Input.Checkbox
                    checked={enabled}
                    onChange={(event) => setEnabled(event.target.checked)}
                    aria-label={t('admin.settings.passkeys_enabled')}
                />
            </div>

            <Field
                label={t('admin.settings.passkeys_relying_party_id')}
                error={errors['passkeys:relying_party_id']}
                hint={t('admin.settings.passkeys_relying_party_id_hint')}
            >
                <Input.Text
                    value={relyingPartyId}
                    onChange={(event) => setRelyingPartyId(event.target.value)}
                    placeholder='panel.example.com'
                    autoComplete='off'
                />
            </Field>

            <Field
                label={t('admin.settings.passkeys_allowed_origins')}
                error={errors['passkeys:allowed_origins']}
                hint={t('admin.settings.passkeys_allowed_origins_hint')}
            >
                <Input.Text
                    value={allowedOrigins}
                    onChange={(event) => setAllowedOrigins(event.target.value)}
                    placeholder='https://panel.example.com'
                    autoComplete='off'
                />
            </Field>

            <div className='flex justify-end'>
                <Button type='submit' disabled={submitting}>
                    {t('common.save')}
                </Button>
            </div>
        </form>
    );
};

const PasskeySettings = () => {
    const { data, mutate } = useSettings();

    if (!data) {
        return (
            <div className='flex items-center justify-center py-16'>
                <Spinner centered size={Spinner.Size.LARGE} />
            </div>
        );
    }

    return <PasskeyForm settings={data.passkeys} onSaved={mutate} />;
};

export default PasskeySettings;
