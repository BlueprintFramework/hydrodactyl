import { ArrowsRotateRight, Bell, Bug, FolderArrowUpIn, Gear } from '@gravity-ui/icons';
import { type Actions, useStoreActions, useStoreState } from 'easy-peasy';
import { Form, Formik } from 'formik';
import { useEffect, useState } from 'react';
import isEqual from 'react-fast-compare';
import { toast } from 'sonner';
import { object, string } from 'yup';
import { httpErrorToHuman } from '@/api/http';
import reinstallServer from '@/api/server/reinstallServer';
import renameServer from '@/api/server/renameServer';
import Can from '@/components/elements/Can';
import CopyOnClick from '@/components/elements/CopyOnClick';
import { Dialog } from '@/components/elements/dialog';
import Field from '@/components/elements/Field';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import FlashMessageRender from '@/components/FlashMessageRender';
import ServerHeader from '@/components/server/header/ServerHeader';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/I18nProvider';
import { ip } from '@/lib/formatters';
import type { ApplicationStore } from '@/state';
import { ServerContext } from '@/state/server';
import EditWebhookBox from './EditWebhookBox';

interface Values {
    name: string;
    description: string;
}

const rowClass = 'flex items-baseline justify-between gap-4 py-2.5';
const sectionClass = 'grid grid-cols-1 gap-4 py-10 first:pt-0 sm:grid-cols-[14rem_minmax(0,1fr)] sm:gap-10';

const SettingsContainer = () => {
    const { t } = useTranslation();
    const username = useStoreState((state) => state.user.data?.username);
    const id = ServerContext.useStoreState((state) => state.server.data?.id);
    const uuid = ServerContext.useStoreState((state) => state.server.data?.uuid);
    const node = ServerContext.useStoreState((state) => state.server.data?.node);
    const allowedWebhookTypes = ServerContext.useStoreState((state) => state.server.data?.allowedWebhookTypes);
    const sftp = ServerContext.useStoreState((state) => state.server.data?.sftpDetails, isEqual);
    const server = ServerContext.useStoreState((state) => state.server.data);
    const setServer = ServerContext.useStoreActions((actions) => actions.server.setServer);

    const { addFlash, addError, clearFlashes } = useStoreActions(
        (actions: Actions<ApplicationStore>) => actions.flashes,
    );

    const [modalVisible, setModalVisible] = useState(false);
    const [loading, setLoading] = useState(false);

    const sftpAddress = `sftp://${ip(sftp.ip)}:${sftp.port}`;
    const sftpUsername = `${username}.${id}`;

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

    const reinstall = () => {
        setLoading(true);
        clearFlashes('settings');
        reinstallServer(uuid)
            .then(() => {
                addFlash({
                    key: 'settings',
                    type: 'success',
                    message: t('server.settings.reinstall.started'),
                });
            })
            .catch((error) => {
                console.error(error);
                addFlash({ key: 'settings', type: 'error', message: httpErrorToHuman(error) });
            })
            .then(() => {
                setLoading(false);
                setModalVisible(false);
            });
    };

    useEffect(() => {
        clearFlashes('settings');
    }, [clearFlashes]);

    return (
        <ServerContentBlock title={t('server.settings.title')} className='p-0!'>
            <ServerHeader />
            <Dialog.Confirm
                open={modalVisible}
                title={t('server.settings.reinstall.confirm_title')}
                confirm={t('server.settings.reinstall.confirm')}
                onClose={() => setModalVisible(false)}
                onConfirmed={reinstall}
                loading={loading}
            >
                {t('server.settings.reinstall.confirm_description')}
            </Dialog.Confirm>

            <div className='mx-auto flex w-full max-w-4xl flex-col px-4 py-8 sm:px-14 sm:py-14'>
                <div className='mb-10'>
                    <h1 className='text-2xl font-semibold tracking-tight text-cream-100'>
                        {t('server.settings.title')}
                    </h1>
                    <p className='mt-2 max-w-sm text-sm text-cream-400/70'>{t('server.settings.description')}</p>
                </div>
                <FlashMessageRender byKey={'settings'} />

                <Can action={'settings.rename'}>
                    <Formik
                        onSubmit={submit}
                        initialValues={{
                            name: server.name,
                            description: server.description,
                        }}
                        validationSchema={object().shape({
                            name: string().required().min(1),
                            description: string().nullable(),
                        })}
                    >
                        <Form className={sectionClass}>
                            <div>
                                <h2 className='flex items-center gap-2 text-sm font-medium text-cream-200'>
                                    <Gear width={16} height={16} className='text-cream-400/70' />
                                    {t('server.settings.rename.title')}
                                </h2>
                                <p className='mt-1 text-sm text-cream-400/70'>{t('server.settings.rename.subtitle')}</p>
                            </div>
                            <div className='flex flex-col gap-4'>
                                <div className='flex max-w-lg flex-col gap-4'>
                                    <Field
                                        id={'name'}
                                        name={'name'}
                                        label={t('server.settings.rename.name_label')}
                                        type={'text'}
                                    />
                                    <Field
                                        id={'description'}
                                        name={'description'}
                                        label={t('server.settings.rename.description_label')}
                                        type={'text'}
                                    />
                                </div>
                                <div>
                                    <Button variant='secondary' type='submit'>
                                        {t('common.save')}
                                    </Button>
                                </div>
                            </div>
                        </Form>
                    </Formik>
                </Can>

                <Can action={'settings.webhook'}>
                    <section className={sectionClass}>
                        <div>
                            <h2 className='flex items-center gap-2 text-sm font-medium text-cream-200'>
                                <Bell width={16} height={16} className='text-cream-400/70' />
                                {t('server.settings.webhook.title')}
                            </h2>
                            <p className='mt-1 text-sm text-cream-400/70'>{t('server.settings.webhook.subtitle')}</p>
                        </div>
                        <EditWebhookBox allowedWebhookTypes={allowedWebhookTypes || {}} />
                    </section>
                </Can>

                <section className={sectionClass}>
                    <div>
                        <h2 className='flex items-center gap-2 text-sm font-medium text-cream-200'>
                            <FolderArrowUpIn width={16} height={16} className='text-cream-400/70' />
                            {t('server.settings.sftp_details')}
                        </h2>
                        <p className='mt-1 text-sm text-cream-400/70'>{t('server.settings.details_description')}</p>
                    </div>
                    <div className='flex flex-col gap-4'>
                        <div className='max-w-lg'>
                            <Can action={'file.sftp'}>
                                <div className={rowClass}>
                                    <span className='flex items-center gap-2 text-xs text-cream-400/50'>
                                        <FolderArrowUpIn width={14} height={14} />
                                        {t('server.settings.sftp_address')}
                                    </span>
                                    <CopyOnClick text={sftpAddress}>
                                        <span className='cursor-pointer truncate font-mono text-sm text-cream-200 hover:text-cream-50'>
                                            {sftpAddress}
                                        </span>
                                    </CopyOnClick>
                                </div>
                                <div className={rowClass}>
                                    <span className='flex items-center gap-2 text-xs text-cream-400/50'>
                                        <FolderArrowUpIn width={14} height={14} />
                                        {t('server.settings.sftp_username')}
                                    </span>
                                    <CopyOnClick text={sftpUsername}>
                                        <span className='cursor-pointer truncate font-mono text-sm text-cream-200 hover:text-cream-50'>
                                            {sftpUsername}
                                        </span>
                                    </CopyOnClick>
                                </div>
                            </Can>
                            <div className={rowClass}>
                                <span className='flex items-center gap-2 text-xs text-cream-400/50'>
                                    <Bug width={14} height={14} />
                                    {t('server.settings.node')}
                                </span>
                                <CopyOnClick text={node}>
                                    <span className='cursor-pointer truncate font-mono text-sm text-cream-200 hover:text-cream-50'>
                                        {node}
                                    </span>
                                </CopyOnClick>
                            </div>
                            <div className={rowClass}>
                                <span className='flex items-center gap-2 text-xs text-cream-400/50'>
                                    <Bug width={14} height={14} />
                                    {t('server.settings.server_id')}
                                </span>
                                <CopyOnClick text={uuid}>
                                    <span className='cursor-pointer truncate font-mono text-sm text-cream-200 hover:text-cream-50'>
                                        {uuid}
                                    </span>
                                </CopyOnClick>
                            </div>
                        </div>
                        <Can action={'file.sftp'}>
                            <div>
                                <a href={`sftp://${sftpUsername}@${ip(sftp.ip)}:${sftp.port}`}>
                                    <Button variant='secondary'>{t('server.settings.launch_sftp')}</Button>
                                </a>
                            </div>
                        </Can>
                    </div>
                </section>

                <Can action={'settings.reinstall'}>
                    <section className={sectionClass}>
                        <div>
                            <h2 className='flex items-center gap-2 text-sm font-medium text-cream-200'>
                                <ArrowsRotateRight width={16} height={16} className='text-cream-400/70' />
                                {t('server.settings.reinstall.title')}
                            </h2>
                            <p className='mt-1 text-sm text-cream-400/70'>
                                {t('server.settings.reinstall.description')}
                            </p>
                        </div>
                        <div className='content-center'>
                            <Button variant='attention' onClick={() => setModalVisible(true)} disabled={loading}>
                                {t('server.settings.reinstall.title')}
                            </Button>
                        </div>
                    </section>
                </Can>
            </div>
        </ServerContentBlock>
    );
};

export default SettingsContainer;
