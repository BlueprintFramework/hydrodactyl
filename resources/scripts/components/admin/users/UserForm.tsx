import { useState } from 'react';
import type { UserValues } from '@/api/admin/users';
import { Field } from '@/components/admin/Field';
import Dropdown from '@/components/elements/Dropdown';
import { Input } from '@/components/elements/inputs';
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
                    <Dropdown
                        value={values.language}
                        onChange={(value) => set('language', value)}
                        options={Object.entries(languages).map(([value, label]) => ({ value, label }))}
                    />
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
                        <Dropdown
                            value={values.root_admin ? '1' : '0'}
                            onChange={(value) => set('root_admin', value === '1')}
                            options={[
                                { value: '0', label: 'No' },
                                { value: '1', label: 'Yes' },
                            ]}
                        />
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
