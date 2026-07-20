import { ResponsiveBar } from '@nivo/bar';
import { Link } from 'react-router-dom';
import useSWR from 'swr';

import { getPanelStatus, type PanelStatus } from '@/api/admin';
import { getNodes } from '@/api/admin/nodes';
import { getServers } from '@/api/admin/servers';
import { getUsers } from '@/api/admin/users';

import Spinner from '@/components/elements/Spinner';

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
    return `${d}d ${h}h ${m}m`;
}

const BAR_COLORS = { used: '#fa4e49', bg: '#44403c' };

const tooltipStyle = {
    background: '#292524',
    border: '1px solid #57534e',
    borderRadius: 6,
    fontSize: 12,
    color: '#fff1e0',
    padding: '8px 12px',
};

const nivoTheme = {
    text: { fontSize: 10, fill: '#a8a29e' },
    axis: {
        domain: { line: { stroke: '#44403c' } },
        ticks: { text: { fill: '#a8a29e', fontSize: 10 } },
    },
    grid: { line: { stroke: '#292524' } },
};

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
    return (
        <div className='bg-mocha-500 border border-mocha-400 rounded-lg p-5'>
            <div className='text-sm text-mocha-200 mb-1'>{label}</div>
            <div className='text-2xl font-bold text-cream-200'>{value}</div>
            {sub && <div className='text-xs text-mocha-200/60 mt-1'>{sub}</div>}
        </div>
    );
}

function UsageBar({ used, total, label, unit }: { used: number; total: number; label: string; unit?: string }) {
    const pct = total > 0 ? (used / total) * 100 : 0;
    const isPercent = unit === '%';
    const fmt = (v: number) => (isPercent ? `${v.toFixed(1)}%` : formatBytes(v));

    return (
        <div className='mb-4'>
            <div className='flex justify-between text-xs text-mocha-200 mb-1'>
                <span>{label}</span>
                <span>
                    {fmt(used)} / {fmt(total)}
                </span>
            </div>
            <div style={{ height: 30 }}>
                <ResponsiveBar
                    data={[{ name: label, used, free: total - used }]}
                    keys={['used', 'free']}
                    indexBy='name'
                    layout='horizontal'
                    groupMode='stacked'
                    margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
                    padding={0}
                    enableGridX={false}
                    enableGridY={false}
                    axisBottom={null}
                    axisLeft={null}
                    axisRight={null}
                    axisTop={null}
                    colors={[BAR_COLORS.used, BAR_COLORS.bg]}
                    borderRadius={4}
                    tooltip={({ indexValue, data }) => (
                        <div style={tooltipStyle}>
                            {indexValue}: {fmt(data.used as number)} /
                            {fmt((data.used as number) + (data.free as number))}
                        </div>
                    )}
                    theme={nivoTheme}
                    isInteractive
                />
            </div>
            <div className='text-xs text-mocha-200/60 mt-0.5'>{pct.toFixed(1)}% used</div>
        </div>
    );
}

function LoadGraph({ loads }: { loads: number[] }) {
    const data = loads.map((v, i) => ({ name: `${i + 1}m`, value: parseFloat(v.toFixed(2)) }));

    return (
        <div style={{ height: 80 }}>
            <ResponsiveBar
                data={data}
                keys={['value']}
                indexBy='name'
                layout='vertical'
                margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
                padding={0.25}
                enableGridX={false}
                enableGridY={false}
                axisBottom={{
                    tickSize: 0,
                    tickPadding: 8,
                }}
                axisLeft={null}
                axisRight={null}
                axisTop={null}
                colors={BAR_COLORS.used}
                borderRadius={3}
                tooltip={({ value }) => <div style={tooltipStyle}>{value}</div>}
                theme={nivoTheme}
                isInteractive
            />
        </div>
    );
}

const AdminDashboardContainer = () => {
    const { data: status } = useSWR<PanelStatus>('admin:status', () => getPanelStatus(), {
        refreshInterval: 30000,
    });
    const { data: servers } = useSWR('admin:dashboard:servers', () => getServers({ page: 1 }));
    const { data: nodes } = useSWR('admin:dashboard:nodes', () => getNodes({ page: 1 }));
    const { data: users } = useSWR('admin:dashboard:users', () => getUsers({ page: 1 }));

    const serverCount = servers?.pagination?.total ?? 0;
    const nodeCount = nodes?.pagination?.total ?? 0;
    const userCount = users?.pagination?.total ?? 0;

    if (!status) {
        return (
            <div className='flex items-center justify-center h-64'>
                <Spinner />
            </div>
        );
    }

    const { metrics, system } = status;

    // Calculate additional stats
    const activeServers = servers?.items?.filter(s => s.suspended === false).length ?? 0;
    const suspendedServers = serverCount - activeServers;
    const cpuPercent = metrics.cpu.toFixed(1);
    const memoryPercent = metrics.memory.total > 0 ? ((metrics.memory.used / metrics.memory.total) * 100).toFixed(1) : '0.0';
    const diskPercent = metrics.disk.total > 0 ? ((metrics.disk.used / metrics.disk.total) * 100).toFixed(1) : '0.0';

    return (
        <div className='space-y-6'>
            {/* Header */}
            <div>
                <h1 className='text-3xl font-bold text-cream-400'>Dashboard Overview</h1>
                <p className='text-mocha-200 mt-1'>Monitor your panel's health and resources</p>
            </div>

            {/* Primary Stats Grid */}
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
                <div className='bg-mocha-500 border border-mocha-400 rounded-xl p-5'>
                    <div className='flex items-center justify-between'>
                        <div>
                            <p className='text-sm text-mocha-200 mb-1'>Total Servers</p>
                            <p className='text-3xl font-bold text-cream-400'>{serverCount}</p>
                            <p className='text-xs text-mocha-200 mt-1'>{activeServers} active, {suspendedServers} suspended</p>
                        </div>
                        <div className='w-12 h-12 bg-mocha-400 rounded-lg flex items-center justify-center'>
                            <svg className='w-6 h-6 text-cream-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01' />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className='bg-mocha-500 border border-mocha-400 rounded-xl p-5'>
                    <div className='flex items-center justify-between'>
                        <div>
                            <p className='text-sm text-mocha-200 mb-1'>Total Nodes</p>
                            <p className='text-3xl font-bold text-cream-400'>{nodeCount}</p>
                            <p className='text-xs text-mocha-200 mt-1'>Active infrastructure</p>
                        </div>
                        <div className='w-12 h-12 bg-mocha-400 rounded-lg flex items-center justify-center'>
                            <svg className='w-6 h-6 text-cream-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z' />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className='bg-mocha-500 border border-mocha-400 rounded-xl p-5'>
                    <div className='flex items-center justify-between'>
                        <div>
                            <p className='text-sm text-mocha-200 mb-1'>Total Users</p>
                            <p className='text-3xl font-bold text-cream-400'>{userCount}</p>
                            <p className='text-xs text-mocha-200 mt-1'>Registered accounts</p>
                        </div>
                        <div className='w-12 h-12 bg-mocha-400 rounded-lg flex items-center justify-center'>
                            <svg className='w-6 h-6 text-cream-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className='bg-mocha-500 border border-mocha-400 rounded-xl p-5'>
                    <div className='flex items-center justify-between'>
                        <div>
                            <p className='text-sm text-mocha-200 mb-1'>System Uptime</p>
                            <p className='text-2xl font-bold text-cream-400'>{formatUptime(metrics.uptime)}</p>
                            <p className='text-xs text-mocha-200 mt-1'>{system.hostname}</p>
                        </div>
                        <div className='w-12 h-12 bg-green-900/50 rounded-lg flex items-center justify-center'>
                            <svg className='w-6 h-6 text-green-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 10V3L4 14h7v7l9-11h-7z' />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Resource Usage Section */}
            <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
                <div className='lg:col-span-2 bg-mocha-500 border border-mocha-400 rounded-xl p-6'>
                    <div className='flex items-center gap-3 mb-6'>
                        <div className='w-10 h-10 bg-mocha-400 rounded-lg flex items-center justify-center'>
                            <svg className='w-5 h-5 text-cream-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' />
                            </svg>
                        </div>
                        <div>
                            <h3 className='text-cream-400 font-semibold text-lg'>Resource Usage</h3>
                            <p className='text-mocha-200 text-sm'>Real-time system resource monitoring</p>
                        </div>
                    </div>

                    <div className='space-y-5'>
                        <div>
                            <div className='flex justify-between text-sm mb-2'>
                                <span className='text-mocha-200'>CPU Usage</span>
                                <span className='text-cream-400 font-medium'>{cpuPercent}%</span>
                            </div>
                            <UsageBar used={metrics.cpu} total={100} label='CPU' unit='%' />
                        </div>

                        <div>
                            <div className='flex justify-between text-sm mb-2'>
                                <span className='text-mocha-200'>Memory</span>
                                <span className='text-cream-400 font-medium'>{formatBytes(metrics.memory.used)} / {formatBytes(metrics.memory.total)} ({memoryPercent}%)</span>
                            </div>
                            <UsageBar used={metrics.memory.used} total={metrics.memory.total} label='Memory' />
                        </div>

                        <div>
                            <div className='flex justify-between text-sm mb-2'>
                                <span className='text-mocha-200'>Disk</span>
                                <span className='text-cream-400 font-medium'>{formatBytes(metrics.disk.used)} / {formatBytes(metrics.disk.total)} ({diskPercent}%)</span>
                            </div>
                            <UsageBar used={metrics.disk.used} total={metrics.disk.total} label='Disk' />
                        </div>
                    </div>
                </div>

                <div className='bg-mocha-500 border border-mocha-400 rounded-xl p-6'>
                    <div className='flex items-center gap-3 mb-6'>
                        <div className='w-10 h-10 bg-mocha-400 rounded-lg flex items-center justify-center'>
                            <svg className='w-5 h-5 text-cream-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                            </svg>
                        </div>
                        <div>
                            <h3 className='text-cream-400 font-semibold text-lg'>System Info</h3>
                            <p className='text-mocha-200 text-sm'>Server details</p>
                        </div>
                    </div>

                    <div className='space-y-3'>
                        {[
                            ['Hostname', system.hostname],
                            ['OS', system.os],
                            ['PHP Version', system.php_version],
                        ].map(([k, v]) => (
                            <div key={k} className='flex justify-between items-center py-2 border-b border-mocha-400 last:border-0'>
                                <span className='text-sm text-mocha-200'>{k}</span>
                                <span className='text-sm text-cream-400 font-medium'>{v}</span>
                            </div>
                        ))}
                    </div>

                    <div className='mt-6'>
                        <h4 className='text-xs font-semibold text-mocha-200 uppercase tracking-wider mb-3'>Load Average</h4>
                        <LoadGraph loads={system.load_average} />
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className='bg-mocha-500 border border-mocha-400 rounded-xl p-6'>
                <div className='flex items-center gap-3 mb-4'>
                    <div className='w-10 h-10 bg-mocha-400 rounded-lg flex items-center justify-center'>
                        <svg className='w-5 h-5 text-cream-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 10V3L4 14h7v7l9-11h-7z' />
                        </svg>
                    </div>
                    <div>
                        <h3 className='text-cream-400 font-semibold text-lg'>Quick Actions</h3>
                        <p className='text-mocha-200 text-sm'>Common administrative tasks</p>
                    </div>
                </div>
                <div className='flex flex-wrap gap-3'>
                    <Link
                        to='/admin/servers/new'
                        className='px-4 py-2 bg-mocha-400 hover:bg-mocha-300 text-cream-400 text-sm font-medium rounded-lg transition-colors'
                    >
                        Create Server
                    </Link>
                    <Link
                        to='/admin/users/new'
                        className='px-4 py-2 bg-mocha-400 hover:bg-mocha-300 text-cream-400 text-sm font-medium rounded-lg transition-colors'
                    >
                        Create User
                    </Link>
                    <Link
                        to='/admin/nodes/new'
                        className='px-4 py-2 bg-mocha-400 hover:bg-mocha-300 text-cream-400 text-sm font-medium rounded-lg transition-colors'
                    >
                        Add Node
                    </Link>
                    <Link
                        to='/admin/buckets/new'
                        className='px-4 py-2 bg-mocha-400 hover:bg-mocha-300 text-cream-400 text-sm font-medium rounded-lg transition-colors'
                    >
                        Add S3 Bucket
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboardContainer;
