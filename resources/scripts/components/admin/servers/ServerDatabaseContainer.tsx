import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { errorToMessage, parseValidationErrors } from '@/api/admin/errors';
import {
    createServerDatabase,
    deleteServerDatabase,
    resetServerDatabasePassword,
    type ServerDatabase,
    type ServerDatabasesResponse,
} from '@/api/admin/servers';
import { useServer, useServerDatabases } from '@/api/admin/useServers';
import { Field } from '@/components/admin/Field';
import Dropdown from '@/components/elements/Dropdown';
import { Dialog } from '@/components/elements/dialog';
import { Input } from '@/components/elements/inputs';
import Spinner from '@/components/elements/Spinner';
import { Button } from '@/components/ui/button';

const cardClass = 'flex flex-col gap-4 rounded-xl border border-mocha-400 bg-mocha-500 p-4';

const DatabaseManager = ({
    serverId,
    data,
    onSaved,
}: {
    serverId: number;
    data: ServerDatabasesResponse;
    onSaved: () => Promise<unknown>;
}) => {
    const [hostId, setHostId] = useState(data.hosts[0] ? String(data.hosts[0].id) : '');
    const [database, setDatabase] = useState('');
    const [remote, setRemote] = useState('%');
    const [maxConnections, setMaxConnections] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [busy, setBusy] = useState<number>();
    const [confirm, setConfirm] = useState<ServerDatabase>();

    const create = async () => {
        setSubmitting(true);
        setErrors({});

        try {
            await createServerDatabase(serverId, {
                database,
                remote,
                max_connections: maxConnections,
                database_host_id: Number(hostId),
            });
            toast.success('Database created.');
            setDatabase('');
            setMaxConnections('');
            await onSaved();
        } catch (error) {
            setErrors(parseValidationErrors(error));
            toast.error(errorToMessage(error, 'Failed to create the database.'));
        } finally {
            setSubmitting(false);
        }
    };

    const reset = async (record: ServerDatabase) => {
        setBusy(record.id);

        try {
            await resetServerDatabasePassword(serverId, record.id);
            toast.success(`The password for ${record.database} has been reset.`);
        } catch (error) {
            toast.error(errorToMessage(error, 'Failed to reset the password.'));
        } finally {
            setBusy(undefined);
        }
    };

    const remove = async () => {
        if (!confirm) {
            return;
        }

        setBusy(confirm.id);

        try {
            await deleteServerDatabase(serverId, confirm.id);
            toast.success('Database deleted.');
            setConfirm(undefined);
            await onSaved();
        } catch (error) {
            toast.error(errorToMessage(error, 'Failed to delete the database.'));
        } finally {
            setBusy(undefined);
        }
    };

    return (
        <div className='grid grid-cols-1 gap-4 lg:grid-cols-12'>
            <div className='overflow-hidden rounded-xl border border-mocha-400 lg:col-span-7'>
                <div className='border-b border-mocha-400 px-4 py-3'>
                    <h2 className='text-sm font-semibold text-cream-50'>Active Databases</h2>
                </div>
                <div className='overflow-x-auto'>
                    <table className='w-full text-sm'>
                        <thead className='text-left text-xs uppercase tracking-wide text-cream-400/60'>
                            <tr className='border-b border-mocha-400'>
                                <th className='px-4 py-3'>Database</th>
                                <th className='px-4 py-3'>Username</th>
                                <th className='px-4 py-3'>Connections From</th>
                                <th className='px-4 py-3'>Host</th>
                                <th className='px-4 py-3'>Max Connections</th>
                                <th className='px-4 py-3' />
                            </tr>
                        </thead>
                        <tbody>
                            {data.data.map((record) => (
                                <tr key={record.id} className='border-b border-mocha-400/40'>
                                    <td className='px-4 py-3 text-cream-100'>{record.database}</td>
                                    <td className='px-4 py-3 text-cream-400/70'>{record.username}</td>
                                    <td className='px-4 py-3 text-cream-400/70'>{record.remote}</td>
                                    <td className='px-4 py-3'>
                                        <code className='text-xs text-cream-400/60'>
                                            {record.host?.host}:{record.host?.port}
                                        </code>
                                    </td>
                                    <td className='px-4 py-3 text-cream-100'>
                                        {record.max_connections ?? 'Unlimited'}
                                    </td>
                                    <td className='px-4 py-3'>
                                        <div className='flex justify-end gap-2'>
                                            <Button
                                                size='sm'
                                                variant='secondary'
                                                disabled={busy === record.id}
                                                onClick={() => void reset(record)}
                                            >
                                                Reset Password
                                            </Button>
                                            <Button
                                                size='sm'
                                                variant='attention'
                                                disabled={busy === record.id}
                                                onClick={() => setConfirm(record)}
                                            >
                                                Delete
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {data.data.length === 0 && (
                                <tr>
                                    <td colSpan={6} className='px-4 py-6 text-center text-cream-400/50'>
                                        This server has no databases.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className='lg:col-span-5'>
                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        void create();
                    }}
                    className={cardClass}
                >
                    <h2 className='text-sm font-semibold text-cream-50'>Create New Database</h2>

                    <Field
                        label='Database Host'
                        error={errors.database_host_id}
                        hint='The host server this database will be created on.'
                    >
                        <Dropdown
                            value={hostId}
                            onChange={setHostId}
                            placeholder='Select a host…'
                            options={data.hosts.map((host) => ({ value: String(host.id), label: host.name }))}
                        />
                    </Field>

                    <Field
                        label='Database Name'
                        error={errors.database}
                        hint={`The name is automatically prefixed with s${serverId}_.`}
                    >
                        <Input.Text
                            value={database}
                            placeholder='database'
                            onChange={(event) => setDatabase(event.target.value)}
                        />
                    </Field>

                    <Field
                        label='Connections From'
                        error={errors.remote}
                        hint='The IP connections are allowed from. Leave as % if unsure.'
                    >
                        <Input.Text value={remote} onChange={(event) => setRemote(event.target.value)} />
                    </Field>

                    <Field
                        label='Concurrent Connections'
                        error={errors.max_connections}
                        hint='Leave empty for unlimited.'
                    >
                        <Input.Text
                            type='number'
                            value={maxConnections}
                            onChange={(event) => setMaxConnections(event.target.value)}
                        />
                    </Field>

                    <div className='flex justify-end'>
                        <Button type='submit' disabled={submitting || !hostId}>
                            Create Database
                        </Button>
                    </div>
                </form>
            </div>

            <Dialog.Confirm
                open={!!confirm}
                title='Delete Database'
                confirm='Delete'
                loading={!!busy}
                onClose={() => setConfirm(undefined)}
                onConfirmed={remove}
            >
                Deleting {confirm?.database} is permanent and all data will be removed.
            </Dialog.Confirm>
        </div>
    );
};

const ServerDatabaseContainer = () => {
    const { id } = useParams<'id'>();
    const { data, mutate } = useServerDatabases(id);
    const { data: server } = useServer(id);

    if (!data || !server) {
        return (
            <div className='flex items-center justify-center py-16'>
                <Spinner centered size={Spinner.Size.LARGE} />
            </div>
        );
    }

    return (
        <div className='flex flex-col gap-4'>
            <div className='rounded-xl border border-hydro-500/40 bg-hydro-500/10 px-4 py-3 text-sm text-hydro-300'>
                Database passwords can be viewed when{' '}
                <a href={`/server/${server.uuid_short}/databases`} className='underline'>
                    visiting this server
                </a>{' '}
                on the front-end.
            </div>

            <DatabaseManager key={String(id)} serverId={Number(id)} data={data} onSaved={mutate} />
        </div>
    );
};

export default ServerDatabaseContainer;
