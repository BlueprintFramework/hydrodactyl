import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDebounce } from 'use-debounce';
import { useNodes } from '@/api/admin/useNodes';
import { Input } from '@/components/elements/inputs';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import PageContentBlock from '@/components/elements/PageContentBlock';
import PaginationFooter from '@/components/elements/table/PaginationFooter';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const formatBytes = (bytes: number): string => {
    if (!bytes) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${parseFloat((bytes / 1024 ** i).toFixed(1))} ${units[i]}`;
};

const barColor = (percent: number) =>
    percent >= 70 ? 'bg-brand-600' : percent >= 50 ? 'bg-brand-400' : 'bg-hydro-500';

const UsageBar = ({ percent, allocated, total }: { percent: number; allocated: number; total: number }) => (
    <div className='min-w-[120px]'>
        <div className='mb-1 flex justify-between text-xs text-cream-400/60'>
            <span>{percent}%</span>
            <span>
                {formatBytes(allocated)} / {formatBytes(total)}
            </span>
        </div>
        <div className='h-1.5 w-full overflow-hidden rounded-full bg-mocha-400'>
            <div
                className={cn('h-full rounded-full', barColor(percent))}
                style={{ width: `${Math.min(100, percent)}%` }}
            />
        </div>
    </div>
);

const NodesContainer = () => {
    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [search] = useDebounce(searchTerm, 300);

    const { data, isValidating } = useNodes({ page, search: search || undefined });
    const nodes = data?.items ?? [];

    return (
        <PageContentBlock title='Nodes'>
            <MainPageHeader direction='column' title='Nodes'>
                <p className='text-sm text-neutral-400'>All nodes available on the system.</p>
            </MainPageHeader>

            <div className='mb-4 flex flex-col gap-3 sm:flex-row sm:items-center'>
                <Input.Text
                    placeholder='Search nodes...'
                    value={searchTerm}
                    onChange={(event) => {
                        setSearchTerm(event.target.value);
                        setPage(1);
                    }}
                    className='w-full sm:max-w-sm'
                />
                <Button asChild className='sm:ml-auto'>
                    <Link to='/nodes/new'>Create Node</Link>
                </Button>
            </div>

            <div className='overflow-x-auto rounded-xl border border-mocha-400'>
                <table className='w-full text-sm'>
                    <thead className='text-left text-xs uppercase tracking-wide text-cream-400/60'>
                        <tr className='border-b border-mocha-400'>
                            <th className='px-4 py-3'>Name</th>
                            <th className='px-4 py-3'>Location</th>
                            <th className='px-4 py-3'>Memory</th>
                            <th className='px-4 py-3'>Disk</th>
                            <th className='px-4 py-3 text-center'>Servers</th>
                            <th className='px-4 py-3'>Daemon</th>
                        </tr>
                    </thead>
                    <tbody>
                        {nodes.map((node) => (
                            <tr key={node.id} className='border-b border-mocha-400/40 hover:bg-mocha-400/20'>
                                <td className='px-4 py-3'>
                                    <Link to={`/nodes/${node.id}`} className='text-cream-50 hover:text-hydro-400'>
                                        {node.name}
                                    </Link>
                                    {node.maintenance_mode && (
                                        <span className='ml-2 rounded-full bg-brand-400/20 px-2 py-0.5 text-[10px] font-semibold uppercase text-brand-400'>
                                            Maintenance
                                        </span>
                                    )}
                                </td>
                                <td className='px-4 py-3 text-cream-400/70'>{node.location?.short ?? '—'}</td>
                                <td className='px-4 py-3'>
                                    <UsageBar
                                        percent={node.memory_percent}
                                        allocated={node.allocated_memory}
                                        total={node.total_memory}
                                    />
                                </td>
                                <td className='px-4 py-3'>
                                    <UsageBar
                                        percent={node.disk_percent}
                                        allocated={node.allocated_disk}
                                        total={node.total_disk}
                                    />
                                </td>
                                <td className='px-4 py-3 text-center text-cream-100'>{node.servers_count}</td>
                                <td className='px-4 py-3 capitalize text-cream-400/70'>{node.daemonType}</td>
                            </tr>
                        ))}
                        {!isValidating && nodes.length === 0 && (
                            <tr>
                                <td colSpan={6} className='px-4 py-8 text-center text-cream-400/50'>
                                    No nodes found.
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

export default NodesContainer;
