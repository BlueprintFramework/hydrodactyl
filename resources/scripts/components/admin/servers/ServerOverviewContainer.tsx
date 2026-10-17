import { Link, useParams } from 'react-router-dom';
import { useServer } from '@/api/admin/useServers';
import Spinner from '@/components/elements/Spinner';
import { useTranslation } from '@/i18n/I18nProvider';

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <tr className='border-b border-mocha-400/40 last:border-0'>
        <td className='w-1/3 px-4 py-3 text-cream-400/70'>{label}</td>
        <td className='px-4 py-3 text-cream-100'>{children}</td>
    </tr>
);

const cardClass = 'rounded-xl border border-mocha-400 bg-mocha-500 p-4';

const ServerOverviewContainer = () => {
    const { t } = useTranslation();
    const { id } = useParams<'id'>();
    const { data: server } = useServer(id);

    if (!server) {
        return (
            <div className='flex items-center justify-center py-16'>
                <Spinner centered size={Spinner.Size.LARGE} />
            </div>
        );
    }

    const swap =
        server.swap === 0
            ? t('admin.servers.not_set')
            : server.swap === -1
              ? t('admin.common.unlimited')
              : `${server.swap}MiB`;

    return (
        <div className='grid grid-cols-1 gap-4 lg:grid-cols-3'>
            <div className='overflow-hidden rounded-xl border border-mocha-400 lg:col-span-2'>
                <table className='w-full text-sm'>
                    <tbody>
                        <Row label={t('admin.servers.internal_identifier')}>
                            <code>{server.id}</code>
                        </Row>
                        <Row label={t('admin.servers.external_identifier')}>
                            {server.external_id ? (
                                <code>{server.external_id}</code>
                            ) : (
                                <span className='text-cream-400/50'>{t('admin.servers.not_set')}</span>
                            )}
                        </Row>
                        <Row label={t('admin.servers.uuid_container')}>
                            <code className='text-xs'>{server.uuid}</code>
                        </Row>
                        <Row label={t('admin.servers.current_egg')}>
                            {server.nest?.name} :: {server.egg?.name}
                        </Row>
                        <Row label={t('admin.servers.server_name')}>{server.name}</Row>
                        <Row label={t('admin.servers.cpu_limit')}>
                            {server.cpu === 0 ? <code>{t('admin.common.unlimited')}</code> : <code>{server.cpu}%</code>}
                        </Row>
                        <Row label={t('admin.servers.cpu_pinning')}>
                            {server.threads ? (
                                <code>{server.threads}</code>
                            ) : (
                                <span className='text-cream-400/50'>{t('admin.servers.not_set')}</span>
                            )}
                        </Row>
                        <Row label={t('admin.common.memory')}>
                            {server.memory === 0 ? (
                                <code>{t('admin.common.unlimited')}</code>
                            ) : (
                                <code>{server.memory}MiB</code>
                            )}
                            <span className='px-2 text-cream-400/40'>/</span>
                            <code>{swap}</code>
                        </Row>
                        <Row label={t('admin.servers.disk_space')}>
                            {server.disk === 0 ? (
                                <code>{t('admin.common.unlimited')}</code>
                            ) : (
                                <code>{server.disk}MiB</code>
                            )}
                        </Row>
                        <Row label={t('admin.servers.block_io')}>
                            <code>{server.io}</code>
                        </Row>
                        <Row label={t('admin.servers.default_connection')}>
                            {server.allocation ? (
                                <code>
                                    {server.allocation.ip}:{server.allocation.port}
                                </code>
                            ) : (
                                <span className='text-cream-400/50'>{t('admin.servers.not_set')}</span>
                            )}
                        </Row>
                        <Row label={t('admin.servers.connection_alias')}>
                            {server.allocation && server.allocation.alias !== server.allocation.ip ? (
                                <code>
                                    {server.allocation.alias}:{server.allocation.port}
                                </code>
                            ) : (
                                <span className='text-cream-400/50'>{t('admin.servers.no_alias')}</span>
                            )}
                        </Row>
                    </tbody>
                </table>
            </div>

            <div className='flex flex-col gap-4'>
                {server.is_suspended && (
                    <div className='rounded-xl border border-brand-400/40 bg-brand-400/10 p-4'>
                        <h3 className='text-lg font-semibold text-brand-400'>{t('admin.servers.suspended')}</h3>
                    </div>
                )}

                {!server.is_installed && (
                    <div className='rounded-xl border border-hydro-500/40 bg-hydro-500/10 p-4'>
                        <h3 className='text-lg font-semibold text-hydro-400'>{t('admin.servers.installing')}</h3>
                    </div>
                )}

                {server.owner && (
                    <div className={cardClass}>
                        <h3 className='truncate text-lg font-semibold text-cream-50'>{server.owner.username}</h3>
                        <p className='mt-1 text-xs text-cream-400/60'>{server.owner.email}</p>
                        <p className='text-xs text-cream-400/60'>{t('admin.servers.server_owner')}</p>
                        <Link
                            to={`/users/${server.owner.id}`}
                            className='mt-3 inline-block text-sm text-hydro-400 hover:text-hydro-300'
                        >
                            {t('admin.servers.more_info')}
                        </Link>
                    </div>
                )}

                {server.node && (
                    <div className={cardClass}>
                        <h3 className='truncate text-lg font-semibold text-cream-50'>{server.node.name}</h3>
                        <p className='mt-1 text-xs text-cream-400/60'>{t('admin.servers.server_node')}</p>
                        <Link
                            to={`/nodes/${server.node.id}`}
                            className='mt-3 inline-block text-sm text-hydro-400 hover:text-hydro-300'
                        >
                            {t('admin.servers.more_info')}
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ServerOverviewContainer;
