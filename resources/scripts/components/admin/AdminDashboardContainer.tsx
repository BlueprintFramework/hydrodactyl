import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import useSWR from 'swr';

import { getAdminCounts, getPanelStatus, type PanelStatus } from '@/api/admin';
import { getMetricsHistory, type MetricsSample } from '@/api/admin/metrics';
import { type AdminServer, getServers } from '@/api/admin/servers';
import {
    ChartCard,
    type DashboardData,
    DashboardDataContext,
    DashboardGrid,
    type DashboardWidget,
    getWidgetType,
} from '@/components/admin/dashboard';
import { AdminErrorState } from '@/components/admin/shared/AdminErrorState';
import { SkeletonCards } from '@/components/admin/shared/AdminSkeleton';

/* ─────────────────────────── helpers ─────────────────────────── */

function formatBytes(bytes: number): string {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
}

function shortenOS(raw: string): string {
    const windowsMatch = raw.match(/Microsoft Windows (\d+)/i);
    if (windowsMatch) return `Windows ${windowsMatch[1]}`;

    const linuxMatch = raw.match(/^Linux\s+\S+\s+[\d.]+[-\s].*$/i);
    if (!linuxMatch) return raw.length > 40 ? `${raw.slice(0, 40)}…` : raw;

    const distroPatterns: [RegExp, string][] = [
        [/Ubuntu[\s/]+(\d+\.\d+(?:\.\d+)?)/i, 'Linux, Ubuntu $1'],
        [/Debian[\s/]+(\d+)/i, 'Linux, Debian $1'],
        [/CentOS[\s/]+(\d+)/i, 'Linux, CentOS $1'],
        [/Rocky[\s/]+(\d+)/i, 'Linux, Rocky $1'],
        [/AlmaLinux[\s/]+(\d+)/i, 'Linux, AlmaLinux $1'],
        [/Fedora[\s/]+(\d+)/i, 'Linux, Fedora $1'],
        [/Arch[\s_-]*Linux/i, 'Linux, Arch'],
        [/Alpine[\s/]+(\d+\.\d+)/i, 'Linux, Alpine $1'],
        [/RHEL[\s/]+(\d+)/i, 'Linux, RHEL $1'],
        [/SUSE[\s/]+(\d+\.\d+)/i, 'Linux, SUSE $1'],
        [/openSUSE[\s/]+(\d+\.\d+)/i, 'Linux, openSUSE $1'],
        [/Gentoo/i, 'Linux, Gentoo'],
        [/Manjaro/i, 'Linux, Manjaro'],
        [/NixOS[\s/]+(\d+\.\d+)/i, 'Linux, NixOS $1'],
        [/Void[\s_-]*Linux/i, 'Linux, Void'],
    ];

    for (const [re, fmt] of distroPatterns) {
        const m = raw.match(re);
        if (m) {
            let result = fmt;
            for (let i = 1; i < m.length; i++) {
                result = result.replace(`$${i}`, m[i]);
            }
            return result;
        }
    }

    const afterLinux = raw.replace(/^Linux\s+\S+\s+[\d.]+[-\s]*/i, '').trim();
    return afterLinux ? `Linux, ${afterLinux.split(/\s/).slice(0, 3).join(' ')}` : 'Linux';
}

/* ──────────────────────── status badge ──────────────────────── */

function ServerStatusBadge({ server }: { server: AdminServer }) {
    if (server.suspended) {
        return (
            <span className='inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium bg-yellow-900/40 text-yellow-400 border border-yellow-800/30'>
                <span className='h-1.5 w-1.5 rounded-full bg-yellow-400' />
                Suspended
            </span>
        );
    }
    if (!server.installed) {
        return (
            <span className='inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium bg-blue-900/40 text-blue-400 border border-blue-800/30'>
                <span className='h-1.5 w-1.5 rounded-full bg-blue-400' />
                Installing
            </span>
        );
    }
    return (
        <span className='inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium bg-emerald-900/40 text-emerald-400 border border-emerald-800/30'>
            <span className='h-1.5 w-1.5 rounded-full bg-emerald-400' />
            Active
        </span>
    );
}

/* ──────────────────────── default layout ──────────────────────── */

function buildDefaultWidgets(): DashboardWidget[] {
    return [
        { id: 'wh', typeId: 'resource-health', x: 0, y: 0, w: 6, h: 3 },
        { id: 'wi', typeId: 'system-info', x: 6, y: 0, w: 4, h: 3 },
        { id: 'wj', typeId: 'entity-distribution', x: 10, y: 0, w: 2, h: 3 },
        { id: 'wt', typeId: 'metrics-timeline', x: 0, y: 3, w: 8, h: 3 },
        { id: 'wu', typeId: 'uptime', x: 8, y: 3, w: 4, h: 3 },
    ];
}

/* ──────────────────────── widget renderer ──────────────────────── */

function WidgetRenderer({ widget }: { widget: DashboardWidget }) {
    const widgetType = getWidgetType(widget.typeId);
    if (!widgetType) return null;

    const WidgetComponent = widgetType.component;

    return (
        <ChartCard title={widgetType.title}>
            <WidgetComponent />
        </ChartCard>
    );
}

/* ──────────────────────── main component ──────────────────────── */

const AdminDashboardContainer = () => {
    const { data: status } = useSWR<PanelStatus>('admin:status', getPanelStatus, { refreshInterval: 30000 });

    const {
        data: counts,
        error: countsError,
        isLoading: countsLoading,
        mutate: mutateCounts,
    } = useSWR('admin:counts', getAdminCounts, { refreshInterval: 60000 });

    const {
        data: serversPage,
        error: serversError,
        isLoading: serversLoading,
        mutate: mutateServers,
    } = useSWR('admin:dashboard:servers', () => getServers({ page: 1 }));

    const { data: metricsHistory } = useSWR<MetricsSample[]>('admin:metrics:history', getMetricsHistory, {
        refreshInterval: 30000,
    });

    const defaultWidgets = useMemo(() => buildDefaultWidgets(), []);

    /* ── computed data ── */
    const serverCount = counts?.servers ?? 0;
    const nodeCount = counts?.nodes ?? 0;
    const userCount = counts?.users ?? 0;
    const locationCount = counts?.locations ?? 0;
    const nestCount = counts?.nests ?? 0;
    const bucketCount = counts?.buckets ?? 0;

    const cpuPct = status ? status.metrics.cpu : 0;
    const memPct =
        status && status.metrics.memory.total > 0
            ? (status.metrics.memory.used / status.metrics.memory.total) * 100
            : 0;
    const diskPct =
        status && status.metrics.disk.total > 0 ? (status.metrics.disk.used / status.metrics.disk.total) * 100 : 0;

    const dashboardData: DashboardData = useMemo(
        () => ({
            cpuPct,
            memPct,
            diskPct,
            memUsed: formatBytes(status?.metrics.memory.used ?? 0),
            memTotal: formatBytes(status?.metrics.memory.total ?? 0),
            diskUsed: formatBytes(status?.metrics.disk.used ?? 0),
            diskTotal: formatBytes(status?.metrics.disk.total ?? 0),
            loadAvg: status?.system.load_average ?? [0, 0, 0],
            uptimeSeconds: status?.metrics.uptime ?? 0,
            hostname: status?.system.hostname ?? '',
            os: status ? shortenOS(status.system.os) : '',
            phpVersion: status?.system.php_version ?? '',
            counts: {
                servers: serverCount,
                nodes: nodeCount,
                users: userCount,
                locations: locationCount,
                nests: nestCount,
                buckets: bucketCount,
            },
            timelineCpu: metricsHistory?.map((s) => s.cpu) ?? [],
            timelineMem:
                metricsHistory?.map((s) => (s.memory_total > 0 ? (s.memory_used / s.memory_total) * 100 : 0)) ?? [],
            timelineDisk: metricsHistory?.map((s) => (s.disk_total > 0 ? (s.disk_used / s.disk_total) * 100 : 0)) ?? [],
        }),
        [
            status,
            metricsHistory,
            serverCount,
            nodeCount,
            userCount,
            locationCount,
            nestCount,
            bucketCount,
            memPct,
            diskPct,
            cpuPct,
        ],
    );

    const items = serversPage?.items ?? [];
    const recentServers = [...items]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);

    return (
        <DashboardDataContext.Provider value={dashboardData}>
            <div className='space-y-4 sm:space-y-6 pb-20 lg:pb-10'>
                {/* ── page header ── */}
                <div>
                    <h1 className='text-3xl sm:text-[42px] font-extrabold leading-[98%] tracking-[-0.05rem] sm:tracking-[-0.1rem] text-cream-400'>
                        Overview
                    </h1>
                    <p className='text-xs sm:text-sm text-mocha-100/60'>Panel health, resources, and quick access</p>
                </div>

                {/* ── loading / error states for initial data ── */}
                {countsError ? (
                    <AdminErrorState
                        message='Failed to load entity counts.'
                        onRetry={() => mutateCounts()}
                        className='rounded-xl'
                    />
                ) : !counts && countsLoading ? (
                    <SkeletonCards count={6} />
                ) : null}

                {/* ── dashboard grid ── */}
                <DashboardGrid widgets={defaultWidgets}>{(widget) => <WidgetRenderer widget={widget} />}</DashboardGrid>

                {/* ── recent servers ── */}
                <div>
                    <div className='flex items-end justify-between mb-3 sm:mb-5'>
                        <div>
                            <h2 className='text-sm sm:text-base font-bold text-cream-400'>Recent Servers</h2>
                            <p className='text-[10px] sm:text-xs text-mocha-100/60 mt-0.5 sm:mt-1'>
                                Latest deployments
                            </p>
                        </div>
                        <Link
                            to='/admin/servers'
                            className='text-[10px] sm:text-xs text-mocha-200 hover:text-cream-400 transition-colors'
                        >
                            View all →
                        </Link>
                    </div>
                    <div className='rounded-xl border border-mocha-400 bg-mocha-500 overflow-hidden'>
                        {serversError ? (
                            <AdminErrorState
                                message='Failed to load recent servers.'
                                onRetry={() => mutateServers()}
                                className='rounded-xl'
                            />
                        ) : !serversPage && serversLoading ? (
                            <div className='divide-y divide-mocha-400'>
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className='flex items-center gap-3 sm:gap-4 px-3 sm:px-5 py-3 sm:py-4 animate-pulse'
                                    >
                                        <div className='h-3 w-24 sm:w-32 rounded bg-mocha-400/30' />
                                        <div className='h-3 w-16 sm:w-20 rounded bg-mocha-400/20' />
                                        <div className='ml-auto h-5 w-14 sm:w-16 rounded bg-mocha-400/20' />
                                    </div>
                                ))}
                            </div>
                        ) : recentServers.length === 0 ? (
                            <div className='py-8 sm:py-12 text-center text-mocha-100/50 text-xs sm:text-sm'>
                                No servers yet.{' '}
                                <Link to='/admin/servers' className='text-cream-400 hover:underline'>
                                    Create one
                                </Link>
                            </div>
                        ) : (
                            <>
                                {/* ── mobile card layout ── */}
                                <div className='sm:hidden divide-y divide-mocha-400'>
                                    {recentServers.map((server) => (
                                        <Link
                                            key={server.id}
                                            to={`/admin/servers/${server.id}`}
                                            className='flex items-center justify-between px-3 py-3 hover:bg-mocha-400/20 transition-colors duration-150'
                                        >
                                            <div className='min-w-0 flex-1'>
                                                <p className='text-sm font-medium text-cream-400 truncate'>
                                                    {server.name}
                                                </p>
                                                <p className='text-[10px] text-mocha-100/50 font-mono mt-0.5'>
                                                    {server.userName ?? `UID ${server.user}`}
                                                </p>
                                            </div>
                                            <div className='shrink-0 ml-3'>
                                                <ServerStatusBadge server={server} />
                                            </div>
                                        </Link>
                                    ))}
                                </div>

                                {/* ── desktop table layout ── */}
                                <table className='w-full text-sm hidden sm:table' id='recent-servers-table'>
                                    <thead>
                                        <tr className='border-b border-mocha-400 text-left'>
                                            <th className='px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-mocha-100/50'>
                                                Name
                                            </th>
                                            <th className='px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-mocha-100/50 hidden md:table-cell'>
                                                Owner
                                            </th>
                                            <th className='px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-mocha-100/50 hidden lg:table-cell'>
                                                Resources
                                            </th>
                                            <th className='px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-mocha-100/50'>
                                                Status
                                            </th>
                                            <th className='px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-mocha-100/50 hidden xl:table-cell'>
                                                Created
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className='divide-y divide-mocha-400'>
                                        {recentServers.map((server) => (
                                            <tr
                                                key={server.id}
                                                className='hover:bg-mocha-400/20 transition-colors duration-150'
                                            >
                                                <td className='px-5 py-4'>
                                                    <Link
                                                        to={`/admin/servers/${server.id}`}
                                                        className='font-medium text-cream-400 hover:text-cream-200 transition-colors'
                                                    >
                                                        {server.name}
                                                    </Link>
                                                    <p className='text-xs text-mocha-100/50 font-mono mt-0.5'>
                                                        {server.shortUuid}
                                                    </p>
                                                </td>
                                                <td className='px-5 py-4 text-mocha-100/70 hidden md:table-cell'>
                                                    {server.userName ?? `UID ${server.user}`}
                                                </td>
                                                <td className='px-5 py-4 text-mocha-100/60 text-xs font-mono hidden lg:table-cell'>
                                                    {server.memory === 0 ? '∞' : `${server.memory} MB`} RAM ·{' '}
                                                    {server.disk === 0 ? '∞' : `${server.disk} MB`} Disk
                                                </td>
                                                <td className='px-5 py-4'>
                                                    <ServerStatusBadge server={server} />
                                                </td>
                                                <td className='px-5 py-4 text-xs text-mocha-100/50 hidden xl:table-cell'>
                                                    {new Date(server.createdAt).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </DashboardDataContext.Provider>
    );
};

export default AdminDashboardContainer;
