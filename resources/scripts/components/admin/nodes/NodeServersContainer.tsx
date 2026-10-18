import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useNodeServers } from '@/api/admin/useNodes';
import Spinner from '@/components/elements/Spinner';
import PaginationFooter from '@/components/elements/table/PaginationFooter';
import { useTranslation } from '@/i18n/I18nProvider';

const NodeServersContainer = () => {
    const { t } = useTranslation();
    const { id } = useParams<'id'>();
    const [page, setPage] = useState(1);
    const { data } = useNodeServers(id, page);

    if (!data) {
        return (
            <div className='flex items-center justify-center py-16'>
                <Spinner centered size={Spinner.Size.LARGE} />
            </div>
        );
    }

    return (
        <div className='space-y-4'>
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
                        {data.items.map((server) => (
                            <tr key={server.id} className='border-b border-mocha-400/40'>
                                <td className='px-4 py-3 font-mono text-cream-400/60'>{server.uuidShort}</td>
                                <td className='px-4 py-3'>
                                    <a
                                        href={`/admin/servers/${server.id}`}
                                        className='text-cream-50 hover:text-hydro-400'
                                    >
                                        {server.name}
                                    </a>
                                </td>
                                <td className='px-4 py-3'>
                                    {server.owner && (
                                        <Link
                                            to={`/users/${server.owner.id}`}
                                            className='text-cream-50 hover:text-hydro-400'
                                        >
                                            {server.owner.username} ({server.owner.email})
                                        </Link>
                                    )}
                                </td>
                                <td className='px-4 py-3 text-cream-400/70'>
                                    {server.nest} ({server.egg})
                                </td>
                            </tr>
                        ))}
                        {data.items.length === 0 && (
                            <tr>
                                <td colSpan={4} className='px-4 py-8 text-center text-cream-400/50'>
                                    {t('admin.nodes.no_servers')}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {data.pagination.total > 0 && <PaginationFooter pagination={data.pagination} onPageSelect={setPage} />}
        </div>
    );
};

export default NodeServersContainer;
