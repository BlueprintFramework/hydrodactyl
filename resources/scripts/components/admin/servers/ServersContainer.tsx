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
import { cn } from '@/lib/utils';

const StatusBadge = ({ server }: { server: AdminServer }) => {
    if (server.is_suspended) {
        return (
            <span className='rounded-full bg-brand-400/20 px-2 py-0.5 text-[10px] font-semibold uppercase text-brand-400'>
                Suspended
            </span>
        );
    }

    if (!server.is_installed) {
        return (
            <span className='rounded-full bg-cream-400/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-cream-300'>
                Installing
            </span>
        );
    }

    return (
        <span className='rounded-full bg-hydro-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase text-hydro-400'>
            Active
        </span>
    );
};

const ServersContainer = () => {
    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [search] = useDebounce(searchTerm, 300);

    const { data, isValidating } = useServers({ page, search: search || undefined });
    const servers = data?.items ?? [];

    return (
        <PageContentBlock title='Servers'>
            <MainPageHeader direction='column' title='Servers'>
                <p className='text-sm text-neutral-400'>All servers available on the system.</p>
            </MainPageHeader>

            <div className='mb-4 flex flex-col gap-3 sm:flex-row sm:items-center'>
                <Input.Text
                    placeholder='Search servers...'
                    value={searchTerm}
                    onChange={(event) => {
                        setSearchTerm(event.target.value);
                        setPage(1);
                    }}
                    className='w-full sm:max-w-sm'
                />
                <Button asChild className='sm:ml-auto'>
                    <a href='/admin/servers/new'>Create Server</a>
                </Button>
            </div>

            <div className='overflow-x-auto rounded-xl border border-mocha-400'>
                <table className='w-full text-sm'>
                    <thead className='text-left text-xs uppercase tracking-wide text-cream-400/60'>
                        <tr className='border-b border-mocha-400'>
                            <th className='px-4 py-3'>Server Name</th>
                            <th className='px-4 py-3'>UUID</th>
                            <th className='px-4 py-3'>Owner</th>
                            <th className='px-4 py-3'>Node</th>
                            <th className='px-4 py-3'>Connection</th>
                            <th className='px-4 py-3 text-center'>Status</th>
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
                                                title='Excluded from resource calculations'
                                            >
                                                Excluded
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
                                        Console
                                    </a>
                                </td>
                            </tr>
                        ))}
                        {!isValidating && servers.length === 0 && (
                            <tr>
                                <td colSpan={7} className='px-4 py-8 text-center text-cream-400/50'>
                                    No servers found.
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
