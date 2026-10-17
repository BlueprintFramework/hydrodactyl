import { type Actions, type State, useStoreActions, useStoreState } from 'easy-peasy';
import { Form, Formik, type FormikHelpers } from 'formik';
import { Fragment, useMemo } from 'react';
import * as Yup from 'yup';
import { httpErrorToHuman } from '@/api/http';
import Field from '@/components/elements/Field';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/I18nProvider';

import type { ApplicationStore } from '@/state';

interface Values {
    email: string;
    password: string;
}

const UpdateEmailAddressForm = () => {
    const { t } = useTranslation();
    const user = useStoreState((state: State<ApplicationStore>) => state.user.data);
    const updateEmail = useStoreActions((state: Actions<ApplicationStore>) => state.user.updateUserEmail);

    const { clearFlashes, addFlash } = useStoreActions((actions: Actions<ApplicationStore>) => actions.flashes);

    const schema = useMemo(
        () =>
            Yup.object().shape({
                email: Yup.string().required(t('account.email.required')).email(t('account.email.invalid')),
                password: Yup.string().required(t('account.password.current_required')),
            }),
        [t],
    );

    const submit = (values: Values, { resetForm, setSubmitting }: FormikHelpers<Values>) => {
        clearFlashes('account:email');

        updateEmail({ ...values })
            .then(() =>
                addFlash({
                    type: 'success',
                    key: 'account:email',
                    message: t('account.email.updated'),
                }),
            )
            .catch((error) =>
                addFlash({
                    type: 'error',
                    key: 'account:email',
                    title: t('common.error'),
                    message: httpErrorToHuman(error),
                }),
            )
            .then(() => {
                resetForm();
                setSubmitting(false);
            });
    };

    return (
        <Formik onSubmit={submit} validationSchema={schema} initialValues={{ email: user?.email, password: '' }}>
            {({ isSubmitting, isValid }) => (
                <Fragment>
                    <SpinnerOverlay size={'large'} visible={isSubmitting} />
                    <Form className={`m-0`}>
                        <Field id={'current_email'} type={'email'} name={'email'} label={t('account.email.label')} />
                        <div className={`mt-6`}>
                            <Field
                                id={'confirm_password'}
                                type={'password'}
                                name={'password'}
                                label={t('account.email.password_label')}
                            />
                        </div>
                        <div className={`mt-6`}>
                            <Button variant='secondary' disabled={isSubmitting || !isValid}>
                                {t('account.email.submit')}
                            </Button>
                        </div>
                    </Form>
                </Fragment>
            )}
        </Formik>
    );
};

export default UpdateEmailAddressForm;
