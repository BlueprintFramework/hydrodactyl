import { Link, useParams } from 'react-router-dom';
import { useBucketServers } from '@/api/admin/useBuckets';
import Spinner from '@/components/elements/Spinner';
import { useTranslation } from '@/i18n/I18nProvider';

const BucketServersContainer = () => {
    const { t } = useTranslation();
    const { id } = useParams<'id'>();
    const { data } = useBucketServers(id);

    if (!data) {
        return (
            <div className='flex items-center justify-center py-16'>
                <Spinner centered size={Spinner.Size.LARGE} />
            </div>
        );
    }

    return (
        <div className='overflow-x-auto rounded-xl border border-mocha-400'>
            <table className='w-full text-sm'>
                <thead className='text-left text-xs uppercase tracking-wide text-cream-400/60'>
                    <tr className='border-b border-mocha-400'>
                        <th className='px-4 py-3'>{t('admin.common.id')}</th>
                        <th className='px-4 py-3'>{t('admin.servers.server_name')}</th>
                        <th className='px-4 py-3'>{t('admin.servers.owner')}</th>
                        <th className='px-4 py-3'>{t('admin.buckets.service')}</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((server) => (
                        <tr key={server.id} className='border-b border-mocha-400/40'>
                            <td className='px-4 py-3 font-mono text-cream-400/60'>{server.uuid_short}</td>
                            <td className='px-4 py-3'>
                                <Link to={`/servers/${server.id}`} className='text-cream-50 hover:text-hydro-400'>
                                    {server.name}
                                </Link>
                            </td>
                            <td className='px-4 py-3'>
                                {server.owner ? (
                                    <Link
                                        to={`/users/${server.owner.id}`}
                                        className='text-cream-50 hover:text-hydro-400'
                                    >
                                        {server.owner.username}
                                    </Link>
                                ) : (
                                    t('common.not_available')
                                )}
                            </td>
                            <td className='px-4 py-3 text-cream-400/70'>
                                {server.nest ?? t('common.not_available')} ({server.egg ?? t('common.not_available')})
                            </td>
                        </tr>
                    ))}
                    {data.length === 0 && (
                        <tr>
                            <td colSpan={4} className='px-4 py-6 text-center text-cream-400/50'>
                                {t('admin.buckets.no_servers')}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default BucketServersContainer;
