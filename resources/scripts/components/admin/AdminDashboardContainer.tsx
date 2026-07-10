import { Link } from 'react-router-dom';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import useSWR from 'swr';

import { getPanelStatus, type PanelStatus } from '@/api/admin';
import { getNodes } from '@/api/admin/nodes';
import { getServers } from '@/api/admin/servers';
import { getUsers } from '@/api/admin/users';

import { MainPageHeader } from '@/components/elements/MainPageHeader';
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

const BAR_COLORS = { used: '#52A9FF', bg: '#1E3A5A' };

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
    return (
        <div className='bg-[#1a1a1a] border border-gray-800 rounded-lg p-5'>
            <div className='text-sm text-gray-500 mb-1'>{label}</div>
            <div className='text-2xl font-bold text-gray-100'>{value}</div>
            {sub && <div className='text-xs text-gray-600 mt-1'>{sub}</div>}
        </div>
    );
}

function UsageBar({ used, total, label, unit }: { used: number; total: number; label: string; unit?: string }) {
    const pct = total > 0 ? (used / total) * 100 : 0;
    const isPercent = unit === '%';
    const fmt = (v: number) => (isPercent ? `${v.toFixed(1)}%` : formatBytes(v));
    const data = [{ name: label, used, free: total - used }];

    return (
        <div className='mb-4'>
            <div className='flex justify-between text-xs text-gray-400 mb-1'>
                <span>{label}</span>
                <span>
                    {fmt(used)} / {fmt(total)}
                </span>
            </div>
            <ResponsiveContainer width='100%' height={30}>
                <BarChart data={data} layout='vertical' margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                    <XAxis type='number' hide domain={[0, total]} />
                    <Tooltip
                        contentStyle={{ background: '#222', border: '1px solid #444', borderRadius: 6, fontSize: 12 }}
                        formatter={(v: any) => fmt(Number(v))}
                    />
                    <Bar dataKey='used' fill={BAR_COLORS.used} radius={[4, 0, 0, 4]} stackId='a' maxBarSize={24} />
                    <Bar dataKey='free' fill={BAR_COLORS.bg} radius={[0, 4, 4, 0]} stackId='a' maxBarSize={24} />
                </BarChart>
            </ResponsiveContainer>
            <div className='text-xs text-gray-600 mt-0.5'>{pct.toFixed(1)}% used</div>
        </div>
    );
}

function LoadGraph({ loads }: { loads: number[] }) {
    const data = loads.map((v, i) => ({ name: `${i + 1}m`, value: parseFloat(v.toFixed(2)) }));

    return (
        <ResponsiveContainer width='100%' height={80}>
            <BarChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <XAxis dataKey='name' tick={{ fontSize: 10, fill: '#777' }} axisLine={false} tickLine={false} />
                <Tooltip
                    contentStyle={{ background: '#222', border: '1px solid #444', borderRadius: 6, fontSize: 12 }}
                />
                <Bar dataKey='value' fill={BAR_COLORS.used} radius={[3, 3, 0, 0]} maxBarSize={32} />
            </BarChart>
        </ResponsiveContainer>
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

    return (
        <div>
            <MainPageHeader title='Overview' />

            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8'>
                <StatCard label='Servers' value={serverCount} />
                <StatCard label='Nodes' value={nodeCount} />
                <StatCard label='Users' value={userCount} />
                <StatCard label='Uptime' value={formatUptime(metrics.uptime)} sub={system.hostname} />
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8'>
                <div className='bg-[#1a1a1a] border border-gray-800 rounded-lg p-5'>
                    <h3 className='text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4'>
                        Resource Usage
                    </h3>
                    <UsageBar used={metrics.cpu} total={100} label='CPU' unit='%' />
                    <UsageBar used={metrics.memory.used} total={metrics.memory.total} label='Memory' />
                    <UsageBar used={metrics.disk.used} total={metrics.disk.total} label='Disk' />
                </div>
                <div className='bg-[#1a1a1a] border border-gray-800 rounded-lg p-5'>
                    <h3 className='text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4'>System Info</h3>
                    <table className='w-full text-sm mb-4'>
                        <tbody>
                            {[
                                ['Hostname', system.hostname],
                                ['OS', system.os],
                                ['PHP Version', system.php_version],
                                ['Load Average', system.load_average.map((v: number) => v.toFixed(2)).join(', ')],
                            ].map(([k, v]) => (
                                <tr key={k} className='border-b border-gray-800 last:border-0'>
                                    <td className='py-2 text-gray-500 w-32'>{k}</td>
                                    <td className='py-2 text-gray-200'>{v}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <h4 className='text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2'>Load Average</h4>
                    <LoadGraph loads={system.load_average} />
                </div>
            </div>

            <div className='bg-[#1a1a1a] border border-gray-800 rounded-lg p-5'>
                <h3 className='text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4'>Quick Actions</h3>
                <div className='flex flex-wrap gap-3'>
                    <Link
                        to='/admin/servers/new'
                        className='px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded transition-colors'
                    >
                        Create Server
                    </Link>
                    <Link
                        to='/admin/users/new'
                        className='px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded transition-colors'
                    >
                        Create User
                    </Link>
                    <Link
                        to='/admin/nodes/new'
                        className='px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm rounded transition-colors'
                    >
                        Add Node
                    </Link>
                    <Link
                        to='/admin/buckets/new'
                        className='px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm rounded transition-colors'
                    >
                        Add S3 Bucket
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboardContainer;
