import { Form, Formik, type FormikHelpers } from 'formik';
import { join } from 'pathe';
import renameFiles from '@/api/server/files/renameFiles';
import Code from '@/components/elements/Code';
import Field from '@/components/elements/Field';
import Modal, { type RequiredModalProps } from '@/components/elements/Modal';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/I18nProvider';
import useFileManagerSwr from '@/plugins/useFileManagerSwr';
import useFlash from '@/plugins/useFlash';
import { ServerContext } from '@/state/server';

interface FormikValues {
    name: string;
}

type OwnProps = RequiredModalProps & {
    files: string[];
    useMoveTerminology?: boolean;
};

const RenameFileModal = ({ files, useMoveTerminology, ...props }: OwnProps) => {
    const { t } = useTranslation();
    const uuid = ServerContext.useStoreState((state) => state.server.data?.uuid);
    const { mutate } = useFileManagerSwr();
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const directory = ServerContext.useStoreState((state) => state.files.directory);
    const setSelectedFiles = ServerContext.useStoreActions((actions) => actions.files.setSelectedFiles);

    const submit = ({ name }: FormikValues, { setSubmitting }: FormikHelpers<FormikValues>) => {
        clearFlashes('files');

        const len = name.split('/').length;
        if (files.length === 1) {
            if (!useMoveTerminology && len === 1) {
                // Rename the file within this directory.
                mutate((data) => data?.map((f) => (f.name === files[0] ? { ...f, name } : f)), false);
            } else if (useMoveTerminology || len > 1) {
                // Remove the file from this directory since they moved it elsewhere.
                mutate((data) => data?.filter((f) => f.name !== files[0]), false);
            }
        }

        let data: Array<{ from: string; to: string }>;
        if (useMoveTerminology && files.length > 1) {
            data = files.map((f) => ({ from: f, to: join(name, f) }));
        } else {
            data = files.map((f) => ({ from: f, to: name }));
        }

        renameFiles(uuid, directory, data)
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
        <Formik onSubmit={submit} initialValues={{ name: files.length > 1 ? '' : files[0] || '' }}>
            {({ isSubmitting, values }) => (
                <Modal
                    {...props}
                    dismissable={!isSubmitting}
                    showSpinnerOverlay={isSubmitting}
                    title={useMoveTerminology ? t('server.files.moving_title') : t('server.files.renaming_title')}
                >
                    <Form className={`w-full`}>
                        <div className='w-full'>
                            <Field
                                type={'string'}
                                id={'file_name'}
                                name={'name'}
                                label={t('server.files.file_name_label')}
                                autoFocus
                            />
                            {useMoveTerminology && (
                                <p className={`mt-2 text-xs! break-all`}>
                                    <strong className={`text-sm text-zinc-200`}>
                                        {t('server.files.new_location')}{' '}
                                    </strong>
                                    <Code>
                                        /root/
                                        <span className={`text-blue-200`}>
                                            {join(directory, values.name).replace(/^(\.\.\/|\/)+/, '')}
                                        </span>
                                    </Code>
                                </p>
                            )}
                            <div className={`flex justify-end w-full my-6`}>
                                <Button variant='attention' type='submit'>
                                    {useMoveTerminology ? t('server.files.move') : t('server.files.rename')}
                                </Button>
                            </div>
                        </div>
                    </Form>
                </Modal>
            )}
        </Formik>
    );
};

export default RenameFileModal;
