import { type FieldProps, Field as FormikField } from 'formik';
import { forwardRef } from 'react';

interface OwnProps {
    name: string;
    label?: string;
    description?: string;
    validate?: (value: unknown) => undefined | string | Promise<unknown>;
}

type Props = OwnProps & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'name'>;

const Field = forwardRef<HTMLInputElement, Props>(
    ({ id, name = false, label, description, validate, ...props }, ref) => (
        <FormikField innerRef={ref} name={name} validate={validate}>
            {({ field, form: { errors, touched } }: FieldProps) => (
                <div className='flex flex-col gap-2'>
                    {label && (
                        <label className='text-sm text-[#ffffff77]' htmlFor={id}>
                            {label}
                        </label>
                    )}
                    <input
                        className='w-full px-4 py-2.5 rounded-lg outline-hidden bg-mocha-500/60 border border-cream-500/15 text-cream-400 text-base sm:text-sm placeholder:text-cream-400/40 transition-colors focus:border-cream-500/40 focus:bg-mocha-500/80'
                        id={id}
                        {...field}
                        {...props}
                    />
                    {touched[field.name] && errors[field.name] ? (
                        <p className={'text-sm font-bold text-[#d36666]'}>
                            {(errors[field.name] as string).charAt(0).toUpperCase() +
                                (errors[field.name] as string).slice(1)}
                        </p>
                    ) : description ? (
                        <p className={'text-sm font-bold'}>{description}</p>
                    ) : null}
                </div>
            )}
        </FormikField>
    ),
);
Field.displayName = 'Field';

export default Field;
