import { useState } from 'react';
import type { UserValues } from '@/api/admin/users';
import { Field } from '@/components/admin/Field';
import Dropdown from '@/components/elements/Dropdown';
import { Input } from '@/components/elements/inputs';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/I18nProvider';

interface Props {
    languages: Record<string, string>;
    initialValues?: Partial<UserValues>;
    errors?: Record<string, string>;
    submitting?: boolean;
    submitLabel: string;
    onSubmit: (values: UserValues) => void;
    onCancel: () => void;
}

const emptyValues: UserValues = {
    email: '',
    username: '',
    name_first: '',
    name_last: '',
    password: '',
    language: 'en',
    root_admin: false,
};

const UserForm = ({ languages, initialValues, errors = {}, submitting, submitLabel, onSubmit, onCancel }: Props) => {
    const { t } = useTranslation();
    const [values, setValues] = useState<UserValues>({ ...emptyValues, ...initialValues });

    const set = <K extends keyof UserValues>(key: K, value: UserValues[K]) =>
        setValues((current) => ({ ...current, [key]: value }));

    return (
        <form
            onSubmit={(event) => {
                event.preventDefault();
                onSubmit(values);
            }}
            className='grid grid-cols-1 lg:grid-cols-2 gap-4'
        >
            <div className='space-y-4 rounded-xl border border-mocha-400 bg-mocha-500 p-4'>
                <h2 className='text-sm font-semibold text-cream-50'>{t('admin.users.identity')}</h2>
                <Field label={t('admin.users.email')} error={errors.email}>
                    <Input.Text
                        type='email'
                        autoComplete='off'
                        value={values.email}
                        onChange={(e) => set('email', e.target.value)}
                    />
                </Field>
                <Field label={t('admin.users.username')} error={errors.username}>
                    <Input.Text
                        autoComplete='off'
                        value={values.username}
                        onChange={(e) => set('username', e.target.value)}
                    />
                </Field>
                <Field label={t('admin.users.first_name')} error={errors.name_first}>
                    <Input.Text
                        autoComplete='off'
                        value={values.name_first}
                        onChange={(e) => set('name_first', e.target.value)}
                    />
                </Field>
                <Field label={t('admin.users.last_name')} error={errors.name_last}>
                    <Input.Text
                        autoComplete='off'
                        value={values.name_last}
                        onChange={(e) => set('name_last', e.target.value)}
                    />
                </Field>
                <Field label={t('admin.users.default_language')} error={errors.language}>
                    <Dropdown
                        value={values.language}
                        onChange={(value) => set('language', value)}
                        options={Object.entries(languages).map(([value, label]) => ({ value, label }))}
                    />
                </Field>
            </div>

            <div className='space-y-4'>
                <div className='space-y-4 rounded-xl border border-mocha-400 bg-mocha-500 p-4'>
                    <h2 className='text-sm font-semibold text-cream-50'>{t('admin.users.password')}</h2>
                    <Field
                        label={t('admin.users.password')}
                        error={errors.password}
                        hint={t('admin.users.password_hint')}
                    >
                        <Input.Text
                            type='password'
                            autoComplete='new-password'
                            value={values.password}
                            onChange={(e) => set('password', e.target.value)}
                        />
                    </Field>
                </div>

                <div className='space-y-4 rounded-xl border border-mocha-400 bg-mocha-500 p-4'>
                    <h2 className='text-sm font-semibold text-cream-50'>{t('admin.users.permissions')}</h2>
                    <Field
                        label={t('admin.users.administrator')}
                        error={errors.root_admin}
                        hint={t('admin.users.administrator_hint')}
                    >
                        <Dropdown
                            value={values.root_admin ? '1' : '0'}
                            onChange={(value) => set('root_admin', value === '1')}
                            options={[
                                { value: '0', label: t('common.no') },
                                { value: '1', label: t('common.yes') },
                            ]}
                        />
                    </Field>
                </div>
            </div>

            <div className='lg:col-span-2 flex justify-end gap-2'>
                <Button type='button' variant='secondary' onClick={onCancel} disabled={submitting}>
                    {t('common.cancel')}
                </Button>
                <Button type='submit' disabled={submitting}>
                    {submitLabel}
                </Button>
            </div>
        </form>
    );
};

export default UserForm;
