import { useState } from 'react';
import type { UserValues } from '@/api/admin/users';
import { Input } from '@/components/elements/inputs';
import Select from '@/components/elements/Select';
import { Button } from '@/components/ui/button';

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

const Field = ({
    label,
    error,
    hint,
    children,
}: {
    label: string;
    error?: string;
    hint?: string;
    children: React.ReactNode;
}) => (
    <div className='block'>
        <span className='mb-1 block text-xs font-medium text-cream-400/70'>{label}</span>
        {children}
        {error ? (
            <span className='mt-1 block text-xs text-red-400'>{error}</span>
        ) : hint ? (
            <span className='mt-1 block text-xs text-cream-400/50'>{hint}</span>
        ) : null}
    </div>
);

const UserForm = ({ languages, initialValues, errors = {}, submitting, submitLabel, onSubmit, onCancel }: Props) => {
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
                <h2 className='text-sm font-semibold text-cream-50'>Identity</h2>
                <Field label='Email' error={errors.email}>
                    <Input.Text
                        type='email'
                        autoComplete='off'
                        value={values.email}
                        onChange={(e) => set('email', e.target.value)}
                    />
                </Field>
                <Field label='Username' error={errors.username}>
                    <Input.Text
                        autoComplete='off'
                        value={values.username}
                        onChange={(e) => set('username', e.target.value)}
                    />
                </Field>
                <Field label='Client First Name' error={errors.name_first}>
                    <Input.Text
                        autoComplete='off'
                        value={values.name_first}
                        onChange={(e) => set('name_first', e.target.value)}
                    />
                </Field>
                <Field label='Client Last Name' error={errors.name_last}>
                    <Input.Text
                        autoComplete='off'
                        value={values.name_last}
                        onChange={(e) => set('name_last', e.target.value)}
                    />
                </Field>
                <Field label='Default Language' error={errors.language}>
                    <Select
                        className='w-full'
                        value={values.language}
                        onChange={(e) => set('language', e.target.value)}
                    >
                        {Object.entries(languages).map(([code, name]) => (
                            <option key={code} value={code}>
                                {name}
                            </option>
                        ))}
                    </Select>
                </Field>
            </div>

            <div className='space-y-4'>
                <div className='space-y-4 rounded-xl border border-mocha-400 bg-mocha-500 p-4'>
                    <h2 className='text-sm font-semibold text-cream-50'>Password</h2>
                    <Field
                        label='Password'
                        error={errors.password}
                        hint='Leave blank to keep the current password. New accounts are emailed a link to set one.'
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
                    <h2 className='text-sm font-semibold text-cream-50'>Permissions</h2>
                    <Field
                        label='Administrator'
                        error={errors.root_admin}
                        hint="Setting this to 'Yes' gives a user full administrative access."
                    >
                        <Select
                            className='w-full'
                            value={values.root_admin ? '1' : '0'}
                            onChange={(e) => set('root_admin', e.target.value === '1')}
                        >
                            <option value='0'>No</option>
                            <option value='1'>Yes</option>
                        </Select>
                    </Field>
                </div>
            </div>

            <div className='lg:col-span-2 flex justify-end gap-2'>
                <Button type='button' variant='secondary' onClick={onCancel} disabled={submitting}>
                    Cancel
                </Button>
                <Button type='submit' disabled={submitting}>
                    {submitLabel}
                </Button>
            </div>
        </form>
    );
};

export default UserForm;
