import { Form, Formik, type FormikHelpers } from 'formik';
import { join } from 'pathe';
import { useContext, useEffect, useMemo, useState } from 'react';
import { object, string } from 'yup';
import createDirectory from '@/api/server/files/createDirectory';
import Code from '@/components/elements/Code';
import { Dialog, type DialogProps, DialogWrapperContext } from '@/components/elements/dialog';
import Field from '@/components/elements/Field';
import FlashMessageRender from '@/components/FlashMessageRender';
import { Button } from '@/components/ui/button';
import asDialog from '@/hoc/asDialog';
import { useTranslation } from '@/i18n/I18nProvider';
import useFileManagerSwr from '@/plugins/useFileManagerSwr';
import { useFlashKey } from '@/plugins/useFlash';
// import { FileObject } from '@/api/server/files/loadDirectory';
import { ServerContext } from '@/state/server';

interface Values {
    directoryName: string;
}

// removed to prevent linting issues, you're welcome.
//
// const generateDirectoryData = (name: string): FileObject => ({
//   key: `dir_${name.split('/', 1)[0] ?? name}`,
//   name: name.replace(/^(\/*)/, '').split('/', 1)[0] ?? name,
//   mode: 'drwxr-xr-x',
//   modeBits: '0755',
//   size: 0,
//   isFile: false,
//   isSymlink: false,
//   mimetype: '',
//   createdAt: new Date(),
//   modifiedAt: new Date(),
//   isArchiveType: () => false,
//   isEditable: () => false,
// });

const NewDirectoryDialogContent = () => {
    const { t } = useTranslation();
    const uuid = ServerContext.useStoreState((state) => state.server.data?.uuid);
    const directory = ServerContext.useStoreState((state) => state.files.directory);

    const { mutate } = useFileManagerSwr();
    const { close } = useContext(DialogWrapperContext);
    const { clearAndAddHttpError } = useFlashKey('files:directory-modal');

    const schema = object().shape({
        directoryName: string().required(t('server.files.directory_name_required')),
    });

    useEffect(() => {
        return () => {
            clearAndAddHttpError();
        };
    }, [clearAndAddHttpError]);

    const submit = ({ directoryName }: Values, { setSubmitting }: FormikHelpers<Values>) => {
        createDirectory(uuid, directory, directoryName)
            // .then(() => mutate((data) => [...data!, generateDirectoryData(directoryName)], false))
            .then(() => mutate())
            .then(() => close())
            .catch((error) => {
                setSubmitting(false);
                clearAndAddHttpError(error);
            });
    };

    return (
        <Formik onSubmit={submit} validationSchema={schema} initialValues={{ directoryName: '' }}>
            {({ submitForm, values }) => (
                <>
                    <FlashMessageRender byKey='files:directory-modal' />
                    <Form className={`m-0`}>
                        <Field
                            autoFocus
                            id={'directoryName'}
                            name={'directoryName'}
                            label={t('server.files.name_label')}
                        />
                        <p className={`mt-2 text-xs! break-all`}>
                            <span className={`text-zinc-200`}>{t('server.files.folder_created_as')}&nbsp;</span>
                            <Code>
                                /root/
                                <span className={`text-blue-200`}>
                                    {join(directory, values.directoryName).replace(/^(\.\.\/|\/)+/, '')}
                                </span>
                            </Code>
                        </p>
                    </Form>
                    <Dialog.Footer>
                        <Button variant='secondary' className={'w-full sm:w-auto'} onClick={close}>
                            {t('common.cancel')}
                        </Button>
                        <Button variant='attention' className={'w-full sm:w-auto'} onClick={submitForm}>
                            {t('common.create')}
                        </Button>
                    </Dialog.Footer>
                </>
            )}
        </Formik>
    );
};

const NewDirectoryDialog = ({ open, onClose }: DialogProps) => {
    const { t } = useTranslation();
    const DialogComponent = useMemo(
        () => asDialog({ title: t('server.files.new_folder') })(NewDirectoryDialogContent),
        [t],
    );

    return <DialogComponent open={open} onClose={onClose} />;
};

const NewDirectoryButton = () => {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);

    return (
        <>
            <NewDirectoryDialog open={open} onClose={setOpen.bind(this, false)} />
            <Button
                variant='secondary'
                onClick={setOpen.bind(this, true)}
                className='border-r-cream-600 rounded-r-none'
            >
                {t('server.files.new_folder')}
            </Button>
        </>
    );
};

export default NewDirectoryButton;
