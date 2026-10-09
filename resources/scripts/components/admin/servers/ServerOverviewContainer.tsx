import { Link, useParams } from 'react-router-dom';
import { useServer } from '@/api/admin/useServers';
import Spinner from '@/components/elements/Spinner';

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <tr className='border-b border-mocha-400/40 last:border-0'>
        <td className='w-1/3 px-4 py-3 text-cream-400/70'>{label}</td>
        <td className='px-4 py-3 text-cream-100'>{children}</td>
    </tr>
);

const cardClass = 'rounded-xl border border-mocha-400 bg-mocha-500 p-4';

const ServerOverviewContainer = () => {
    const { id } = useParams<'id'>();
    const { data: server } = useServer(id);

    if (!server) {
        return (
            <div className='flex items-center justify-center py-16'>
                <Spinner centered size={Spinner.Size.LARGE} />
            </div>
        );
    }

    const swap = server.swap === 0 ? 'Not Set' : server.swap === -1 ? 'Unlimited' : `${server.swap}MiB`;

    return (
        <div className='grid grid-cols-1 gap-4 lg:grid-cols-3'>
            <div className='overflow-hidden rounded-xl border border-mocha-400 lg:col-span-2'>
                <table className='w-full text-sm'>
                    <tbody>
                        <Row label='Internal Identifier'>
                            <code>{server.id}</code>
                        </Row>
                        <Row label='External Identifier'>
                            {server.external_id ? (
                                <code>{server.external_id}</code>
                            ) : (
                                <span className='text-cream-400/50'>Not Set</span>
                            )}
                        </Row>
                        <Row label='UUID / Docker Container ID'>
                            <code className='text-xs'>{server.uuid}</code>
                        </Row>
                        <Row label='Current Egg'>
                            {server.nest?.name} :: {server.egg?.name}
                        </Row>
                        <Row label='Server Name'>{server.name}</Row>
                        <Row label='CPU Limit'>
                            {server.cpu === 0 ? <code>Unlimited</code> : <code>{server.cpu}%</code>}
                        </Row>
                        <Row label='CPU Pinning'>
                            {server.threads ? (
                                <code>{server.threads}</code>
                            ) : (
                                <span className='text-cream-400/50'>Not Set</span>
                            )}
                        </Row>
                        <Row label='Memory'>
                            {server.memory === 0 ? <code>Unlimited</code> : <code>{server.memory}MiB</code>}
                            <span className='px-2 text-cream-400/40'>/</span>
                            <code>{swap}</code>
                        </Row>
                        <Row label='Disk Space'>
                            {server.disk === 0 ? <code>Unlimited</code> : <code>{server.disk}MiB</code>}
                        </Row>
                        <Row label='Block IO Weight'>
                            <code>{server.io}</code>
                        </Row>
                        <Row label='Default Connection'>
                            {server.allocation ? (
                                <code>
                                    {server.allocation.ip}:{server.allocation.port}
                                </code>
                            ) : (
                                <span className='text-cream-400/50'>Not Set</span>
                            )}
                        </Row>
                        <Row label='Connection Alias'>
                            {server.allocation && server.allocation.alias !== server.allocation.ip ? (
                                <code>
                                    {server.allocation.alias}:{server.allocation.port}
                                </code>
                            ) : (
                                <span className='text-cream-400/50'>No Alias Assigned</span>
                            )}
                        </Row>
                    </tbody>
                </table>
            </div>

            <div className='flex flex-col gap-4'>
                {server.is_suspended && (
                    <div className='rounded-xl border border-brand-400/40 bg-brand-400/10 p-4'>
                        <h3 className='text-lg font-semibold text-brand-400'>Suspended</h3>
                    </div>
                )}

                {!server.is_installed && (
                    <div className='rounded-xl border border-hydro-500/40 bg-hydro-500/10 p-4'>
                        <h3 className='text-lg font-semibold text-hydro-400'>Installing</h3>
                    </div>
                )}

                {server.owner && (
                    <div className={cardClass}>
                        <h3 className='truncate text-lg font-semibold text-cream-50'>{server.owner.username}</h3>
                        <p className='mt-1 text-xs text-cream-400/60'>{server.owner.email}</p>
                        <p className='text-xs text-cream-400/60'>Server Owner</p>
                        <Link
                            to={`/users/${server.owner.id}`}
                            className='mt-3 inline-block text-sm text-hydro-400 hover:text-hydro-300'
                        >
                            More info →
                        </Link>
                    </div>
                )}

                {server.node && (
                    <div className={cardClass}>
                        <h3 className='truncate text-lg font-semibold text-cream-50'>{server.node.name}</h3>
                        <p className='mt-1 text-xs text-cream-400/60'>Server Node</p>
                        <Link
                            to={`/nodes/${server.node.id}`}
                            className='mt-3 inline-block text-sm text-hydro-400 hover:text-hydro-300'
                        >
                            More info →
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ServerOverviewContainer;
