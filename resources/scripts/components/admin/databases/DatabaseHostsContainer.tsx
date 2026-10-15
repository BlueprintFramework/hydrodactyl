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
                message: errorToMessage(error, 'Failed to connect to the database host.'),
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
            toast.success('Database host created.');
            setValues(emptyValues);
            setTestResult(null);
            onCreated(host);
            onClose();
        } catch (error) {
            setErrors(parseValidationErrors(error));
            toast.error(errorToMessage(error, 'Failed to create the database host.'));
        } finally {
            setSubmitting(false);
        }
    };

    const nodeOptions = [
        { value: '', label: 'None' },
        ...(options?.nodes ?? []).map((node) => ({
            value: String(node.id),
            label: node.name,
            description: node.location,
        })),
    ];

    return (
        <Dialog open={open} title='Create Database Host' onClose={close} preventExternalClose={submitting}>
            <div className='mt-4'>
                <form
                    id='create-database-host-form'
                    onSubmit={(event) => {
                        event.preventDefault();
                        void submit();
                    }}
                    className='flex flex-col gap-4'
                >
                    <Field
                        label='Name'
                        error={errors.name}
                        hint='A short identifier used to distinguish this database host from others.'
                    >
                        <Input.Text value={values.name} onChange={(event) => set('name', event.target.value)} />
                    </Field>

                    <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
                        <div className='sm:col-span-2'>
                            <Field
                                label='Host'
                                error={errors.host}
                                hint='The IP address or FQDN used to connect to this MySQL host from the panel.'
                            >
                                <Input.Text value={values.host} onChange={(event) => set('host', event.target.value)} />
                            </Field>
                        </div>
                        <Field label='Port' error={errors.port} hint='The MySQL port.'>
                            <Input.Text
                                type='number'
                                value={values.port}
                                onChange={(event) => set('port', event.target.value)}
                            />
                        </Field>
                    </div>

                    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                        <Field
                            label='Username'
                            error={errors.username}
                            hint='An account with permission to create users and databases.'
                        >
                            <Input.Text
                                value={values.username}
                                onChange={(event) => set('username', event.target.value)}
                            />
                        </Field>
                        <Field label='Password' error={errors.password} hint='The password for the account above.'>
                            <Input.Text
                                type='password'
                                value={values.password}
                                onChange={(event) => set('password', event.target.value)}
                            />
                        </Field>
                    </div>

                    <Field
                        label='Linked Node'
                        error={errors.node_id}
                        hint='Only used to default to this host when adding a database to a server on the selected node.'
                    >
                        <Dropdown
                            value={values.node_id}
                            onChange={(value) => set('node_id', value)}
                            options={nodeOptions}
                            placeholder='None'
                        />
                    </Field>

                    <p className='text-xs text-brand-400'>
                        The account must have the <code className='font-mono'>WITH GRANT OPTION</code> permission, and
                        must not be the account the panel itself uses.
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
                            {testing ? 'Testing…' : 'Test Connection'}
                        </Button>
                        <Button type='button' variant='secondary' onClick={close} disabled={submitting}>
                            Cancel
                        </Button>
                        <Button type='submit' form='create-database-host-form' disabled={submitting || testing}>
                            Create
                        </Button>
                    </Dialog.Footer>
                </form>
            </div>
        </Dialog>
    );
};

const DatabaseHostsContainer = () => {
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
        <PageContentBlock title='Database Hosts'>
            <MainPageHeader direction='column' title='Database Hosts'>
                <p className='text-sm text-neutral-400'>Database hosts that servers can have databases created on.</p>
            </MainPageHeader>

            <div className='mb-4 flex justify-end'>
                <Button onClick={() => setCreateOpen(true)}>Create Database Host</Button>
            </div>

            <div className='overflow-x-auto rounded-xl border border-mocha-400'>
                <table className='w-full text-sm'>
                    <thead className='text-left text-xs uppercase tracking-wide text-cream-400/60'>
                        <tr className='border-b border-mocha-400'>
                            <th className='px-4 py-3'>ID</th>
                            <th className='px-4 py-3'>Name</th>
                            <th className='px-4 py-3'>Host</th>
                            <th className='px-4 py-3'>Port</th>
                            <th className='px-4 py-3'>Username</th>
                            <th className='px-4 py-3 text-center'>Databases</th>
                            <th className='px-4 py-3 text-center'>Node</th>
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
                                            None
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {data.length === 0 && (
                            <tr>
                                <td colSpan={7} className='px-4 py-8 text-center text-cream-400/50'>
                                    No database hosts have been created.
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
