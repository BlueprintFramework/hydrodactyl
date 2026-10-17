import { type Actions, useStoreActions } from 'easy-peasy';
import { Field, Form, Formik, type FormikHelpers } from 'formik';
import { useState } from 'react';
import { object, string } from 'yup';
import { createSSHKey, useSSHKeys } from '@/api/account/ssh-keys';
import { httpErrorToHuman } from '@/api/http';
import ContentBox from '@/components/elements/ContentBox';
import FormikFieldWrapper from '@/components/elements/FormikFieldWrapper';
import Input from '@/components/elements/Input';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import FlashMessageRender from '@/components/FlashMessageRender';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/I18nProvider';

import type { ApplicationStore } from '@/state';

interface Values {
    name: string;
    publicKey: string;
}

const CreateSSHKeyForm = () => {
    const { t } = useTranslation();
    const [_sshKey, setSshKey] = useState('');
    const { addError, clearFlashes } = useStoreActions((actions: Actions<ApplicationStore>) => actions.flashes);
    const { mutate } = useSSHKeys();

    const submit = (values: Values, { setSubmitting, resetForm }: FormikHelpers<Values>) => {
        clearFlashes('ssh-keys');
        createSSHKey(values.name, values.publicKey)
            .then((key) => {
                resetForm();
                setSubmitting(false);
                setSshKey(`${key.name}`);
                mutate((data) => (data || []).concat(key)); // Update the list of SSH keys after creation
            })
            .catch((error) => {
                console.error(error);
                addError({ key: 'ssh-keys', message: httpErrorToHuman(error) });
                setSubmitting(false);
            });
    };

    return (
        <>
            {/* Flash Messages */}
            <FlashMessageRender byKey='account' />

            {/* Modal for SSH Key */}
            {/* Add your modal logic here to display the SSH key details after creation */}

            {/* Form for creating SSH key */}
            <ContentBox>
                <Formik
                    onSubmit={submit}
                    initialValues={{ name: '', publicKey: '' }}
                    validationSchema={object().shape({
                        name: string().required(t('account.ssh.name_required')),
                        publicKey: string().required(t('account.ssh.public_key_required')),
                    })}
                >
                    {({ isSubmitting }) => (
                        <Form className='space-y-6'>
                            {/* Show spinner overlay when submitting */}
                            <SpinnerOverlay visible={isSubmitting} />

                            {/* SSH Key Name Field */}
                            <FormikFieldWrapper
                                label={t('account.ssh.name_label')}
                                name='name'
                                description={t('account.ssh.name_helper')}
                            >
                                <Field name='name' as={Input} className='w-full' />
                            </FormikFieldWrapper>

                            {/* Public Key Field */}
                            <FormikFieldWrapper
                                label={t('account.ssh.public_key_label')}
                                name='publicKey'
                                description={t('account.ssh.public_key_helper')}
                            >
                                <Field name='publicKey' as={Input} className='w-full' />
                            </FormikFieldWrapper>

                            {/* Submit Button below form fields */}
                            <div className='flex justify-end mt-6'>
                                <Button type='submit' disabled={isSubmitting}>
                                    {isSubmitting ? t('account.ssh.creating') : t('account.ssh.create')}
                                </Button>
                            </div>
                        </Form>
                    )}
                </Formik>
            </ContentBox>
        </>
    );
};

export default CreateSSHKeyForm;
