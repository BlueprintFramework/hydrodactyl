import { usePasskeyVerify } from '@laravel/passkeys/react';
import type { FormikHelpers } from 'formik';
import { Formik } from 'formik';
import { useNavigate } from 'react-router-dom';
import { object, string } from 'yup';
import login from '@/api/auth/login';
import http from '@/api/http';
import LoginFormContainer, { TitleSection } from '@/components/auth/LoginFormContainer';
import Button from '@/components/elements/Button';
import Captcha, { getCaptchaResponse } from '@/components/elements/Captcha';
import Field from '@/components/elements/Field';
import { useTranslation } from '@/i18n/I18nProvider';

import CaptchaManager from '@/lib/captcha';

import useFlash from '@/plugins/useFlash';

import SecondaryLink from '../ui/secondary-link';

interface Values {
    user: string;
    password: string;
}

interface ErrorResponse {
    response: string;
    message: string;
    detail: string;
    code: string;
}

function LoginContainer() {
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const {
        verify,
        isLoading: isPasskeyLoading,
        isSupported,
    } = usePasskeyVerify({
        routes: {
            options: '/auth/passkeys/login/options',
            submit: '/auth/passkeys/login',
        },
        onSuccess: (response) => {
            const data = (response as { data?: { complete?: boolean; intended?: string; confirmation_token?: string } })
                .data;

            if (data?.complete) {
                clearFlashes();
                window.location.href = data.intended || '/';
                return;
            }

            if (data?.confirmation_token) {
                navigate('/auth/login/checkpoint', {
                    state: { token: data.confirmation_token },
                });
                return;
            }

            clearAndAddHttpError({
                error: new Error(t('auth.login.passkey_failed')),
            });
        },
        onError: (error) => {
            clearAndAddHttpError({
                error: new Error(error.message || t('auth.login.passkey_failed')),
            });
        },
    });

    const onPasskeyLogin = async () => {
        try {
            await http.get('/sanctum/csrf-cookie');
            await verify();
        } catch (error) {
            clearAndAddHttpError({ error });
        }
    };

    const onSubmit = (values: Values, { setSubmitting }: FormikHelpers<Values>) => {
        // clearFlashes();

        let loginData: Values = values;
        if (CaptchaManager.isEnabled()) {
            const captchaResponse = getCaptchaResponse();
            const fieldName = CaptchaManager.getProviderInstance().getResponseFieldName();

            if (fieldName) {
                if (captchaResponse) {
                    loginData = { ...values, [fieldName]: captchaResponse };
                } else {
                    console.error('Captcha enabled but no response available');
                    clearAndAddHttpError({
                        error: new Error(t('auth.captcha.verification_required')),
                    });
                    setSubmitting(false);
                    return;
                }
            }
        } else {
            // No captcha required
        }

        login(loginData)
            .then((response) => {
                if (response.complete) {
                    clearFlashes();
                    window.location.href = response.intended || '/';
                    return;
                }
                navigate('/auth/login/checkpoint', {
                    state: { token: response.confirmationToken },
                });
            })
            .catch((error: ErrorResponse) => {
                setSubmitting(false);

                if (error.code === 'InvalidCredentials') {
                    clearAndAddHttpError({
                        error: new Error(t('auth.login.invalid_credentials')),
                    });
                } else if (error.code === 'DisplayException') {
                    clearAndAddHttpError({
                        error: new Error(error.detail || error.message),
                    });
                } else {
                    clearAndAddHttpError({ error });
                }
            });
    };

    return (
        <Formik
            onSubmit={onSubmit}
            initialValues={{ user: '', password: '' }}
            validationSchema={object().shape({
                user: string().required(t('auth.login.username_required')),
                password: string().required(t('auth.login.password_required')),
            })}
        >
            {({ isSubmitting }) => (
                <LoginFormContainer className='mx-auto flex w-full max-w-md flex-col gap-6 rounded-2xl border border-cream-500/10 bg-bg-raised p-8 shadow-xl shadow-black/40'>
                    <TitleSection title={t('auth.login.title')} />
                    <div className=''>
                        <Field
                            id='user'
                            type={'text'}
                            label={t('auth.login.username_label')}
                            name={'user'}
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className={`relative mt-6`}>
                        <Field
                            id='password'
                            type={'password'}
                            label={t('auth.login.password_label')}
                            name={'password'}
                            disabled={isSubmitting}
                        />
                    </div>

                    <Captcha
                        className='mt-6'
                        onError={(error) => {
                            console.error('Captcha error:', error);
                            clearAndAddHttpError({
                                error: new Error(t('auth.captcha.verification_failed')),
                            });
                        }}
                    />

                    <div className='flex w-full flex-col gap-4 sm:flex-row sm:justify-between sm:items-center'>
                        <Button
                            className={`bg-mocha-100 rounded-lg p-2 px-4 text-black hover:cursor-pointer hover:bg-mocha-200 ease-in-out w-full sm:w-auto`}
                            type={'submit'}
                            size={'xlarge'}
                            isLoading={isSubmitting}
                            disabled={isSubmitting}
                        >
                            {t('auth.login.sign_in')}
                        </Button>
                        <SecondaryLink to='/auth/password' className='text-center sm:text-right'>
                            {t('auth.login.forgot_password')}
                        </SecondaryLink>
                    </div>
                    {isSupported && (
                        <Button
                            className='w-full rounded-lg bg-transparent p-2 px-4 text-white ring-1 ring-overlay/20 hover:bg-overlay/10'
                            type='button'
                            size='xlarge'
                            isLoading={isPasskeyLoading}
                            disabled={isPasskeyLoading || isSubmitting}
                            onClick={onPasskeyLogin}
                        >
                            {t('auth.login.passkey')}
                        </Button>
                    )}
                </LoginFormContainer>
            )}
        </Formik>
    );
}

export default LoginContainer;
