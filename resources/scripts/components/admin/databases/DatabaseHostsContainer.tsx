import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
    type AdminDatabaseHost,
    createDatabaseHost,
    type DatabaseHostValues,
    testDatabaseConnection,
} from '@/api/admin/databaseHosts';
import { errorToMessage, parseValidationErrors } from '@/api/admin/errors';
import { useDatabaseHostOptions, useDatabaseHosts } from '@/api/admin/useDatabaseHosts';
import { Field } from '@/components/admin/Field';
import Dropdown from '@/components/elements/Dropdown';
import { Dialog } from '@/components/elements/dialog';
import { Input } from '@/components/elements/inputs';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import PageContentBlock from '@/components/elements/PageContentBlock';
import Spinner from '@/components/elements/Spinner';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/I18nProvider';

const emptyValues: DatabaseHostValues = {
    name: '',
    host: '',
    port: '3306',
    username: '',
    password: '',
    node_id: '',
};

const CreateHostDialog = ({
    open,
    onClose,
    onCreated,
}: {
    open: boolean;
    onClose: () => void;
    onCreated: (host: AdminDatabaseHost) => void;
}) => {
    const { t } = useTranslation();
    const [values, setValues] = useState<DatabaseHostValues>(emptyValues);
    const [submitting, setSubmitting] = useState(false);
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const { data: options } = useDatabaseHostOptions();

    const set = <K extends keyof DatabaseHostValues>(key: K, value: DatabaseHostValues[K]) =>
        setValues((current) => ({ ...current, [key]: value }));

    const close = () => {
        if (!submitting && !testing) {
            onClose();
        }
    };

    const test = async () => {
        setTesting(true);
        setTestResult(null);

        try {
            const result = await testDatabaseConnection({
                host: values.host,
                port: values.port,
                username: values.username,
                password: values.password,
            });
            setTestResult({ success: result.success, message: result.message });
        } catch (error) {
            setTestResult({
                success: false,
                message: errorToMessage(error, t('admin.databases.test_failed')),
            });
        } finally {
            setTesting(false);
        }
    };

    const submit = async () => {
        setSubmitting(true);
        setErrors({});

        try {
            const host = await createDatabaseHost(values);
            toast.success(t('admin.databases.created'));
            setValues(emptyValues);
            setTestResult(null);
            onCreated(host);
            onClose();
        } catch (error) {
            setErrors(parseValidationErrors(error));
            toast.error(errorToMessage(error, t('admin.databases.create_failed')));
        } finally {
            setSubmitting(false);
        }
    };

    const nodeOptions = [
        { value: '', label: t('common.none') },
        ...(options?.nodes ?? []).map((node) => ({
            value: String(node.id),
            label: node.name,
            description: node.location,
        })),
    ];

    return (
        <Dialog open={open} title={t('admin.databases.create')} onClose={close} preventExternalClose={submitting}>
            <div className='mt-4'>
                <form
                    id='create-database-host-form'
                    onSubmit={(event) => {
                        event.preventDefault();
                        void submit();
                    }}
                    className='flex flex-col gap-4'
                >
                    <Field label={t('admin.common.name')} error={errors.name} hint={t('admin.databases.name_hint')}>
                        <Input.Text value={values.name} onChange={(event) => set('name', event.target.value)} />
                    </Field>

                    <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
                        <div className='sm:col-span-2'>
                            <Field
                                label={t('admin.databases.host')}
                                error={errors.host}
                                hint={t('admin.databases.host_hint')}
                            >
                                <Input.Text value={values.host} onChange={(event) => set('host', event.target.value)} />
                            </Field>
                        </div>
                        <Field
                            label={t('admin.databases.port')}
                            error={errors.port}
                            hint={t('admin.databases.port_hint')}
                        >
                            <Input.Text
                                type='number'
                                value={values.port}
                                onChange={(event) => set('port', event.target.value)}
                            />
                        </Field>
                    </div>

                    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                        <Field
                            label={t('admin.common.username')}
                            error={errors.username}
                            hint={t('admin.databases.username_hint')}
                        >
                            <Input.Text
                                value={values.username}
                                onChange={(event) => set('username', event.target.value)}
                            />
                        </Field>
                        <Field
                            label={t('admin.common.password')}
                            error={errors.password}
                            hint={t('admin.databases.password_hint')}
                        >
                            <Input.Text
                                type='password'
                                value={values.password}
                                onChange={(event) => set('password', event.target.value)}
                            />
                        </Field>
                    </div>

                    <Field
                        label={t('admin.databases.linked_node')}
                        error={errors.node_id}
                        hint={t('admin.databases.linked_node_hint')}
                    >
                        <Dropdown
                            value={values.node_id}
                            onChange={(value) => set('node_id', value)}
                            options={nodeOptions}
                            placeholder={t('common.none')}
                        />
                    </Field>

                    <p className='text-xs text-brand-400'>
                        {t('admin.databases.grant_notice_prefix')} <code className='font-mono'>WITH GRANT OPTION</code>{' '}
                        {t('admin.databases.grant_notice_suffix')}
                    </p>

                    {testResult && (
                        <div
                            className={
                                testResult.success
                                    ? 'rounded-lg border border-hydro-500/40 bg-hydro-500/10 px-3 py-2 text-xs text-hydro-300'
                                    : 'rounded-lg border border-brand-400/40 bg-brand-400/10 px-3 py-2 text-xs text-brand-400'
                            }
                        >
                            {testResult.message}
                        </div>
                    )}

                    <Dialog.Footer>
                        <Button
                            type='button'
                            variant='secondary'
                            className='mr-auto'
                            onClick={() => void test()}
                            disabled={testing || submitting}
                        >
                            {testing ? t('admin.databases.testing') : t('admin.databases.test_connection')}
                        </Button>
                        <Button type='button' variant='secondary' onClick={close} disabled={submitting}>
                            {t('common.cancel')}
                        </Button>
                        <Button type='submit' form='create-database-host-form' disabled={submitting || testing}>
                            {t('common.create')}
                        </Button>
                    </Dialog.Footer>
                </form>
            </div>
        </Dialog>
    );
};

const DatabaseHostsContainer = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { data, mutate } = useDatabaseHosts();
    const [createOpen, setCreateOpen] = useState(false);

    if (!data) {
        return (
            <div className='flex min-h-[60vh] items-center justify-center'>
                <Spinner centered size={Spinner.Size.LARGE} />
            </div>
        );
    }

    return (
        <PageContentBlock title={t('admin.databases.title')}>
            <MainPageHeader direction='column' title={t('admin.databases.title')}>
                <p className='text-sm text-neutral-400'>{t('admin.databases.description')}</p>
            </MainPageHeader>

            <div className='mb-4 flex justify-end'>
                <Button onClick={() => setCreateOpen(true)}>{t('admin.databases.create')}</Button>
            </div>

            <div className='overflow-x-auto rounded-xl border border-mocha-400'>
                <table className='w-full text-sm'>
                    <thead className='text-left text-xs uppercase tracking-wide text-cream-400/60'>
                        <tr className='border-b border-mocha-400'>
                            <th className='px-4 py-3'>{t('admin.common.id')}</th>
                            <th className='px-4 py-3'>{t('admin.common.name')}</th>
                            <th className='px-4 py-3'>{t('admin.databases.host')}</th>
                            <th className='px-4 py-3'>{t('admin.databases.port')}</th>
                            <th className='px-4 py-3'>{t('admin.common.username')}</th>
                            <th className='px-4 py-3 text-center'>{t('admin.databases.databases')}</th>
                            <th className='px-4 py-3 text-center'>{t('admin.common.node')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((host) => (
                            <tr key={host.id} className='border-b border-mocha-400/40 hover:bg-mocha-400/20'>
                                <td className='px-4 py-3 font-mono text-cream-400/60'>{host.id}</td>
                                <td className='px-4 py-3'>
                                    <Link to={`/databases/${host.id}`} className='text-cream-50 hover:text-hydro-400'>
                                        {host.name}
                                    </Link>
                                </td>
                                <td className='px-4 py-3 font-mono text-cream-400/70'>{host.host}</td>
                                <td className='px-4 py-3 font-mono text-cream-400/70'>{host.port}</td>
                                <td className='px-4 py-3 text-cream-400/70'>{host.username}</td>
                                <td className='px-4 py-3 text-center text-cream-100'>{host.databases_count}</td>
                                <td className='px-4 py-3 text-center'>
                                    {host.node ? (
                                        <Link
                                            to={`/nodes/${host.node.id}`}
                                            className='text-cream-50 hover:text-hydro-400'
                                        >
                                            {host.node.name}
                                        </Link>
                                    ) : (
                                        <span className='rounded-full bg-mocha-300/60 px-2 py-0.5 text-[10px] uppercase text-cream-400/70'>
                                            {t('common.none')}
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {data.length === 0 && (
                            <tr>
                                <td colSpan={7} className='px-4 py-8 text-center text-cream-400/50'>
                                    {t('admin.databases.empty')}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <CreateHostDialog
                open={createOpen}
                onClose={() => setCreateOpen(false)}
                onCreated={(host) => {
                    void mutate();
                    navigate(`/databases/${host.id}`);
                }}
            />
        </PageContentBlock>
    );
};

export default DatabaseHostsContainer;
