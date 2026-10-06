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
    name: string;
    locale: string;
    twoFactor: number;
    languages: Record<string, string>;
    onSaved: () => void;
}

const GeneralForm = ({ name, locale, twoFactor, languages, onSaved }: Props) => {
    const [values, setValues] = useState({ name, locale, twoFactor });
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const save = async () => {
        setSubmitting(true);
        setErrors({});

        try {
            await updateSettings('general', {
                'app:name': values.name,
                'app:locale': values.locale,
                'pterodactyl:auth:2fa_required': values.twoFactor,
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

    return (
        <form
            onSubmit={(event) => {
                event.preventDefault();
                void save();
            }}
            className='space-y-4 rounded-xl border border-mocha-400 bg-mocha-500 p-4'
        >
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <Field label='Company Name' error={errors['app:name']}>
                    <Input.Text value={values.name} onChange={(e) => setValues({ ...values, name: e.target.value })} />
                </Field>
                <Field label='Default Language' error={errors['app:locale']}>
                    <Select
                        className='w-full'
                        value={values.locale}
                        onChange={(e) => setValues({ ...values, locale: e.target.value })}
                    >
                        {Object.entries(languages).map(([code, label]) => (
                            <option key={code} value={code}>
                                {label}
                            </option>
                        ))}
                    </Select>
                </Field>
            </div>

            <Field
                label='Require 2-Factor Authentication'
                error={errors['pterodactyl:auth:2fa_required']}
                hint='Accounts in the selected group must have 2FA enabled to use the panel.'
            >
                <Select
                    className='w-full md:w-1/3'
                    value={String(values.twoFactor)}
                    onChange={(e) => setValues({ ...values, twoFactor: Number(e.target.value) })}
                >
                    <option value='0'>Not Required</option>
                    <option value='1'>Admin Only</option>
                    <option value='2'>All Users</option>
                </Select>
            </Field>

            <div className='flex justify-end'>
                <Button type='submit' disabled={submitting}>
                    Save
                </Button>
            </div>
        </form>
    );
};

const GeneralSettings = () => {
    const { data, mutate } = useSettings();

    if (!data) {
        return (
            <div className='flex items-center justify-center py-16'>
                <Spinner centered size={Spinner.Size.LARGE} />
            </div>
        );
    }

    return (
        <GeneralForm
            name={data.general['app:name']}
            locale={data.general['app:locale']}
            twoFactor={data.general['pterodactyl:auth:2fa_required']}
            languages={data.languages}
            onSaved={mutate}
        />
    );
};

export default GeneralSettings;
