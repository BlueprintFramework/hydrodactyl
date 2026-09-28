import { Database, Plus } from '@gravity-ui/icons';
import { Form, Formik, type FormikHelpers } from 'formik';
import { useEffect, useMemo, useState } from 'react';
import { object, string } from 'yup';
import { httpErrorToHuman } from '@/api/http';
import createServerDatabase from '@/api/server/databases/createServerDatabase';
import getServerDatabases from '@/api/server/databases/getServerDatabases';
import Can from '@/components/elements/Can';
import Field from '@/components/elements/Field';
import Modal from '@/components/elements/Modal';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import VirtualizedList from '@/components/elements/VirtualizedList';
import FlashMessageRender from '@/components/FlashMessageRender';
import DatabaseRow from '@/components/server/databases/DatabaseRow';
import ServerHeader from '@/components/server/header/ServerHeader';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/I18nProvider';
import { useDeepMemoize } from '@/plugins/useDeepMemoize';
import useFlash from '@/plugins/useFlash';
import { ServerContext } from '@/state/server';

interface DatabaseValues {
    databaseName: string;
    connectionsFrom: string;
}

const DatabasesContainer = () => {
    const { t } = useTranslation();
    const uuid = ServerContext.useStoreState((state) => state.server.data?.uuid);
    const databaseLimit = ServerContext.useStoreState((state) => state.server.data?.featureLimits.databases);

    const { addError, clearFlashes } = useFlash();
    const [loading, setLoading] = useState(true);
    const [createModalVisible, setCreateModalVisible] = useState(false);

    const databases = useDeepMemoize(ServerContext.useStoreState((state) => state.databases.data));
    const setDatabases = ServerContext.useStoreActions((state) => state.databases.setDatabases);
    const appendDatabase = ServerContext.useStoreActions((actions) => actions.databases.appendDatabase);

    const databaseSchema = useMemo(
        () =>
            object().shape({
                databaseName: string()
                    .required(t('server.databases.name_required'))
                    .min(3, t('server.databases.name_min'))
                    .max(48, t('server.databases.name_max'))
                    .matches(/^[\w\-.]{3,48}$/, t('server.databases.name_format')),
                connectionsFrom: string().matches(/^[\w\-./%:]+$/, t('server.databases.host_invalid')),
            }),
        [t],
    );

    const submitDatabase = (values: DatabaseValues, { setSubmitting, resetForm }: FormikHelpers<DatabaseValues>) => {
        clearFlashes('database:create');
        createServerDatabase(uuid, {
            databaseName: values.databaseName,
            connectionsFrom: values.connectionsFrom || '%',
        })
            .then((database) => {
                resetForm();
                appendDatabase(database);
                setSubmitting(false);
                setCreateModalVisible(false);
            })
            .catch((error) => {
                addError({ key: 'database:create', message: httpErrorToHuman(error) });
                setSubmitting(false);
            });
    };

    useEffect(() => {
        setLoading(!databases.length);
        clearFlashes('databases');

        getServerDatabases(uuid)
            .then((databases) => setDatabases(databases))
            .catch((error) => {
                console.error(error);
                addError({ key: 'databases', message: httpErrorToHuman(error) });
            })
            .then(() => setLoading(false));
    }, [clearFlashes, uuid, setDatabases, databases.length, addError]);

    return (
        <ServerContentBlock className='p-0!' title={t('server.databases.title')} showFlashKey={'databases'}>
            <ServerHeader />
            <div className='px-2 pt-2 sm:px-14 sm:pt-14 flex flex-col sm:flex-row items-center gap-4'>
                {(databaseLimit === null || (databaseLimit > 0 && databaseLimit !== databases.length)) && (
                    <Can action={'database.create'}>
                        <Button
                            variant='secondary'
                            onClick={() => setCreateModalVisible(true)}
                            className='flex items-center gap-2'
                        >
                            <Plus width={22} height={22} className='w-4 h-4' fill='currentColor' />
                            {t('server.databases.new_database')}
                        </Button>
                    </Can>
                )}
                {databaseLimit === null && (
                    <p className='text-sm text-zinc-300 text-center sm:text-right'>
                        {t('server.databases.unlimited_count', { count: databases.length })}
                    </p>
                )}
                {databaseLimit > 0 && (
                    <p className='text-sm text-zinc-300 text-center sm:text-right'>
                        {t('server.databases.count_of_limit', { count: databases.length, limit: databaseLimit })}
                    </p>
                )}
                {databaseLimit === 0 && (
                    <p className='text-sm text-red-400 text-center sm:text-right'>{t('server.databases.disabled')}</p>
                )}
            </div>
            <Formik
                onSubmit={submitDatabase}
                initialValues={{ databaseName: '', connectionsFrom: '' }}
                validationSchema={databaseSchema}
            >
                {({ isSubmitting, resetForm }) => (
                    <Modal
                        visible={createModalVisible}
                        dismissable={!isSubmitting}
                        showSpinnerOverlay={isSubmitting}
                        onDismissed={() => {
                            resetForm();
                            setCreateModalVisible(false);
                        }}
                        title={t('server.databases.create_title')}
                    >
                        <div className='flex flex-col'>
                            <FlashMessageRender byKey={'database:create'} />
                            <Form>
                                <Field
                                    type={'string'}
                                    id={'database_name'}
                                    name={'databaseName'}
                                    label={t('server.databases.name_label')}
                                    description={t('server.databases.name_description')}
                                />
                                <div className={`mt-6`}>
                                    <Field
                                        type={'string'}
                                        id={'connections_from'}
                                        name={'connectionsFrom'}
                                        label={t('server.databases.connections_from_label')}
                                        description={t('server.databases.connections_from_description')}
                                    />
                                </div>
                                <div className={`flex gap-3 justify-end my-6`}>
                                    <Button variant='attention' type={'submit'}>
                                        {t('server.databases.create_confirm')}
                                    </Button>
                                </div>
                            </Form>
                        </div>
                    </Modal>
                )}
            </Formik>

            {!databases.length && loading ? (
                <div className='flex items-center justify-center py-12'>
                    <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-brand'></div>
                </div>
            ) : databases.length > 0 ? (
                <div className='px-2 sm:px-14 pt-2'>
                    <VirtualizedList
                        items={databases}
                        renderItem={(database) => <DatabaseRow key={database.id} database={database} />}
                        estimateSize={() => 80}
                        gap={12}
                    />
                </div>
            ) : (
                <div className='flex flex-col items-center justify-center min-h-[60vh] py-12 px-4'>
                    <div className='text-center'>
                        <div className='w-16 h-16 mx-auto mb-4 rounded-full bg-[#ffffff11] flex items-center justify-center'>
                            <Database className='w-8 h-8 text-zinc-400' fill='currentColor' />
                        </div>
                        <h3 className='text-lg font-medium text-zinc-200 mb-2'>
                            {databaseLimit === 0
                                ? t('server.databases.unavailable_title')
                                : t('server.databases.empty_title')}
                        </h3>
                        <p className='text-sm text-zinc-400 max-w-sm'>
                            {databaseLimit === 0
                                ? t('server.databases.unavailable_description')
                                : t('server.databases.empty_description')}
                        </p>
                    </div>
                </div>
            )}
        </ServerContentBlock>
    );
};

export default DatabasesContainer;
