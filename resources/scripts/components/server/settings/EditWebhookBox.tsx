import { type Actions, useStoreActions } from 'easy-peasy';
import { Form, Formik, Field as FormikField } from 'formik';
import { toast } from 'sonner';
import { object, string } from 'yup';
import { httpErrorToHuman } from '@/api/http';
import editWebhookInfo from '@/api/server/editWebhookInfo';
import Field from '@/components/elements/Field';
import FormikFieldWrapper from '@/components/elements/FormikFieldWrapper';
import Select from '@/components/elements/Select';
import TitledGreyBox from '@/components/elements/TitledGreyBox';
import { Button } from '@/components/ui/button';
import type { ApplicationStore } from '@/state';
import { ServerContext } from '@/state/server';

interface Values {
    webhook_type: string;
    webhook_url: string;
}

const EditWebhookForm = (allowedWebhookTypes: Record<string, string>) => {
    return (
        <TitledGreyBox title={'Webhook'}>
            <Form className='flex flex-col gap-4'>
                <FormikFieldWrapper id={'webhook_type'} name={'webhook_type'} label={'Webhook Type'}>
                    <FormikField
                        as={Select}
                        className='w-full px-4 py-2 rounded-lg outline-hidden bg-[#ffffff17] text-base sm:text-sm'
                        id={'webhook_type'}
                        name={'webhook_type'}
                    >
                        <option value=''>Select a webhook type</option>
                        {Object.entries(allowedWebhookTypes).map(([value, label]) => (
                            <option key={value} value={value}>
                                {label}
                            </option>
                        ))}
                    </FormikField>
                </FormikFieldWrapper>
                <Field id={'webhook_url'} name={'webhook_url'} label={'Webhook URL'} type={'url'} />
                <div className={`mt-6 text-right`}>
                    <Button variant='secondary' type={'submit'}>
                        Save
                    </Button>
                </div>
            </Form>
        </TitledGreyBox>
    );
};

const EditWebhookBox = ({ allowedWebhookTypes }: { allowedWebhookTypes: Record<string, string> }) => {
    const server = ServerContext.useStoreState((state) => state.server.data);
    const setServer = ServerContext.useStoreActions((actions) => actions.server.setServer);
    const { addError, clearFlashes } = useStoreActions((actions: Actions<ApplicationStore>) => actions.flashes);

    const submit = ({ webhook_type, webhook_url }: Values) => {
        clearFlashes('settings');
        toast('Updating server details...');
        if (!server) return;
        editWebhookInfo(server.uuid, webhook_type, webhook_url)
            .then(() => setServer({ ...server, webhookType: webhook_type, webhookUrl: webhook_url }))
            .catch((error) => {
                console.error(error);
                addError({ key: 'settings', message: httpErrorToHuman(error) });
            })
            .then(() => toast.success('Server details updated!'));
    };

    return (
        <Formik
            onSubmit={submit}
            initialValues={{
                webhook_type: server?.webhookType || '',
                webhook_url: server?.webhookUrl || '',
            }}
            validationSchema={object().shape({
                webhook_type: string().required(),
                webhook_url: string().url().required(),
            })}
        >
            <EditWebhookForm {...allowedWebhookTypes} />
        </Formik>
    );
};

export default EditWebhookBox;
