import { type Actions, useStoreActions } from 'easy-peasy';
import { Form, Formik, type FormikHelpers } from 'formik';
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

    const isEnabled = Boolean(server?.webhookType && server?.webhookUrl);

    const persist = (
        webhook_type: string,
        webhook_url: string,
        helpers?: FormikHelpers<Values>,
        successKey = 'server.settings.webhook.updated',
    ) => {
        clearFlashes('settings');
        toast(t('server.settings.webhook.updating'));
        if (!server) return;

        editWebhookInfo(server.uuid, webhook_type, webhook_url)
            .then(() =>
                setServer({
                    ...server,
                    webhookType: webhook_type || null,
                    webhookUrl: webhook_url || null,
                }),
            )
            .then(() => {
                helpers?.resetForm({
                    values: { webhook_type, webhook_url },
                });
                toast.success(t(successKey));
            })
            .catch((error) => {
                console.error(error);
                addError({ key: 'settings', message: httpErrorToHuman(error) });
            });
    };

    const submit = (values: Values, helpers: FormikHelpers<Values>) => {
        persist(values.webhook_type, values.webhook_url, helpers);
    };

    const disable = (helpers: FormikHelpers<Values>) => {
        persist('', '', helpers, 'server.settings.webhook.disabled');
    };

    return (
        <Formik
            enableReinitialize
            onSubmit={submit}
            initialValues={{
                webhook_type: server?.webhookType || '',
                webhook_url: server?.webhookUrl || '',
            }}
            validationSchema={object().shape({
                webhook_type: string().test(
                    'webhook-type-required',
                    t('server.settings.webhook.type_required'),
                    (value, context) => !context.parent.webhook_url || !!value,
                ),
                webhook_url: string()
                    .test(
                        'webhook-url-required',
                        t('server.settings.webhook.url_required'),
                        (value, context) => !context.parent.webhook_type || !!value,
                    )
                    .test(
                        'webhook-url-valid',
                        t('server.settings.webhook.url_invalid'),
                        (value) => !value || /^https?:\/\/\S+$/.test(value),
                    ),
            })}
        >
            {(formik) => (
                <Form className='flex flex-col gap-4'>
                    <div className='flex max-w-lg flex-col gap-4'>
                        <FormikFieldWrapper
                            id={'webhook_type'}
                            name={'webhook_type'}
                            label={t('server.settings.webhook.type_label')}
                        >
                            <Dropdown
                                id={'webhook_type'}
                                value={formik.values.webhook_type}
                                onChange={(value) => formik.setFieldValue('webhook_type', value)}
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
                    <div className='flex flex-wrap items-center gap-2'>
                        <Button variant='secondary' type={'submit'}>
                            {t('common.save')}
                        </Button>
                        {isEnabled && (
                            <Button variant='destructive' type='button' onClick={() => disable(formik)}>
                                {t('server.settings.webhook.disable')}
                            </Button>
                        )}
                    </div>
                </Form>
            )}
        </Formik>
    );
};

export default EditWebhookBox;
