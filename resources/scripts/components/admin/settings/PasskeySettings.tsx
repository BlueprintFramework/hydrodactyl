import { useState } from 'react';
import { toast } from 'sonner';
import { errorToMessage, parseValidationErrors } from '@/api/admin/errors';
import { type PasskeySettings as PasskeyValues, updateSettings } from '@/api/admin/settings';
import { useSettings } from '@/api/admin/useSettings';
import { Field } from '@/components/admin/Field';
import Dropdown from '@/components/elements/Dropdown';
import { Input } from '@/components/elements/inputs';
import Spinner from '@/components/elements/Spinner';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/I18nProvider';

const Toggle = ({ value, onChange }: { value: boolean; onChange: (value: boolean) => void }) => {
    const { t } = useTranslation();

    return (
        <Dropdown
            value={value ? 'true' : 'false'}
            onChange={(next) => onChange(next === 'true')}
            options={[
                { value: 'false', label: t('common.disabled') },
                { value: 'true', label: t('common.enabled') },
            ]}
        />
    );
};

const PasskeyForm = ({ settings, onSaved }: { settings: PasskeyValues; onSaved: () => void }) => {
    const { t } = useTranslation();
    const [enabled, setEnabled] = useState(settings['passkeys:enabled']);
    const [maxPasskeys, setMaxPasskeys] = useState(String(settings['passkeys:max_per_user']));
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
                'passkeys:max_per_user': maxPasskeys,
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
            <Field
                label={t('admin.common.status')}
                error={errors['passkeys:enabled']}
                hint={t('admin.settings.passkeys_enabled_hint')}
            >
                <Toggle value={enabled} onChange={setEnabled} />
            </Field>

            <Field
                label={t('admin.settings.passkeys_max_per_user')}
                error={errors['passkeys:max_per_user']}
                hint={t('admin.settings.passkeys_max_per_user_hint')}
            >
                <Input.Text
                    type='number'
                    min={0}
                    max={100}
                    value={maxPasskeys}
                    onChange={(event) => setMaxPasskeys(event.target.value)}
                />
            </Field>

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
