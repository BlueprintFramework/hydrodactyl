import { type Actions, useStoreActions } from 'easy-peasy';
import { Form, Formik } from 'formik';
import { toast } from 'sonner';
import { object, string } from 'yup';
import { httpErrorToHuman } from '@/api/http';
import renameServer from '@/api/server/renameServer';
import Field from '@/components/elements/Field';
import TitledGreyBox from '@/components/elements/TitledGreyBox';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/I18nProvider';

import type { ApplicationStore } from '@/state';
import { ServerContext } from '@/state/server';

interface Values {
    name: string;
    description: string;
}

const RenameServerForm = () => {
    const { t } = useTranslation();

    return (
        <TitledGreyBox title={t('server.settings.rename.title')}>
            <Form className='flex flex-col gap-4'>
                <Field id={'name'} name={'name'} label={t('server.settings.rename.name_label')} type={'text'} />
                <Field
                    id={'description'}
                    name={'description'}
                    label={t('server.settings.rename.description_label')}
                    type={'text'}
                />
                <div className={`mt-6 text-right`}>
                    <Button variant='secondary' type={'submit'}>
                        {t('common.save')}
                    </Button>
                </div>
            </Form>
        </TitledGreyBox>
    );
};

const RenameServerBox = () => {
    const { t } = useTranslation();
    const server = ServerContext.useStoreState((state) => state.server.data);
    const setServer = ServerContext.useStoreActions((actions) => actions.server.setServer);
    const { addError, clearFlashes } = useStoreActions((actions: Actions<ApplicationStore>) => actions.flashes);

    const submit = ({ name, description }: Values) => {
        clearFlashes('settings');
        toast(t('server.settings.rename.updating'));
        if (!server) return;
        renameServer(server.uuid, name, description)
            .then(() => setServer({ ...server, name, description }))
            .catch((error) => {
                console.error(error);
                addError({ key: 'settings', message: httpErrorToHuman(error) });
            })
            .then(() => toast.success(t('server.settings.rename.updated')));
    };

    return (
        <Formik
            onSubmit={submit}
            initialValues={{
                name: server.name,
                description: server.description,
            }}
            validationSchema={object().shape({
                name: string().required(t('server.settings.rename.name_required')),
                description: string().nullable(),
            })}
        >
            <RenameServerForm />
        </Formik>
    );
};

export default RenameServerBox;
