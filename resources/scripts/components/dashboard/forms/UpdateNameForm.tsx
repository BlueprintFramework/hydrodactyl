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
    firstName: string;
    lastName: string;
}

const UpdateNameForm = () => {
    const { t } = useTranslation();
    const user = useStoreState((state: State<ApplicationStore>) => state.user.data);
    const updateName = useStoreActions((actions: Actions<ApplicationStore>) => actions.user.updateUserName);
    const { clearFlashes, addFlash } = useStoreActions((actions: Actions<ApplicationStore>) => actions.flashes);

    const schema = useMemo(
        () =>
            Yup.object().shape({
                firstName: Yup.string()
                    .required(t('account.name.first_name_required'))
                    .max(191, t('common.max_length', { max: 191 })),
                lastName: Yup.string().max(191, t('common.max_length', { max: 191 })),
            }),
        [t],
    );

    const submit = (values: Values, { setSubmitting }: FormikHelpers<Values>) => {
        clearFlashes('account:name');

        updateName({ ...values })
            .then(() =>
                addFlash({
                    type: 'success',
                    key: 'account:name',
                    message: t('account.name.updated'),
                }),
            )
            .catch((error) =>
                addFlash({
                    type: 'error',
                    key: 'account:name',
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
            initialValues={{ firstName: user?.firstName ?? '', lastName: user?.lastName ?? '' }}
            enableReinitialize
        >
            {({ isSubmitting, isValid }) => (
                <Fragment>
                    <SpinnerOverlay size={'large'} visible={isSubmitting} />
                    <Form className={'m-0'}>
                        <div className={'grid grid-cols-1 gap-6 sm:grid-cols-2'}>
                            <Field
                                id={'first_name'}
                                type={'text'}
                                name={'firstName'}
                                label={t('account.name.first_name_label')}
                            />
                            <Field
                                id={'last_name'}
                                type={'text'}
                                name={'lastName'}
                                label={t('account.name.last_name_label')}
                            />
                        </div>
                        <div className={'mt-6'}>
                            <Button variant='secondary' disabled={isSubmitting || !isValid}>
                                {t('account.name.submit')}
                            </Button>
                        </div>
                    </Form>
                </Fragment>
            )}
        </Formik>
    );
};

export default UpdateNameForm;
