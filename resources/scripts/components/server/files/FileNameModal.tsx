import { Form, Formik, type FormikHelpers } from 'formik';
import { join } from 'pathe';
import { object, string } from 'yup';
import Field from '@/components/elements/Field';
import Modal, { type RequiredModalProps } from '@/components/elements/Modal';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/I18nProvider';

import { ServerContext } from '@/state/server';

type Props = RequiredModalProps & {
    onFileNamed: (name: string) => void;
};

interface Values {
    fileName: string;
}

const FileNameModal = ({ onFileNamed, onDismissed, ...props }: Props) => {
    const { t } = useTranslation();
    const directory = ServerContext.useStoreState((state) => state.files.directory);

    const submit = (values: Values, { setSubmitting }: FormikHelpers<Values>) => {
        onFileNamed(join(directory, values.fileName));
        setSubmitting(false);
    };

    return (
        <Formik
            onSubmit={submit}
            initialValues={{ fileName: '' }}
            validationSchema={object().shape({
                fileName: string().required(t('server.files.file_name_required')),
            })}
        >
            {({ resetForm }) => (
                <Modal
                    onDismissed={() => {
                        resetForm();
                        onDismissed();
                    }}
                    title={t('server.files.new_file_modal_title')}
                    {...props}
                >
                    <Form className='m-0 w-full flex flex-col gap-4'>
                        <Field
                            id={'fileName'}
                            name={'fileName'}
                            label={t('server.files.file_name_label')}
                            description={t('server.files.file_name_description')}
                            autoFocus
                        />
                        <div className={`flex justify-end w-full my-4`}>
                            <Button variant='attention' type='submit'>
                                {t('server.files.create_file')}
                            </Button>
                        </div>
                    </Form>
                </Modal>
            )}
        </Formik>
    );
};

export default FileNameModal;
