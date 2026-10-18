import { Form, Formik, type FormikHelpers } from 'formik';
import chmodFiles from '@/api/server/files/chmodFiles';
import Field from '@/components/elements/Field';
import Modal, { type RequiredModalProps } from '@/components/elements/Modal';
import { Button } from '@/components/ui/button';
import { fileBitsToString } from '@/helpers';
import { useTranslation } from '@/i18n/I18nProvider';
import useFileManagerSwr from '@/plugins/useFileManagerSwr';
import useFlash from '@/plugins/useFlash';
import { ServerContext } from '@/state/server';

interface FormikValues {
    mode: string;
}

interface File {
    file: string;
    mode: string;
}

type OwnProps = RequiredModalProps & { files: File[] };

const ChmodFileModal = ({ files, ...props }: OwnProps) => {
    const { t } = useTranslation();
    const uuid = ServerContext.useStoreState((state) => state.server.data?.uuid);
    const { mutate } = useFileManagerSwr();
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const directory = ServerContext.useStoreState((state) => state.files.directory);
    const setSelectedFiles = ServerContext.useStoreActions((actions) => actions.files.setSelectedFiles);

    const submit = async ({ mode }: FormikValues, { setSubmitting }: FormikHelpers<FormikValues>) => {
        clearFlashes('files');

        await mutate(
            (data) =>
                data?.map((f) =>
                    f.name === files[0]?.file ? { ...f, mode: fileBitsToString(mode, !f.isFile), modeBits: mode } : f,
                ),
            false,
        );

        const data = files.map((f) => ({ file: f.file, mode: mode }));

        chmodFiles(uuid, directory, data)
            .then((): Promise<unknown> => (files.length > 0 ? mutate() : Promise.resolve()))
            .then(() => setSelectedFiles([]))
            .catch((error) => {
                mutate();
                setSubmitting(false);
                clearAndAddHttpError({ key: 'files', error });
            })
            .then(() => props.onDismissed());
    };

    return (
        <Formik onSubmit={submit} initialValues={{ mode: files.length > 1 ? '' : (files[0]?.mode ?? '') }}>
            {({ isSubmitting }) => (
                <Modal
                    {...props}
                    title={t('server.files.configure_permissions')}
                    dismissable={!isSubmitting}
                    showSpinnerOverlay={isSubmitting}
                >
                    <Form className={`w-full m-0`}>
                        <div className={`flex flex-col`}>
                            <div className={`w-full`}>
                                <Field
                                    type={'string'}
                                    id={'file_mode'}
                                    name={'mode'}
                                    label={t('server.files.file_mode_label')}
                                    description={t('server.files.file_mode_description')}
                                    autoFocus
                                />
                            </div>
                            <div className={`flex justify-end w-full my-6`}>
                                <Button variant='attention' type='submit'>
                                    {t('common.update')}
                                </Button>
                            </div>
                        </div>
                    </Form>
                </Modal>
            )}
        </Formik>
    );
};

export default ChmodFileModal;
