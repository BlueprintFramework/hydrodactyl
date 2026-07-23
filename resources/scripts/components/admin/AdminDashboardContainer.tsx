import {
    Activity02Icon,
    Archive01Icon,
    CubeIcon,
    Database02Icon,
    GlobalIcon,
    ServerStack02Icon,
    UserMultiple02Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import useSWR from 'swr';

import { getAdminCounts, getPanelStatus, type PanelStatus } from '@/api/admin';
import { type AdminServer, getServers } from '@/api/admin/servers';
import { SkeletonCards } from '@/components/admin/shared/AdminSkeleton';

/* ─────────────────────────── helpers ─────────────────────────── */

function formatBytes(bytes: number): string {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
}

function formatUptime(seconds: number): string {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
}

function formatRelativeTime(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
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

/* ──────────────────────── count-up hook ──────────────────────── */

function useCountUp(target: number, duration = 900): number {
    const [value, setValue] = useState(0);
    const frameRef = useRef<number>(0);

    useEffect(() => {
        if (target === 0) {
            setValue(0);
            return;
        }
        const start = performance.now();
        const tick = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - (1 - progress) ** 3;
            setValue(Math.floor(eased * target));
            if (progress < 1) frameRef.current = requestAnimationFrame(tick);
        };
        frameRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frameRef.current);
    }, [target, duration]);

    return value;
}

/* ──────────────────────── svg gauge ──────────────────────── */

function gaugeColor(pct: number): string {
    if (pct >= 80) return '#f87171';
    if (pct >= 60) return '#fbbf24';
    return '#34d399';
}

function SvgGauge({ percent, label, sub }: { percent: number; label: string; sub: string }) {
    const color = gaugeColor(percent);
    const radius = 44;
    const stroke = 8;
    const startAngle = -225;
    const endAngle = 45;
    const totalAngle = endAngle - startAngle;
    const circumference = 2 * Math.PI * radius;
    const arcLength = (totalAngle / 360) * circumference;
    const fillLength = (Math.max(percent, 0.5) / 100) * arcLength;

    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const cx = 50;
    const cy = 50;

    const x1 = cx + radius * Math.cos(toRad(startAngle));
    const y1 = cy + radius * Math.sin(toRad(startAngle));
    const x2 = cx + radius * Math.cos(toRad(endAngle));
    const y2 = cy + radius * Math.sin(toRad(endAngle));

    const bgD = `M ${x1} ${y1} A ${radius} ${radius} 0 1 1 ${x2} ${y2}`;

    return (
        <div className='flex flex-col items-center gap-2'>
            <div className='relative' style={{ width: 120, height: 100 }}>
                <svg viewBox='0 0 100 85' className='w-full h-full' role='presentation'>
                    <path d={bgD} fill='none' stroke='#3f3f46' strokeWidth={stroke} strokeLinecap='round' />
                    <path
                        d={bgD}
                        fill='none'
                        stroke={color}
                        strokeWidth={stroke}
                        strokeLinecap='round'
                        strokeDasharray={`${fillLength} ${arcLength}`}
                        className='transition-all duration-1000 ease-out'
                    />
                </svg>
                <div className='absolute inset-0 flex items-center justify-center pb-2'>
                    <span className='text-xl font-bold text-cream-400 tabular-nums leading-none'>
                        {Math.round(percent)}%
                    </span>
                </div>
            </div>
            <div className='text-center'>
                <p className='text-sm font-semibold text-cream-400'>{label}</p>
                <p className='text-xs text-mocha-100/60'>{sub}</p>
            </div>
        </div>
    );
}

/* ──────────────────────── load sparkline ──────────────────────── */

function LoadSparkline({ loads }: { loads: number[] }) {
    const max = Math.max(...loads, 1);
    return (
        <div className='flex items-end gap-1.5 h-12'>
            {loads.map((v, i) => {
                const pct = (v / max) * 100;
                const color = v > 2 ? '#f87171' : v > 1 ? '#fbbf24' : '#34d399';
                return (
                    <div key={i} className='flex-1 flex flex-col items-center gap-1'>
                        <div
                            className='w-full rounded-sm transition-all duration-700'
                            style={{ height: `${Math.max(pct, 8)}%`, backgroundColor: color }}
                        />
                        <span className='text-[9px] text-mocha-100/40'>{i + 1}m</span>
                    </div>
                );
            })}
        </div>
    );
}

/* ──────────────────────── live uptime ticker ──────────────────────── */

function UptimeTicker({ uptimeSeconds }: { uptimeSeconds: number }) {
    const [live, setLive] = useState(uptimeSeconds);
    useEffect(() => {
        const id = setInterval(() => setLive((s) => s + 1), 1000);
        return () => clearInterval(id);
    }, []);
    return <span className='tabular-nums'>{formatUptime(live)}</span>;
}

/* ──────────────────────── stat card ──────────────────────── */

interface StatCardProps {
    id: string;
    label: string;
    value: number;
    sub: string;
    to: string;
    icon: IconSvgElement;
}

function StatCard({ id, label, value, sub, to, icon: Icon }: StatCardProps) {
    const displayed = useCountUp(value);

    return (
        <Link
            to={to}
            id={`stat-card-${id}`}
            className='group relative overflow-hidden rounded-xl border border-mocha-400 bg-mocha-500 p-5 transition-all duration-300 hover:bg-mocha-400/40 hover:shadow-lg hover:shadow-black/20 flex flex-col gap-3'
        >
            <div className='flex items-center justify-between'>
                <span className='text-xs font-semibold uppercase tracking-wider text-mocha-100/70'>{label}</span>
                <div className='flex h-9 w-9 items-center justify-center rounded-lg bg-mocha-400 text-cream-400 transition-transform duration-300 group-hover:scale-110'>
                    <HugeiconsIcon icon={Icon} size={18} />
                </div>
            </div>
            <div className='text-4xl font-extrabold tracking-tight text-cream-400 leading-none tabular-nums'>
                {displayed.toLocaleString()}
            </div>
            <p className='text-xs text-mocha-100/60 leading-relaxed'>{sub}</p>
        </Link>
    );
}

/* ──────────────────────── info row ──────────────────────── */

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div className='flex items-center justify-between py-3 border-b border-mocha-400 last:border-0'>
            <span className='text-xs font-medium text-mocha-100/60 uppercase tracking-wide'>{label}</span>
            <span className='text-sm text-cream-400 font-mono'>{value}</span>
        </div>
    );
}

/* ──────────────────────── section header ──────────────────────── */

function SectionHeader({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
    return (
        <div className='flex items-end justify-between mb-5'>
            <div>
                <h2 className='text-base font-bold text-cream-400'>{title}</h2>
                {sub && <p className='text-xs text-mocha-100/60 mt-1'>{sub}</p>}
            </div>
            {action}
        </div>
    );
}

/* ──────────────────────── skeleton ──────────────────────── */

function GaugeSkeleton() {
    return (
        <div className='flex flex-col items-center gap-2 animate-pulse'>
            <div className='h-[100px] w-[100px] rounded-full bg-mocha-400/30' />
            <div className='h-3 w-16 rounded bg-mocha-400/30' />
            <div className='h-2 w-20 rounded bg-mocha-400/20' />
        </div>
    );
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

/* ──────────────────────── main component ──────────────────────── */

const AdminDashboardContainer = () => {
    const { data: status } = useSWR<PanelStatus>('admin:status', getPanelStatus, { refreshInterval: 30000 });
    const { data: counts } = useSWR('admin:counts', getAdminCounts, { refreshInterval: 60000 });
    const { data: serversPage } = useSWR('admin:dashboard:servers', () => getServers({ page: 1 }));

    const serverCount = counts?.servers ?? 0;
    const nodeCount = counts?.nodes ?? 0;
    const userCount = counts?.users ?? 0;
    const locationCount = counts?.locations ?? 0;
    const nestCount = counts?.nests ?? 0;
    const bucketCount = counts?.buckets ?? 0;

    const items = serversPage?.items ?? [];
    const activeServers = items.filter((s) => !s.suspended && s.installed).length;
    const suspendedServers = items.filter((s) => s.suspended).length;
    const recentServers = [...items]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);

    const stats: StatCardProps[] = [
        {
            id: 'servers',
            label: 'Servers',
            value: serverCount,
            sub: `${activeServers} active · ${suspendedServers} suspended`,
            to: '/admin/servers',
            icon: ServerStack02Icon,
        },
        {
            id: 'nodes',
            label: 'Nodes',
            value: nodeCount,
            sub: 'Active infrastructure',
            to: '/admin/nodes',
            icon: Activity02Icon,
        },
        {
            id: 'users',
            label: 'Users',
            value: userCount,
            sub: 'Registered accounts',
            to: '/admin/users',
            icon: UserMultiple02Icon,
        },
        {
            id: 'locations',
            label: 'Locations',
            value: locationCount,
            sub: 'Deployment regions',
            to: '/admin/locations',
            icon: GlobalIcon,
        },
        {
            id: 'nests',
            label: 'Nests',
            value: nestCount,
            sub: 'Egg containers',
            to: '/admin/nests',
            icon: CubeIcon,
        },
        {
            id: 'buckets',
            label: 'S3 Buckets',
            value: bucketCount,
            sub: 'Object storage',
            to: '/admin/buckets',
            icon: Archive01Icon,
        },
    ];

    const quickActions = [
        {
            to: '/admin/servers',
            icon: ServerStack02Icon,
            label: 'Create Server',
            description: 'Deploy a new game server',
            id: 'create-server',
        },
        {
            to: '/admin/users',
            icon: UserMultiple02Icon,
            label: 'Create User',
            description: 'Add a new panel account',
            id: 'create-user',
        },
        {
            to: '/admin/nodes',
            icon: Activity02Icon,
            label: 'Add Node',
            description: 'Register a Wings daemon',
            id: 'add-node',
        },
        {
            to: '/admin/buckets',
            icon: Archive01Icon,
            label: 'Add S3 Bucket',
            description: 'Connect object storage',
            id: 'add-bucket',
        },
        {
            to: '/admin/databases',
            icon: Database02Icon,
            label: 'Databases',
            description: 'Manage database hosts',
            id: 'manage-databases',
        },
        {
            to: '/admin/locations',
            icon: GlobalIcon,
            label: 'Locations',
            description: 'Configure regions',
            id: 'manage-locations',
        },
    ];

    const cpuPct = status ? status.metrics.cpu : 0;
    const memPct =
        status && status.metrics.memory.total > 0
            ? (status.metrics.memory.used / status.metrics.memory.total) * 100
            : 0;
    const diskPct =
        status && status.metrics.disk.total > 0 ? (status.metrics.disk.used / status.metrics.disk.total) * 100 : 0;

    return (
        <div className='space-y-14 pb-10'>
            {/* ── page header ── */}
            <div className='flex flex-col gap-1'>
                <h1 className='text-[42px] font-extrabold leading-[98%] tracking-[-0.1rem] text-cream-400'>Overview</h1>
                <p className='text-sm text-mocha-100/60'>Panel health, resources, and quick access</p>
            </div>

            {/* ── stat cards ── */}
            {!counts ? (
                <SkeletonCards count={6} />
            ) : (
                <div className='grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4'>
                    {stats.map((s) => (
                        <StatCard key={s.id} {...s} />
                    ))}
                </div>
            )}

            {/* ── resource health + system info ── */}
            <div className='grid grid-cols-1 lg:grid-cols-5 gap-6'>
                {/* gauges — 3/5 */}
                <div className='lg:col-span-3 rounded-xl border border-mocha-400 bg-mocha-500 p-6'>
                    <SectionHeader title='Resource Health' sub='Real-time system metrics' />
                    {!status ? (
                        <div className='flex items-center justify-around py-6'>
                            <GaugeSkeleton />
                            <GaugeSkeleton />
                            <GaugeSkeleton />
                        </div>
                    ) : (
                        <div className='flex items-center justify-between py-8 px-4'>
                            <SvgGauge
                                percent={parseFloat(cpuPct.toFixed(1))}
                                label='CPU'
                                sub={`${cpuPct.toFixed(1)}%`}
                            />
                            <div className='h-28 w-px bg-gradient-to-b from-transparent via-mocha-400/60 to-transparent hidden sm:block' />
                            <SvgGauge
                                percent={parseFloat(memPct.toFixed(1))}
                                label='Memory'
                                sub={`${formatBytes(status.metrics.memory.used)} / ${formatBytes(status.metrics.memory.total)}`}
                            />
                            <div className='h-28 w-px bg-gradient-to-b from-transparent via-mocha-400/60 to-transparent hidden sm:block' />
                            <SvgGauge
                                percent={parseFloat(diskPct.toFixed(1))}
                                label='Disk'
                                sub={`${formatBytes(status.metrics.disk.used)} / ${formatBytes(status.metrics.disk.total)}`}
                            />
                        </div>
                    )}
                </div>

                {/* system info — 2/5 */}
                <div className='lg:col-span-2 rounded-xl border border-mocha-400 bg-mocha-500 p-6'>
                    <SectionHeader title='System Info' sub='Host details' />
                    {!status ? (
                        <div className='space-y-3 animate-pulse'>
                            {[80, 56, 64, 72].map((w, i) => (
                                <div key={i} className='flex justify-between py-2 border-b border-mocha-400'>
                                    <div className='h-3 w-16 rounded bg-mocha-400/40' />
                                    <div className={`h-3 w-${w > 60 ? 24 : 16} rounded bg-mocha-400/30`} />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <>
                            <div className='space-y-0'>
                                <InfoRow label='Hostname' value={status.system.hostname} />
                                <InfoRow label='OS' value={shortenOS(status.system.os)} />
                                <InfoRow label='PHP' value={status.system.php_version} />
                                <div className='flex items-center justify-between py-3 border-b border-mocha-400'>
                                    <span className='text-xs font-medium text-mocha-100/60 uppercase tracking-wide'>
                                        Uptime
                                    </span>
                                    <span className='text-sm text-emerald-400 font-mono font-semibold'>
                                        <UptimeTicker uptimeSeconds={status.metrics.uptime} />
                                    </span>
                                </div>
                            </div>
                            <div className='mt-6'>
                                <p className='text-xs font-semibold uppercase tracking-wider text-mocha-100/50 mb-3'>
                                    Load Average
                                </p>
                                <LoadSparkline loads={status.system.load_average} />
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* ── quick actions ── */}
            <div>
                <SectionHeader title='Quick Actions' sub='Common administrative tasks' />
                <div className='grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4'>
                    {quickActions.map((a) => (
                        <Link
                            key={a.id}
                            to={a.to}
                            id={`quick-action-${a.id}`}
                            className='group flex flex-col gap-3 rounded-xl border border-mocha-400 bg-mocha-500 p-5 transition-all duration-300 hover:bg-mocha-400/40 hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5'
                        >
                            <div className='flex h-11 w-11 items-center justify-center rounded-xl bg-mocha-400/60 text-cream-400 transition-colors duration-300 group-hover:bg-mocha-300/60'>
                                <HugeiconsIcon icon={a.icon} size={22} />
                            </div>
                            <div>
                                <p className='text-sm font-semibold text-cream-400'>{a.label}</p>
                                <p className='text-xs text-mocha-100/60 mt-0.5'>{a.description}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* ── recent servers ── */}
            <div>
                <SectionHeader
                    title='Recent Servers'
                    sub='Latest deployments'
                    action={
                        <Link
                            to='/admin/servers'
                            className='text-xs text-mocha-200 hover:text-cream-400 transition-colors'
                        >
                            View all →
                        </Link>
                    }
                />
                <div className='rounded-xl border border-mocha-400 bg-mocha-500 overflow-hidden'>
                    {!serversPage ? (
                        <div className='divide-y divide-mocha-400'>
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className='flex items-center gap-4 px-5 py-4 animate-pulse'>
                                    <div className='h-3 w-32 rounded bg-mocha-400/30' />
                                    <div className='h-3 w-20 rounded bg-mocha-400/20' />
                                    <div className='ml-auto h-5 w-16 rounded bg-mocha-400/20' />
                                    <div className='h-3 w-14 rounded bg-mocha-400/20' />
                                </div>
                            ))}
                        </div>
                    ) : recentServers.length === 0 ? (
                        <div className='py-12 text-center text-mocha-100/50 text-sm'>
                            No servers yet.{' '}
                            <Link to='/admin/servers' className='text-cream-400 hover:underline'>
                                Create one
                            </Link>
                        </div>
                    ) : (
                        <table className='w-full text-sm' id='recent-servers-table'>
                            <thead>
                                <tr className='border-b border-mocha-400 text-left'>
                                    <th className='px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-mocha-100/50'>
                                        Name
                                    </th>
                                    <th className='px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-mocha-100/50 hidden sm:table-cell'>
                                        Owner
                                    </th>
                                    <th className='px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-mocha-100/50 hidden md:table-cell'>
                                        Resources
                                    </th>
                                    <th className='px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-mocha-100/50'>
                                        Status
                                    </th>
                                    <th className='px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-mocha-100/50 hidden lg:table-cell'>
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
                                        <td className='px-5 py-4 text-mocha-100/70 hidden sm:table-cell'>
                                            {server.userName ?? `UID ${server.user}`}
                                        </td>
                                        <td className='px-5 py-4 text-mocha-100/60 text-xs font-mono hidden md:table-cell'>
                                            {server.memory === 0 ? '∞' : `${server.memory} MB`} RAM ·{' '}
                                            {server.disk === 0 ? '∞' : `${server.disk} MB`} Disk
                                        </td>
                                        <td className='px-5 py-4'>
                                            <ServerStatusBadge server={server} />
                                        </td>
                                        <td className='px-5 py-4 text-xs text-mocha-100/50 hidden lg:table-cell'>
                                            {formatRelativeTime(server.createdAt)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboardContainer;
