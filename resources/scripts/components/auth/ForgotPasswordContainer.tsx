import type { FormikHelpers } from 'formik';
import { Formik } from 'formik';
import { object, string } from 'yup';
import http, { httpErrorToHuman } from '@/api/http';
import LoginFormContainer, { TitleSection } from '@/components/auth/LoginFormContainer';
import Button from '@/components/elements/Button';
import Captcha, { getCaptchaResponse } from '@/components/elements/Captcha';
import Field from '@/components/elements/Field';
import { useTranslation } from '@/i18n/I18nProvider';
import CaptchaManager from '@/lib/captcha';
import useFlash from '@/plugins/useFlash';
import SecondaryLink from '../ui/secondary-link';

interface Values {
    email: string;
}

const ForgotPasswordContainer = () => {
    const { clearFlashes, addFlash } = useFlash();
    const { t } = useTranslation();

    const handleSubmission = ({ email }: Values, { setSubmitting, resetForm }: FormikHelpers<Values>) => {
        clearFlashes();

        // Get captcha response if enabled
        const captchaResponse = getCaptchaResponse();

        let requestData: Record<string, unknown> = { email };
        if (CaptchaManager.isEnabled() && captchaResponse) {
            const fieldName = CaptchaManager.getProviderInstance().getResponseFieldName();
            if (fieldName) {
                requestData = { ...requestData, [fieldName]: captchaResponse };
            }
        }

        http.post('/auth/password', requestData)
            .then((response) => {
                resetForm();
                addFlash({
                    type: 'success',
                    title: t('auth.forgot_password.success_title'),
                    message: response.data.status || t('auth.forgot_password.email_sent'),
                });
            })
            .catch((error) => {
                console.error(error);
                addFlash({
                    type: 'error',
                    title: t('common.error'),
                    message: httpErrorToHuman(error),
                });
            })
            .finally(() => {
                setSubmitting(false);
            });
    };

    return (
        <Formik
            onSubmit={handleSubmission}
            initialValues={{ email: '' }}
            validationSchema={object().shape({
                email: string().email(t('auth.email_invalid')).required(t('auth.email_required')),
            })}
        >
            {({ isSubmitting }) => (
                <LoginFormContainer className={`w-full flex flex-col`}>
                    <TitleSection title={t('auth.forgot_password.heading')} />
                    <div className='text-sm mb-6'>{t('auth.forgot_password.description')}</div>
                    <Field id='email' label={t('auth.email_label')} name={'email'} type={'email'} />

                    <Captcha
                        className='mt-6'
                        onError={(error) => {
                            console.error('Captcha error:', error);
                            addFlash({
                                type: 'error',
                                title: t('common.error'),
                                message: t('auth.captcha.verification_failed'),
                            });
                        }}
                    />

                    <div className='flex w-full flex-col gap-3 mt-6 sm:flex-row sm:justify-between sm:items-center'>
                        <Button
                            className={`bg-mocha-100 text-black p-2 px-4 rounded-full border-0 ring-0 outline-hidden capitalize w-full sm:w-auto`}
                            type='submit'
                            size='xlarge'
                            isLoading={isSubmitting}
                            disabled={isSubmitting}
                        >
                            {t('auth.forgot_password.submit')}
                        </Button>

                        <SecondaryLink to='/auth/login' className='text-center sm:text-right'>
                            {t('auth.forgot_password.return_to_login')}
                        </SecondaryLink>
                    </div>
                </LoginFormContainer>
            )}
        </Formik>
    );
};

export default ForgotPasswordContainer;
