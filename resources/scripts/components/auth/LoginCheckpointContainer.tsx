import type { ActionCreator } from 'easy-peasy';
import { useFormikContext, withFormik } from 'formik';
import { useState } from 'react';
import type { Location, RouteProps } from 'react-router-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import loginCheckpoint from '@/api/auth/loginCheckpoint';
import LoginFormContainer from '@/components/auth/LoginFormContainer';
import Button from '@/components/elements/Button';
import Field from '@/components/elements/Field';
import { useTranslation } from '@/i18n/I18nProvider';
import useFlash from '@/plugins/useFlash';
import type { FlashStore } from '@/state/flashes';

import SecondaryLink from '../ui/secondary-link';

interface Values {
    code: string;
    recoveryCode: '';
}

type OwnProps = RouteProps;

type Props = OwnProps & {
    clearAndAddHttpError: ActionCreator<FlashStore['clearAndAddHttpError']['payload']>;
};

function LoginCheckpointForm() {
    const { isSubmitting, setFieldValue } = useFormikContext<Values>();
    const [isMissingDevice, setIsMissingDevice] = useState(false);
    const { t } = useTranslation();

    const fieldTitle = isMissingDevice ? t('auth.two_factor.recovery_code') : t('auth.two_factor.authentication_code');

    return (
        <LoginFormContainer className={`w-full flex flex-col`}>
            <h2 className='text-xl font-extrabold mb-2'>{t('auth.two_factor.title')}</h2>

            <div className={`mt-6`}>
                <Field
                    name={isMissingDevice ? 'recoveryCode' : 'code'}
                    title={fieldTitle}
                    placeholder='000000'
                    description={
                        isMissingDevice
                            ? t('auth.two_factor.recovery_code_description')
                            : t('auth.two_factor.authentication_code_description')
                    }
                    type={'text'}
                    autoComplete={'one-time-code'}
                    autoFocus
                />
            </div>

            <div className='flex w-full flex-col gap-3 sm:flex-row sm:justify-between sm:items-center'>
                <Button
                    className={`bg-mocha-100 rounded-full p-2 px-4 text-black hover:cursor-pointer hover:bg-mocha-200 hover:scale-102 ease-in-out w-full sm:w-auto`}
                    size={'xlarge'}
                    type={'submit'}
                    disabled={isSubmitting}
                    isLoading={isSubmitting}
                >
                    {t('auth.login.sign_in')}
                </Button>
                <button
                    type='button'
                    onClick={() => {
                        setFieldValue('code', '');
                        setFieldValue('recoveryCode', '');
                        setIsMissingDevice((s) => !s);
                    }}
                    className={
                        'block text-center w-full sm:w-auto py-2.5 px-4 text-xs font-medium tracking-wide uppercase text-white hover:text-white/80 transition-colors duration-200 border border-white/20 rounded-full hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30'
                    }
                >
                    {!isMissingDevice ? t('auth.two_factor.lost_device') : t('auth.two_factor.have_device')}
                </button>
            </div>
            <div
                className={`text-right w-full rounded-b-lg border-0 ring-0 outline-hidden font-bold text-sm py-2 hover:cursor-pointer `}
            >
                <SecondaryLink to='/auth/login'>{t('auth.two_factor.return_to_login')}</SecondaryLink>
            </div>
        </LoginFormContainer>
    );
}

const EnhancedForm = withFormik<Props & { location: Location }, Values>({
    handleSubmit: ({ code, recoveryCode }, { setSubmitting, props: { clearAndAddHttpError, location } }) => {
        loginCheckpoint(location.state?.token || '', code, recoveryCode)
            .then((response) => {
                if (response.complete) {
                    window.location = response.intended || '/';
                    return;
                }

                setSubmitting(false);
            })
            .catch((error) => {
                console.error(error);
                setSubmitting(false);
                clearAndAddHttpError({ error });
            });
    },

    mapPropsToValues: () => ({
        code: '',
        recoveryCode: '',
    }),
})(LoginCheckpointForm);

const LoginCheckpointContainer = ({ ...props }: OwnProps) => {
    const { clearAndAddHttpError } = useFlash();

    const location = useLocation();
    const navigate = useNavigate();

    if (!location.state?.token) {
        navigate('/auth/login');

        return null;
    }

    return <EnhancedForm clearAndAddHttpError={clearAndAddHttpError} location={location} {...props} />;
};

export default LoginCheckpointContainer;
