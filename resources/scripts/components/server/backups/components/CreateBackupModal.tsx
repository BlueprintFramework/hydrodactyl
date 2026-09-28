import { Form, Formik, Field as FormikField, type FormikHelpers, useFormikContext } from 'formik';
import { useEffect } from 'react';
import { boolean, object, string } from 'yup';
import Can from '@/components/elements/Can';
import Field from '@/components/elements/Field';
import FormikFieldWrapper from '@/components/elements/FormikFieldWrapper';
import FormikSwitchV2 from '@/components/elements/FormikSwitchV2';
import { Textarea } from '@/components/elements/Input';
import Modal, { type RequiredModalProps } from '@/components/elements/Modal';
import Spinner from '@/components/elements/Spinner';
import FlashMessageRender from '@/components/FlashMessageRender';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/I18nProvider';
import useFlash from '@/plugins/useFlash';

interface BackupValues {
    name: string;
    ignored: string;
    isLocked: boolean;
}

interface CreateBackupModalProps extends RequiredModalProps {
    onSubmit: (values: BackupValues, helpers: FormikHelpers<BackupValues>) => Promise<void>;
}

const ModalContent = ({ ...props }: RequiredModalProps) => {
    const { t } = useTranslation();
    const { isSubmitting } = useFormikContext<BackupValues>();

    return (
        <Modal {...props} showSpinnerOverlay={isSubmitting} title={t('server.backups.create_title')}>
            <Form>
                <FlashMessageRender byKey={'backups:create'} />
                <Field
                    name={'name'}
                    label={t('server.backups.backup_name_label')}
                    description={t('server.backups.backup_name_description')}
                />
                <div className={`mt-6 flex flex-col`}>
                    <FormikFieldWrapper
                        className='flex flex-col gap-2'
                        name={'ignored'}
                        label={t('server.backups.ignored_label')}
                        description={t('server.backups.ignored_description')}
                    >
                        <FormikField
                            as={Textarea}
                            className='px-4 py-2 rounded-lg outline-hidden bg-[#ffffff17] text-sm'
                            name={'ignored'}
                            rows={6}
                        />
                    </FormikFieldWrapper>
                </div>
                <Can action={'backup.delete'}>
                    <div className={`my-6`}>
                        <FormikSwitchV2
                            name={'isLocked'}
                            label={t('server.backups.locked_label')}
                            description={t('server.backups.locked_description')}
                        />
                    </div>
                </Can>
                <div className={`flex justify-end mb-6`}>
                    <Button variant='attention' type={'submit'} disabled={isSubmitting}>
                        {isSubmitting && <Spinner size='small' />}
                        {isSubmitting ? t('server.backups.creating') : t('server.backups.start_backup')}
                    </Button>
                </div>
            </Form>
        </Modal>
    );
};

const CreateBackupModal = ({ visible, onDismissed, onSubmit }: CreateBackupModalProps) => {
    const { clearFlashes } = useFlash();

    useEffect(() => {
        clearFlashes('backups:create');
    }, [clearFlashes]);

    return (
        <Formik
            onSubmit={onSubmit}
            initialValues={{ name: '', ignored: '', isLocked: false }}
            validationSchema={object().shape({
                name: string().max(191),
                ignored: string(),
                isLocked: boolean(),
            })}
        >
            <ModalContent visible={visible} onDismissed={onDismissed} />
        </Formik>
    );
};

export default CreateBackupModal;
