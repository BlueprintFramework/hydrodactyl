import { Database, Plus } from '@gravity-ui/icons';
import { Field as FormikField, Form, Formik, type FormikHelpers } from 'formik';
import { For } from 'million/react';
import { useEffect, useState } from 'react';
import { object, string } from 'yup';
import { httpErrorToHuman } from '@/api/http';
import createServerDatabase from '@/api/server/databases/createServerDatabase';
import getServerDatabases, { type AvailableDatabaseType } from '@/api/server/databases/getServerDatabases';
import Can from '@/components/elements/Can';
import Field from '@/components/elements/Field';
import FormikFieldWrapper from '@/components/elements/FormikFieldWrapper';
import Modal from '@/components/elements/Modal';
import { PageListContainer } from '@/components/elements/pages/PageList';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import FlashMessageRender from '@/components/FlashMessageRender';
import DatabaseRow from '@/components/server/databases/DatabaseRow';
import ServerHeader from '@/components/server/header/ServerHeader';
import { Button } from '@/components/ui/button';
import { useDeepMemoize } from '@/plugins/useDeepMemoize';
import useFlash from '@/plugins/useFlash';
import { ServerContext } from '@/state/server';

interface DatabaseValues {
    databaseName: string;
    connectionsFrom: string;
    databaseType: string;
}

const databaseSchema = object().shape({
    databaseName: string()
        .required('A database name must be provided.')
        .min(3, 'Database name must be at least 3 characters.')
        .max(48, 'Database name must not exceed 48 characters.')
        .matches(
            /^[\w\-.]{3,48}$/,
            'Database name should only contain alphanumeric characters, underscores, dashes, and/or periods.',
        ),
    connectionsFrom: string().matches(/^[\w\-/.%:*]+$/, 'A valid host address must be provided.'),
    databaseType: string().required('A database type must be selected.'),
});

const DatabasesContainer = () => {
    const uuid = ServerContext.useStoreState((state) => state.server.data?.uuid);
    const databaseLimit = ServerContext.useStoreState((state) => state.server.data?.featureLimits.databases);

    const { addError, clearFlashes } = useFlash();
    const [loading, setLoading] = useState(true);
    const [createModalVisible, setCreateModalVisible] = useState(false);
    const [availableTypes, setAvailableTypes] = useState<AvailableDatabaseType[]>([]);

    const databases = useDeepMemoize(ServerContext.useStoreState((state) => state.databases.data));
    const setDatabases = ServerContext.useStoreActions((state) => state.databases.setDatabases);
    const appendDatabase = ServerContext.useStoreActions((actions) => actions.databases.appendDatabase);
    const canCreateDatabase = availableTypes.length > 0;

    const submitDatabase = (values: DatabaseValues, { setSubmitting, resetForm }: FormikHelpers<DatabaseValues>) => {
        clearFlashes('database:create');
        const normalizedConnectionsFrom = values.connectionsFrom.trim() === '*' ? '%' : values.connectionsFrom.trim();

        createServerDatabase(uuid, {
            databaseName: values.databaseName,
            connectionsFrom: normalizedConnectionsFrom || '%',
            databaseType: values.databaseType,
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
            .then(({ databases, availableTypes }) => {
                setDatabases(databases);
                setAvailableTypes(availableTypes);
            })
            .catch((error) => {
                console.error(error);
                addError({ key: 'databases', message: httpErrorToHuman(error) });
            })
            .then(() => setLoading(false));
    }, [clearFlashes, uuid, setDatabases, databases.length, addError]);

    return (
        <ServerContentBlock className='p-0!' title={'Databases'} showFlashKey={'databases'}>
            <ServerHeader />
            <div className='px-2 pt-2 sm:px-14 sm:pt-14 flex flex-col sm:flex-row items-center gap-4'>
                {canCreateDatabase && (databaseLimit === null || (databaseLimit > 0 && databaseLimit !== databases.length)) && (
                    <Can action={'database.create'}>
                        <Button
                            variant='secondary'
                            onClick={() => setCreateModalVisible(true)}
                            className='flex items-center gap-2'
                        >
                            <Plus width={22} height={22} className='w-4 h-4' fill='currentColor' />
                            New Database
                        </Button>
                    </Can>
                )}
                {databaseLimit === null && (
                    <p className='text-sm text-zinc-300 text-center sm:text-right'>
                        {databases.length} databases (unlimited)
                    </p>
                )}
                {databaseLimit > 0 && (
                    <p className='text-sm text-zinc-300 text-center sm:text-right'>
                        {databases.length} of {databaseLimit} databases
                    </p>
                )}
                {databaseLimit === 0 && (
                    <p className='text-sm text-red-400 text-center sm:text-right'>Databases disabled</p>
                )}
            </div>
            <Formik
                onSubmit={submitDatabase}
                initialValues={{
                    databaseName: '',
                    connectionsFrom: '*',
                    databaseType: availableTypes[0]?.value || 'mysql',
                }}
                validationSchema={databaseSchema}
                enableReinitialize
            >
                {({ isSubmitting, resetForm, values }) => {
                    const selectedDatabaseType = availableTypes.find((type) => type.value === values.databaseType);

                    return (
                        <Modal
                            visible={createModalVisible}
                            dismissable={!isSubmitting}
                            showSpinnerOverlay={isSubmitting}
                            onDismissed={() => {
                                resetForm();
                                setCreateModalVisible(false);
                            }}
                            title='Create new database'
                        >
                            <div className='w-full max-w-lg mx-auto'>
                                <FlashMessageRender byKey={'database:create'} />
                                <Form>
                                    <Field
                                        type={'string'}
                                        id={'database_name'}
                                        name={'databaseName'}
                                        label={'Database Name'}
                                        description={'A descriptive name for your database instance.'}
                                    />
                                    <FormikFieldWrapper
                                        name={'databaseType'}
                                        id={'database_type'}
                                        label={'Database Type'}
                                        className={'mt-6'}
                                    >
                                        <FormikField
                                            as={'select'}
                                            id={'database_type'}
                                            name={'databaseType'}
                                            className='px-4 py-2 rounded-lg outline-hidden bg-[#ffffff17] text-base sm:text-sm w-full'
                                        >
                                            {availableTypes.map((type) => (
                                                <option key={type.value} value={type.value}>
                                                    {type.label}
                                                </option>
                                            ))}
                                        </FormikField>
                                    </FormikFieldWrapper>
                                    {selectedDatabaseType?.supportsRemoteConnections && (
                                        <div className='mt-6'>
                                            <Field
                                                type={'string'}
                                                id={'connections_from'}
                                                name={'connectionsFrom'}
                                                label={'Allow Connections From (Default *)'}
                                                description={'Use * to allow connections from anywhere.'}
                                            />
                                        </div>
                                    )}
                                    <div className='mt-6'>
                                        <Button variant='attention' type={'submit'} className='w-full'>
                                            Create Database
                                        </Button>
                                    </div>
                                </Form>
                            </div>
                        </Modal>
                    );
                }}
            </Formik>

            {!databases.length && loading ? (
                <div className='flex items-center justify-center py-12'>
                    <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-brand'></div>
                </div>
            ) : databases.length > 0 ? (
                <PageListContainer data-hydrodactyl-databases>
                    <For each={databases} memo>
                        {(database, _index) => <DatabaseRow key={database.id} database={database} />}
                    </For>
                </PageListContainer>
            ) : (
                <div className='flex flex-col items-center justify-center min-h-[60vh] py-12 px-4'>
                    <div className='text-center'>
                        <div className='w-16 h-16 mx-auto mb-4 rounded-full bg-[#ffffff11] flex items-center justify-center'>
                            <Database className='w-8 h-8 text-zinc-400' fill='currentColor' />
                        </div>
                        <h3 className='text-lg font-medium text-zinc-200 mb-2'>
                            {databaseLimit === 0 ? 'Databases unavailable' : 'No databases found'}
                        </h3>
                        <p className='text-sm text-zinc-400 max-w-sm'>
                            {databaseLimit === 0
                                ? 'Databases cannot be created for this server.'
                                : !canCreateDatabase
                                  ? 'No compatible database hosts are available for this server node.'
                                : 'Your server does not have any databases. Create one to get started.'}
                        </p>
                    </div>
                </div>
            )}
        </ServerContentBlock>
    );
};

export default DatabasesContainer;
