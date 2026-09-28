import { type Actions, type State, useStoreActions, useStoreState } from 'easy-peasy';
import { Form, Formik, type FormikHelpers } from 'formik';
import { Fragment, useMemo } from 'react';
import * as Yup from 'yup';
import updateAccountPassword from '@/api/account/updateAccountPassword';
import { httpErrorToHuman } from '@/api/http';
import Field from '@/components/elements/Field';
import Spinner from '@/components/elements/Spinner';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/I18nProvider';

import type { ApplicationStore } from '@/state';

interface Values {
    current: string;
    password: string;
    confirmPassword: string;
}

const UpdatePasswordForm = () => {
    const { t } = useTranslation();
    const user = useStoreState((state: State<ApplicationStore>) => state.user.data);
    const { clearFlashes, addFlash } = useStoreActions((actions: Actions<ApplicationStore>) => actions.flashes);

    const schema = useMemo(
        () =>
            Yup.object().shape({
                current: Yup.string().required(t('account.password.current_required')),
                password: Yup.string()
                    .required(t('account.password.required'))
                    .min(8, t('common.min_length', { min: 8 })),
                confirmPassword: Yup.string().test(
                    'password',
                    t('account.password.confirmation_mismatch'),
                    function (value) {
                        return value === this.parent.password;
                    },
                ),
            }),
        [t],
    );

    if (!user) {
        return null;
    }

    const submit = (values: Values, { setSubmitting }: FormikHelpers<Values>) => {
        clearFlashes('account:password');
        updateAccountPassword({ ...values })
            .then(() => {
                // @ts-expect-error this is valid
                window.location = '/auth/login';
            })
            .catch((error) =>
                addFlash({
                    key: 'account:password',
                    type: 'error',
                    title: t('common.error'),
                    message: httpErrorToHuman(error),
                }),
            )
            .then(() => setSubmitting(false));
    };

    return (
        <Formik
            onSubmit={submit}
            validationSchema={schema}
            initialValues={{ current: '', password: '', confirmPassword: '' }}
        >
            {({ isSubmitting, isValid }) => (
                <Fragment>
                    <SpinnerOverlay size={'large'} visible={isSubmitting} />
                    <Form className={`m-0`}>
                        <Field
                            id={'current_password'}
                            type={'password'}
                            name={'current'}
                            label={t('account.password.current_label')}
                        />
                        <div className={`mt-6`}>
                            <Field
                                id={'new_password'}
                                type={'password'}
                                name={'password'}
                                label={t('account.password.new_label')}
                                description={t('account.password.new_helper')}
                            />
                        </div>
                        <div className={`mt-6`}>
                            <Field
                                id={'confirm_new_password'}
                                type={'password'}
                                name={'confirmPassword'}
                                label={t('account.password.confirm_label')}
                            />
                        </div>
                        <div className={`mt-6`}>
                            <Button variant='secondary' disabled={isSubmitting || !isValid}>
                                {isSubmitting && <Spinner size='small' />}
                                {isSubmitting ? t('account.password.updating') : t('account.password.submit')}
                            </Button>
                        </div>
                    </Form>
                </Fragment>
            )}
        </Formik>
    );
};

export default UpdatePasswordForm;
