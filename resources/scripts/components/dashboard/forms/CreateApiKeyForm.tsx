import { type Actions, useStoreActions } from 'easy-peasy';
import { Field, Form, Formik, type FormikHelpers } from 'formik';
import { useState } from 'react';
import { object, string } from 'yup';
import createApiKey from '@/api/account/createApiKey';
import type { ApiKey } from '@/api/account/getApiKeys';
import { httpErrorToHuman } from '@/api/http';
import ApiKeyModal from '@/components/dashboard/ApiKeyModal';
import ContentBox from '@/components/elements/ContentBox';
import FormikFieldWrapper from '@/components/elements/FormikFieldWrapper';
import Input from '@/components/elements/Input';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import FlashMessageRender from '@/components/FlashMessageRender';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/I18nProvider';

import type { ApplicationStore } from '@/state';

interface Values {
    description: string;
    allowedIps: string;
}

const CreateApiKeyForm = ({ onKeyCreated }: { onKeyCreated: (key: ApiKey) => void }) => {
    const { t } = useTranslation();
    const [apiKey, setApiKey] = useState('');
    const { addError, clearFlashes } = useStoreActions((actions: Actions<ApplicationStore>) => actions.flashes);

    const submit = (values: Values, { setSubmitting, resetForm }: FormikHelpers<Values>) => {
        clearFlashes('account');
        createApiKey(values.description, values.allowedIps)
            .then(({ secretToken, ...key }) => {
                resetForm();
                setSubmitting(false);
                setApiKey(`${key.identifier}${secretToken}`);
                onKeyCreated(key);
            })
            .catch((error) => {
                console.error(error);

                addError({ key: 'account', message: httpErrorToHuman(error) });
                setSubmitting(false);
            });
    };

    return (
        <>
            {/* Flash Messages */}
            <FlashMessageRender byKey='account' />

            {/* Modal for API Key */}
            <ApiKeyModal visible={apiKey.length > 0} onModalDismissed={() => setApiKey('')} apiKey={apiKey} />

            {/* Form for creating API key */}
            <ContentBox>
                <Formik
                    onSubmit={submit}
                    initialValues={{ description: '', allowedIps: '' }}
                    validationSchema={object().shape({
                        allowedIps: string(),
                        description: string()
                            .required(t('account.api_keys.description_required'))
                            .min(4, t('account.api_keys.description_min')),
                    })}
                >
                    {({ isSubmitting }) => (
                        <Form className='space-y-6'>
                            {/* Show spinner overlay when submitting */}
                            <SpinnerOverlay visible={isSubmitting} />

                            {/* Description Field */}
                            <FormikFieldWrapper
                                label={t('account.api_keys.description_label')}
                                name='description'
                                description={t('account.api_keys.description_helper')}
                            >
                                <Field name='description' as={Input} className='w-full' />
                            </FormikFieldWrapper>

                            {/* Allowed IPs Field */}
                            <FormikFieldWrapper
                                label={t('account.api_keys.allowed_ips_label')}
                                name='allowedIps'
                                description={t('account.api_keys.allowed_ips_description')}
                            >
                                <Field name='allowedIps' as={Input} className='w-full' />
                            </FormikFieldWrapper>

                            {/* Submit Button below form fields */}
                            <div className='flex justify-end mt-6'>
                                <Button type='submit' disabled={isSubmitting}>
                                    {isSubmitting ? t('account.api_keys.creating') : t('account.api_keys.create')}
                                </Button>
                            </div>
                        </Form>
                    )}
                </Formik>
            </ContentBox>
        </>
    );
};

CreateApiKeyForm.displayName = 'CreateApiKeyForm';
export default CreateApiKeyForm;
