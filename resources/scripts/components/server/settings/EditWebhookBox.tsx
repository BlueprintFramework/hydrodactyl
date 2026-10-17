import { type Actions, useStoreActions } from 'easy-peasy';
import { Form, Formik } from 'formik';
import { toast } from 'sonner';
import { object, string } from 'yup';
import { httpErrorToHuman } from '@/api/http';
import editWebhookInfo from '@/api/server/editWebhookInfo';
import Dropdown from '@/components/elements/Dropdown';
import Field from '@/components/elements/Field';
import FormikFieldWrapper from '@/components/elements/FormikFieldWrapper';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/I18nProvider';
import type { ApplicationStore } from '@/state';
import { ServerContext } from '@/state/server';

interface Values {
    webhook_type: string;
    webhook_url: string;
}

const EditWebhookBox = ({ allowedWebhookTypes }: { allowedWebhookTypes: Record<string, string> }) => {
    const { t } = useTranslation();
    const server = ServerContext.useStoreState((state) => state.server.data);
    const setServer = ServerContext.useStoreActions((actions) => actions.server.setServer);
    const { addError, clearFlashes } = useStoreActions((actions: Actions<ApplicationStore>) => actions.flashes);

    const submit = ({ webhook_type, webhook_url }: Values) => {
        clearFlashes('settings');
        toast(t('server.settings.webhook.updating'));
        if (!server) return;
        editWebhookInfo(server.uuid, webhook_type, webhook_url)
            .then(() => setServer({ ...server, webhookType: webhook_type, webhookUrl: webhook_url }))
            .catch((error) => {
                console.error(error);
                addError({ key: 'settings', message: httpErrorToHuman(error) });
            })
            .then(() => toast.success(t('server.settings.webhook.updated')));
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
            {({ values, setFieldValue }) => (
                <Form className='flex flex-col gap-4'>
                    <div className='flex max-w-lg flex-col gap-4'>
                        <FormikFieldWrapper
                            id={'webhook_type'}
                            name={'webhook_type'}
                            label={t('server.settings.webhook.type_label')}
                        >
                            <Dropdown
                                id={'webhook_type'}
                                value={values.webhook_type}
                                onChange={(value) => setFieldValue('webhook_type', value)}
                                placeholder={t('server.settings.webhook.type_placeholder')}
                                options={Object.entries(allowedWebhookTypes).map(([value, label]) => ({
                                    value,
                                    label,
                                }))}
                            />
                        </FormikFieldWrapper>
                        <Field
                            id={'webhook_url'}
                            name={'webhook_url'}
                            label={t('server.settings.webhook.url_label')}
                            type={'url'}
                        />
                    </div>
                    <div>
                        <Button variant='secondary' type={'submit'}>
                            {t('common.save')}
                        </Button>
                    </div>
                </Form>
            )}
        </Formik>
    );
};

export default EditWebhookBox;
