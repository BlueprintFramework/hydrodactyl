import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDebounce } from 'use-debounce';
import type { AdminNode } from '@/api/admin/nodes';
import { useNodeStatus, useNodes } from '@/api/admin/useNodes';
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

const StatusIndicator = ({ state, title }: { state: 'checking' | 'up' | 'down'; title: string }) => {
    if (state === 'checking') {
        return (
            <span className='inline-flex items-center gap-1.5 text-xs text-cream-400/50'>
                <span className='h-2 w-2 animate-pulse rounded-full bg-cream-400/40' />
                Checking
            </span>
        );
    }

    const up = state === 'up';

    return (
        <span
            title={title}
            className={cn(
                'inline-flex items-center gap-1.5 text-xs font-medium',
                up ? 'text-hydro-400' : 'text-brand-400',
            )}
        >
            <span className={cn('h-2 w-2 rounded-full', up ? 'bg-hydro-500' : 'bg-brand-400')} />
            {up ? 'Up' : 'Down'}
        </span>
    );
};

/**
 * Probe the daemon from the visitor's browser. A no-cors request resolves for
 * any HTTP response (even a 401) and only rejects when the connection itself
 * fails, which is exactly the reachability signal we want — and it keeps the
 * daemon's secret out of the page.
 */
const useBrowserReachability = (url: string): 'checking' | 'up' | 'down' => {
    const [state, setState] = useState<'checking' | 'up' | 'down'>('checking');

    useEffect(() => {
        let active = true;

        const probe = async () => {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 5000);

            try {
                await fetch(url, { mode: 'no-cors', cache: 'no-store', signal: controller.signal });
                if (active) setState('up');
            } catch {
                if (active) setState('down');
            } finally {
                clearTimeout(timeout);
            }
        };

        probe();
        const interval = setInterval(probe, 15000);

        return () => {
            active = false;
            clearInterval(interval);
        };
    }, [url]);

    return state;
};

const BrowserStatus = ({ node }: { node: AdminNode }) => {
    const state = useBrowserReachability(`${node.scheme}://${node.fqdn}:${node.daemonListen}/api/system`);

    return (
        <StatusIndicator
            state={state}
            title={
                state === 'down'
                    ? 'Your browser could not reach the daemon. It may be offline, unreachable from this network, or blocked as mixed content.'
                    : 'Your browser opened a connection to the daemon.'
            }
        />
    );
};

const ServerStatus = ({ id }: { id: number }) => {
    const { data } = useNodeStatus(id);

    return (
        <StatusIndicator
            state={!data ? 'checking' : data.up ? 'up' : 'down'}
            title={
                !data
                    ? 'Checking daemon reachability from the panel...'
                    : data.up
                      ? data.version
                          ? `The panel reached the daemon (v${data.version}).`
                          : 'The panel reached the daemon.'
                      : (data.error ?? 'The panel could not reach the daemon.')
            }
        />
    );
};

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
                            <th className='px-4 py-3'>Browser</th>
                            <th className='px-4 py-3'>Server</th>
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
                                    <BrowserStatus node={node} />
                                </td>
                                <td className='px-4 py-3'>
                                    <ServerStatus id={node.id} />
                                </td>
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
                                <td colSpan={8} className='px-4 py-8 text-center text-cream-400/50'>
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
