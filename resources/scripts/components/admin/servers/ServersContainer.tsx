import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDebounce } from 'use-debounce';
import type { AdminServer } from '@/api/admin/servers';
import { useServers } from '@/api/admin/useServers';
import { Input } from '@/components/elements/inputs';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import PageContentBlock from '@/components/elements/PageContentBlock';
import PaginationFooter from '@/components/elements/table/PaginationFooter';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/I18nProvider';
import { cn } from '@/lib/utils';

const StatusBadge = ({ server }: { server: AdminServer }) => {
    const { t } = useTranslation();

    if (server.is_suspended) {
        return (
            <span className='rounded-full bg-brand-400/20 px-2 py-0.5 text-[10px] font-semibold uppercase text-brand-400'>
                {t('admin.servers.suspended')}
            </span>
        );
    }

    if (!server.is_installed) {
        return (
            <span className='rounded-full bg-cream-400/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-cream-300'>
                {t('admin.servers.installing')}
            </span>
        );
    }

    return (
        <span className='rounded-full bg-hydro-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase text-hydro-400'>
            {t('admin.servers.active')}
        </span>
    );
};

const ServersContainer = () => {
    const { t } = useTranslation();
    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [search] = useDebounce(searchTerm, 300);

    const { data, isValidating } = useServers({ page, search: search || undefined });
    const servers = data?.items ?? [];

    return (
        <PageContentBlock title={t('admin.nav.servers')}>
            <MainPageHeader direction='column' title={t('admin.nav.servers')}>
                <p className='text-sm text-neutral-400'>{t('admin.servers.description')}</p>
            </MainPageHeader>

            <div className='mb-4 flex flex-col gap-3 sm:flex-row sm:items-center'>
                <Input.Text
                    placeholder={t('admin.servers.search_placeholder')}
                    value={searchTerm}
                    onChange={(event) => {
                        setSearchTerm(event.target.value);
                        setPage(1);
                    }}
                    className='w-full sm:max-w-sm'
                />
                <Button asChild className='sm:ml-auto'>
                    <Link to='/servers/new'>{t('admin.servers.create')}</Link>
                </Button>
            </div>

            <div className='overflow-x-auto rounded-xl border border-mocha-400'>
                <table className='w-full text-sm'>
                    <thead className='text-left text-xs uppercase tracking-wide text-cream-400/60'>
                        <tr className='border-b border-mocha-400'>
                            <th className='px-4 py-3'>{t('admin.servers.server_name')}</th>
                            <th className='px-4 py-3'>{t('admin.servers.uuid')}</th>
                            <th className='px-4 py-3'>{t('admin.servers.owner')}</th>
                            <th className='px-4 py-3'>{t('admin.common.node')}</th>
                            <th className='px-4 py-3'>{t('admin.servers.connection')}</th>
                            <th className='px-4 py-3 text-center'>{t('admin.common.status')}</th>
                            <th className='px-4 py-3' />
                        </tr>
                    </thead>
                    <tbody>
                        {servers.map((server) => (
                            <tr key={server.id} className='border-b border-mocha-400/40 hover:bg-mocha-400/20'>
                                <td className='px-4 py-3'>
                                    <Link to={`/servers/${server.id}`} className='text-cream-50 hover:text-hydro-400'>
                                        {server.name}
                                    </Link>
                                </td>
                                <td className='px-4 py-3'>
                                    <code className='text-xs text-cream-400/60' title={server.uuid}>
                                        {server.uuid}
                                    </code>
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
                                <td className='px-4 py-3'>
                                    {server.node && (
                                        <Link
                                            to={`/nodes/${server.node.id}`}
                                            className='text-cream-50 hover:text-hydro-400'
                                        >
                                            {server.node.name}
                                        </Link>
                                    )}
                                </td>
                                <td className='px-4 py-3'>
                                    {server.allocation && (
                                        <code className='text-xs text-cream-400/70'>
                                            {server.allocation.alias}:{server.allocation.port}
                                        </code>
                                    )}
                                </td>
                                <td className='px-4 py-3 text-center'>
                                    <div className='flex flex-col items-center gap-1'>
                                        <StatusBadge server={server} />
                                        {server.exclude_from_resource_calculation && (
                                            <span
                                                className='rounded-full bg-mocha-300 px-2 py-0.5 text-[10px] uppercase text-cream-400'
                                                title={t('admin.servers.excluded_title')}
                                            >
                                                {t('admin.servers.excluded')}
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className='px-4 py-3 text-center'>
                                    <a
                                        href={`/server/${server.uuid_short}`}
                                        className={cn(
                                            'rounded-lg border border-mocha-300 bg-mocha-400 px-2 py-1 text-xs text-cream-400',
                                            'hover:bg-mocha-300',
                                        )}
                                    >
                                        {t('admin.servers.console_link')}
                                    </a>
                                </td>
                            </tr>
                        ))}
                        {!isValidating && servers.length === 0 && (
                            <tr>
                                <td colSpan={7} className='px-4 py-8 text-center text-cream-400/50'>
                                    {t('admin.servers.empty')}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {data && data.pagination.total > 0 && (
                <PaginationFooter pagination={data.pagination} onPageSelect={setPage} className='mt-4' />
            )}
        </PageContentBlock>
    );
};

export default ServersContainer;
