import { Form, Formik, type FormikHelpers } from 'formik';
import { object, string } from 'yup';
import deleteServerDatabase from '@/api/server/databases/deleteServerDatabase';
import type { ServerDatabase } from '@/api/server/databases/getServerDatabases';
import Field from '@/components/elements/Field';
import Modal, { type RequiredModalProps } from '@/components/elements/Modal';
import Spinner from '@/components/elements/Spinner';
import FlashMessageRender from '@/components/FlashMessageRender';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/I18nProvider';
import { useFlashKey } from '@/plugins/useFlash';
import { ServerContext } from '@/state/server';

interface Props extends RequiredModalProps {
    database: ServerDatabase;
    onDeleted: (id: string) => void;
}

interface Values {
    confirm: string;
}

const DeleteDatabaseModal = ({ database, onDeleted, visible, onDismissed, ...props }: Props) => {
    const { t } = useTranslation();
    const uuid = ServerContext.useStoreState((state) => state.server.data?.uuid);
    const { clearFlashes, clearAndAddHttpError } = useFlashKey('database:delete');

    if (uuid === undefined) {
        return null;
    }

    const submit = (_: Values, { setSubmitting, resetForm }: FormikHelpers<Values>) => {
        clearFlashes();

        deleteServerDatabase(uuid, database.id)
            .then(() => {
                resetForm();
                setSubmitting(false);
                setTimeout(() => {
                    onDeleted(database.id);
                    onDismissed();
                }, 150);
            })
            .catch((error) => {
                resetForm();
                console.error(error);
                setSubmitting(false);
                clearAndAddHttpError(error);
            });
    };

    return (
        <Formik
            onSubmit={submit}
            initialValues={{ confirm: '' }}
            validationSchema={object().shape({
                confirm: string()
                    .required(t('server.databases.name_required'))
                    .oneOf([database.name.split('_', 2)[1] || '', database.name], t('server.databases.name_required')),
            })}
            isInitialValid={false}
        >
            {({ isSubmitting, isValid, resetForm }) => (
                <Modal
                    visible={visible}
                    onDismissed={() => {
                        resetForm();
                        onDismissed();
                    }}
                    {...props}
                    dismissable={!isSubmitting}
                    showSpinnerOverlay={isSubmitting}
                    title={t('server.databases.delete_confirm_title')}
                >
                    <FlashMessageRender byKey={'database:delete'} />
                    <div className='flex flex-col'>
                        <p>
                            {t('server.databases.delete_message_prefix')} <strong>{database.name}</strong>{' '}
                            {t('server.databases.delete_message_suffix')}
                        </p>
                        <Form className='mt-6'>
                            <Field
                                type={'text'}
                                id={'confirm_name'}
                                name={'confirm'}
                                label={t('server.databases.confirm_name_label')}
                                description={t('server.databases.confirm_name_description')}
                            />
                            <Button
                                variant='attention'
                                type={'submit'}
                                className='min-w-full my-6'
                                disabled={!isValid || isSubmitting}
                            >
                                {isSubmitting && <Spinner size='small' />}
                                {isSubmitting ? t('server.databases.deleting') : t('server.databases.delete_confirm')}
                            </Button>
                        </Form>
                    </div>
                </Modal>
            )}
        </Formik>
    );
};

export default DeleteDatabaseModal;
