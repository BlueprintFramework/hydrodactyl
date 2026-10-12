import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
    type AdminDatabaseHostDetail,
    type DatabaseHostValues,
    deleteDatabaseHost,
    updateDatabaseHost,
} from '@/api/admin/databaseHosts';
import { errorToMessage, parseValidationErrors } from '@/api/admin/errors';
import { useDatabaseHost, useDatabaseHostOptions } from '@/api/admin/useDatabaseHosts';
import { Field } from '@/components/admin/Field';
import Dropdown from '@/components/elements/Dropdown';
import { Dialog } from '@/components/elements/dialog';
import { Input } from '@/components/elements/inputs';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import PageContentBlock from '@/components/elements/PageContentBlock';
import Spinner from '@/components/elements/Spinner';
import PaginationFooter from '@/components/elements/table/PaginationFooter';
import { Button } from '@/components/ui/button';

const cardClass = 'flex flex-col gap-4 rounded-xl border border-mocha-400 bg-mocha-500 p-4';

const DatabaseHostDetails = ({
    host,
    onSaved,
    onPageSelect,
}: {
    host: AdminDatabaseHostDetail;
    onSaved: () => Promise<unknown>;
    onPageSelect: (page: number) => void;
}) => {
    const navigate = useNavigate();
    const { data: options } = useDatabaseHostOptions();
    const [values, setValues] = useState<DatabaseHostValues>({
        name: host.name,
        host: host.host,
        port: String(host.port),
        username: host.username,
        password: '',
        node_id: host.node_id ? String(host.node_id) : '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const set = <K extends keyof DatabaseHostValues>(key: K, value: DatabaseHostValues[K]) =>
        setValues((current) => ({ ...current, [key]: value }));

    const nodeOptions = [
        { value: '', label: 'None' },
        ...(options?.nodes ?? []).map((node) => ({
            value: String(node.id),
            label: node.name,
            description: node.location,
        })),
    ];

    const save = async () => {
        setSubmitting(true);
        setErrors({});

        try {
            await updateDatabaseHost(host.id, values);
            await onSaved();
            set('password', '');
            toast.success('Database host updated.');
        } catch (error) {
            setErrors(parseValidationErrors(error));
            toast.error(errorToMessage(error, 'Failed to update the database host.'));
        } finally {
            setSubmitting(false);
        }
    };

    const remove = async () => {
        setDeleting(true);

        try {
            await deleteDatabaseHost(host.id);
            toast.success('Database host deleted.');
            navigate('/databases');
        } catch (error) {
            toast.error(errorToMessage(error, 'Failed to delete the database host.'));
            setDeleting(false);
            setConfirmDelete(false);
        }
    };

    return (
        <div className='flex flex-col gap-4'>
            <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        void save();
                    }}
                    className={cardClass}
                >
                    <h2 className='text-sm font-semibold text-cream-50'>Host Details</h2>

                    <Field label='Name' error={errors.name}>
                        <Input.Text value={values.name} onChange={(event) => set('name', event.target.value)} />
                    </Field>

                    <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
                        <div className='sm:col-span-2'>
                            <Field
                                label='Host'
                                error={errors.host}
                                hint='The IP address or FQDN used to connect from the panel.'
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
                        <Field label='Username' error={errors.username}>
                            <Input.Text
                                value={values.username}
                                onChange={(event) => set('username', event.target.value)}
                            />
                        </Field>
                        <Field
                            label='Password'
                            error={errors.password}
                            hint='Leave blank to keep the current password.'
                        >
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

                    <div className='flex justify-end'>
                        <Button type='submit' disabled={submitting}>
                            Save
                        </Button>
                    </div>
                </form>

                <div className={cardClass}>
                    <h2 className='text-sm font-semibold text-cream-50'>Connection</h2>

                    <dl className='grid grid-cols-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-2'>
                        <dt className='text-cream-400/60'>Address</dt>
                        <dd className='font-mono text-cream-100'>
                            {host.host}:{host.port}
                        </dd>
                        <dt className='text-cream-400/60'>Username</dt>
                        <dd className='text-cream-100'>{host.username}</dd>
                        <dt className='text-cream-400/60'>Databases</dt>
                        <dd className='text-cream-100'>{host.databases.pagination.total}</dd>
                    </dl>

                    <p className='text-xs text-brand-400'>
                        The account must have the <code className='font-mono'>WITH GRANT OPTION</code> permission, and
                        must not be the account the panel itself uses.
                    </p>
                </div>
            </div>

            <div className='overflow-hidden rounded-xl border border-mocha-400'>
                <div className='border-b border-mocha-400 px-4 py-3'>
                    <h2 className='text-sm font-semibold text-cream-50'>Databases</h2>
                </div>
                <div className='overflow-x-auto'>
                    <table className='w-full text-sm'>
                        <thead className='text-left text-xs uppercase tracking-wide text-cream-400/60'>
                            <tr className='border-b border-mocha-400'>
                                <th className='px-4 py-3'>Server</th>
                                <th className='px-4 py-3'>Database Name</th>
                                <th className='px-4 py-3'>Username</th>
                                <th className='px-4 py-3'>Connections From</th>
                                <th className='px-4 py-3'>Max Connections</th>
                                <th className='px-4 py-3' />
                            </tr>
                        </thead>
                        <tbody>
                            {host.databases.items.map((database) => (
                                <tr key={database.id} className='border-b border-mocha-400/40'>
                                    <td className='px-4 py-3'>
                                        {database.server ? (
                                            <Link
                                                to={`/servers/${database.server.id}`}
                                                className='text-cream-50 hover:text-hydro-400'
                                            >
                                                {database.server.name}
                                            </Link>
                                        ) : (
                                            <span className='text-cream-400/50'>—</span>
                                        )}
                                    </td>
                                    <td className='px-4 py-3 font-mono text-cream-400/70'>{database.database}</td>
                                    <td className='px-4 py-3 text-cream-400/70'>{database.username}</td>
                                    <td className='px-4 py-3 font-mono text-cream-400/70'>{database.remote}</td>
                                    <td className='px-4 py-3 text-cream-100'>
                                        {database.max_connections ?? 'Unlimited'}
                                    </td>
                                    <td className='px-4 py-3 text-right'>
                                        {database.server && (
                                            <Button asChild size='sm' variant='secondary'>
                                                <Link to={`/servers/${database.server.id}/database`}>Manage</Link>
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {host.databases.items.length === 0 && (
                                <tr>
                                    <td colSpan={6} className='px-4 py-6 text-center text-cream-400/50'>
                                        No databases are hosted here.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                {host.databases.pagination.total > 0 && (
                    <div className='px-4'>
                        <PaginationFooter pagination={host.databases.pagination} onPageSelect={onPageSelect} />
                    </div>
                )}
            </div>

            <div className='rounded-xl border border-brand-400/40 bg-brand-400/5 p-4'>
                <h2 className='text-sm font-semibold text-brand-400'>Delete Database Host</h2>
                <p className='mt-1 text-sm text-cream-400/70'>
                    A database host must have no databases before it can be deleted.
                </p>
                <Button
                    variant='attention'
                    className='mt-3'
                    disabled={host.databases.pagination.total > 0}
                    onClick={() => setConfirmDelete(true)}
                >
                    Delete Database Host
                </Button>
            </div>

            <Dialog.Confirm
                open={confirmDelete}
                title='Delete Database Host'
                confirm='Delete'
                loading={deleting}
                onClose={() => setConfirmDelete(false)}
                onConfirmed={remove}
            >
                Deleting this database host is permanent and cannot be undone.
            </Dialog.Confirm>
        </div>
    );
};

const DatabaseHostViewContainer = () => {
    const { id } = useParams<'id'>();
    const [page, setPage] = useState(1);
    const { data: host, error, isLoading, mutate } = useDatabaseHost(id, page);

    if (isLoading) {
        return (
            <div className='flex min-h-[60vh] items-center justify-center'>
                <Spinner centered size={Spinner.Size.LARGE} />
            </div>
        );
    }

    if (error || !host) {
        return (
            <PageContentBlock title='Database Host'>
                <div className='rounded-xl border border-mocha-400 bg-mocha-500 p-8 text-center text-sm text-cream-400/60'>
                    That database host could not be found.
                </div>
            </PageContentBlock>
        );
    }

    return (
        <PageContentBlock title={host.name}>
            <MainPageHeader direction='column' title={host.name}>
                <p className='text-sm text-neutral-400'>Viewing associated databases and details for this host.</p>
            </MainPageHeader>

            <DatabaseHostDetails key={host.id} host={host} onSaved={mutate} onPageSelect={setPage} />
        </PageContentBlock>
    );
};

export default DatabaseHostViewContainer;
