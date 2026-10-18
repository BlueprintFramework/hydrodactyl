import { Field, Form, Formik, type FormikHelpers } from 'formik';
import { useMemo } from 'react';
import { object, string } from 'yup';
import { Dialog } from '@/components/elements/dialog';
import FormikFieldWrapper from '@/components/elements/FormikFieldWrapper';
import Input from '@/components/elements/Input';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import { useTranslation } from '@/i18n/I18nProvider';

interface CreateValues {
    description: string;
    allowedIps: string;
}

interface CreateApiKeyModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (values: CreateValues, helpers: FormikHelpers<CreateValues>) => void;
    isSubmitting?: boolean;
}

export default function CreateApiKeyModal({ open, onClose, onSubmit, isSubmitting = false }: CreateApiKeyModalProps) {
    const { t } = useTranslation();

    const validationSchema = useMemo(
        () =>
            object().shape({
                description: string()
                    .required(t('account.api_keys.description_required'))
                    .min(4, t('account.api_keys.description_min')),
                allowedIps: string(),
            }),
        [t],
    );

    return (
        <Dialog.Confirm
            open={open}
            onClose={onClose}
            title={t('account.api_keys.create')}
            confirm={t('account.api_keys.create_confirm')}
            onConfirmed={() => {
                // Trigger form submission programmatically
                const form = document.getElementById('create-api-form') as HTMLFormElement;
                if (form) {
                    const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;
                    if (submitButton) submitButton.click();
                }
            }}
            // Optional: disable confirm button while submitting
            confirmDisabled={isSubmitting}
        >
            <Formik
                initialValues={{ description: '', allowedIps: '' }}
                validationSchema={validationSchema}
                onSubmit={onSubmit}
            >
                {({ isSubmitting: formikIsSubmitting }) => (
                    <Form id='create-api-form' className='space-y-4'>
                        <SpinnerOverlay visible={formikIsSubmitting || isSubmitting} />

                        <FormikFieldWrapper
                            label={t('account.api_keys.description_label')}
                            name='description'
                            description={t('account.api_keys.description_helper')}
                        >
                            <Field name='description' as={Input} className='w-full' autoFocus />
                        </FormikFieldWrapper>

                        <FormikFieldWrapper
                            label={t('account.api_keys.allowed_ips_label')}
                            name='allowedIps'
                            description={t('account.api_keys.allowed_ips_helper')}
                        >
                            <Field
                                name='allowedIps'
                                as='textarea'
                                rows={4}
                                className='w-full rounded bg-[#ffffff0d] border border-[#ffffff12] p-3 text-sm text-zinc-100 focus:outline-none focus:border-blue-500'
                            />
                        </FormikFieldWrapper>

                        {/* Hidden submit button — triggered by Dialog confirm */}
                        <button type='submit' className='hidden' />
                    </Form>
                )}
            </Formik>
        </Dialog.Confirm>
    );
}
