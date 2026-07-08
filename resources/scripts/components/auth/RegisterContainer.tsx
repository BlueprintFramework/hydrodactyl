import type { FormikHelpers } from 'formik';
import { Formik } from 'formik';
import { object, ref, string } from 'yup';
import register from '@/api/auth/register';
import LoginFormContainer, { TitleSection } from '@/components/auth/LoginFormContainer';
import Button from '@/components/elements/Button';
import Captcha, { getCaptchaResponse } from '@/components/elements/Captcha';
import Field from '@/components/elements/Field';

import CaptchaManager from '@/lib/captcha';

import useFlash from '@/plugins/useFlash';

import SecondaryLink from '../ui/secondary-link';

interface Values {
    username: string;
    email: string;
    name_first: string;
    name_last: string;
    password: string;
    password_confirmation: string;
}

function RegisterContainer() {
    const { clearFlashes, clearAndAddHttpError } = useFlash();

    const onSubmit = (values: Values, { setSubmitting }: FormikHelpers<Values>) => {
        let registerData: Values = values;
        if (CaptchaManager.isEnabled()) {
            const captchaResponse = getCaptchaResponse();
            const fieldName = CaptchaManager.getProviderInstance().getResponseFieldName();

            if (fieldName) {
                if (captchaResponse) {
                    registerData = { ...values, [fieldName]: captchaResponse };
                } else {
                    clearAndAddHttpError({
                        error: new Error('Please complete the captcha verification.'),
                    });
                    setSubmitting(false);
                    return;
                }
            }
        }

        register(registerData)
            .then((response) => {
                if (response.complete) {
                    clearFlashes();
                    window.location.href = response.intended || '/';
                }
            })
            .catch((error) => {
                setSubmitting(false);
                clearAndAddHttpError({ error });
            });
    };

    return (
        <Formik
            onSubmit={onSubmit}
            initialValues={{
                username: '',
                email: '',
                name_first: '',
                name_last: '',
                password: '',
                password_confirmation: '',
            }}
            validationSchema={object().shape({
                username: string()
                    .matches(
                        /^[a-z0-9]([\w.-]+)[a-z0-9]$/,
                        'Username must start and end with alphanumeric characters and contain only letters, numbers, dashes, underscores, and periods.',
                    )
                    .required('A username is required.'),
                email: string().email('Enter a valid email address.').required('An email address is required.'),
                name_first: string().required('Your first name is required.'),
                name_last: string(),
                password: string()
                    .min(8, 'Your password must be at least 8 characters.')
                    .required('A password is required.'),
                password_confirmation: string()
                    .required('Please confirm your password.')
                    .oneOf([ref('password')], 'Passwords do not match.'),
            })}
        >
            {({ isSubmitting }) => (
                <LoginFormContainer className={`flex flex-col gap-6`}>
                    <TitleSection title='Sign Up' subtitle='Create a new account' />
                    <div className='grid grid-cols-2 gap-4'>
                        <Field
                            id='name_first'
                            type={'text'}
                            label={'First Name'}
                            name={'name_first'}
                            disabled={isSubmitting}
                        />
                        <Field
                            id='name_last'
                            type={'text'}
                            label={'Last Name'}
                            name={'name_last'}
                            disabled={isSubmitting}
                        />
                    </div>
                    <div>
                        <Field
                            id='username'
                            type={'text'}
                            label={'Username'}
                            name={'username'}
                            disabled={isSubmitting}
                        />
                    </div>
                    <div>
                        <Field
                            id='email'
                            type={'email'}
                            label={'Email'}
                            name={'email'}
                            disabled={isSubmitting}
                        />
                    </div>
                    <div className='grid grid-cols-2 gap-4'>
                        <Field
                            id='password'
                            type={'password'}
                            label={'Password'}
                            name={'password'}
                            disabled={isSubmitting}
                        />
                        <Field
                            id='password_confirmation'
                            type={'password'}
                            label={'Confirm Password'}
                            name={'password_confirmation'}
                            disabled={isSubmitting}
                        />
                    </div>

                    <Captcha
                        className='mt-6'
                        onError={(error) => {
                            console.error('Captcha error:', error);
                            clearAndAddHttpError({
                                error: new Error('Captcha verification failed. Please try again.'),
                            });
                        }}
                    />

                    <div className='flex w-full justify-between items-center'>
                        <Button
                            className={`bg-mocha-100 rounded-lg p-2 px-4 text-black hover:cursor-pointer hover:bg-mocha-200 ease-in-out`}
                            type={'submit'}
                            size={'xlarge'}
                            isLoading={isSubmitting}
                            disabled={isSubmitting}
                        >
                            Sign Up
                        </Button>
                        <SecondaryLink to='/auth/login'>Already have an account?</SecondaryLink>
                    </div>
                </LoginFormContainer>
            )}
        </Formik>
    );
}

export default RegisterContainer;
