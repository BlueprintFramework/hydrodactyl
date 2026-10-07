import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { useSystemStatus } from '@/api/admin/useSystemStatus';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import PageContentBlock from '@/components/elements/PageContentBlock';
import Spinner from '@/components/elements/Spinner';

function formatBytes(bytes: number): string {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
}

function formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
}

const CHART = {
    usage: 'var(--color-hydro-500)',
    track: 'var(--color-mocha-400)',
    axis: 'var(--color-mocha-50)',
};

const tooltipStyle = {
    background: 'var(--color-mocha-500)',
    border: '1px solid var(--color-mocha-400)',
    borderRadius: 6,
    fontSize: 12,
    color: 'var(--color-cream-400)',
};

function Card({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className='rounded-xl border border-mocha-400 bg-mocha-500 p-4'>
            <div className='text-xs font-semibold uppercase tracking-wide text-cream-400/60'>{label}</div>
            <div className='mt-3'>{children}</div>
        </div>
    );
}

function UsageBar({ used, total, percent }: { used: number; total: number; percent: number }) {
    const data = [{ name: 'usage', used, free: Math.max(0, total - used) }];

    return (
        <div>
            <ResponsiveContainer width='100%' height={18}>
                <BarChart data={data} layout='vertical' margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                    <XAxis type='number' hide domain={[0, total]} />
                    <Tooltip
                        cursor={false}
                        contentStyle={tooltipStyle}
                        formatter={(value) => formatBytes(Number(value))}
                    />
                    <Bar dataKey='used' fill={CHART.usage} stackId='a' radius={[4, 0, 0, 4]} maxBarSize={18} />
                    <Bar dataKey='free' fill={CHART.track} stackId='a' radius={[0, 4, 4, 0]} maxBarSize={18} />
                </BarChart>
            </ResponsiveContainer>
            <div className='mt-2 flex items-baseline justify-between'>
                <span className='text-lg font-semibold text-cream-50'>{percent.toFixed(1)}%</span>
                <span className='text-xs text-cream-400/60'>
                    {formatBytes(used)} / {formatBytes(total)}
                </span>
            </div>
        </div>
    );
}

function LoadGraph({ loads }: { loads: number[] }) {
    const data = loads.map((v, i) => ({ name: `${i + 1}m`, value: parseFloat(v.toFixed(2)) }));

    return (
        <ResponsiveContainer width='100%' height={120}>
            <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
                <XAxis dataKey='name' tick={{ fontSize: 10, fill: CHART.axis }} axisLine={false} tickLine={false} />
                <Tooltip cursor={false} contentStyle={tooltipStyle} />
                <Bar dataKey='value' fill={CHART.usage} radius={[3, 3, 0, 0]} maxBarSize={48} />
            </BarChart>
        </ResponsiveContainer>
    );
}

const OverviewContainer = () => {
    const { data } = useSystemStatus();

    if (!data) {
        return (
            <div className='flex items-center justify-center min-h-[60vh]'>
                <Spinner centered size={Spinner.Size.LARGE} />
            </div>
        );
    }

    const { metrics, system } = data;
    const memoryPercent = metrics.memory.total > 0 ? (metrics.memory.used / metrics.memory.total) * 100 : 0;
    const diskPercent = metrics.disk.total > 0 ? (metrics.disk.used / metrics.disk.total) * 100 : 0;

    return (
        <PageContentBlock title='Overview'>
            <MainPageHeader direction='column' title='Overview'>
                <p className='text-sm text-neutral-400'>A quick glance at the host system.</p>
            </MainPageHeader>

            <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4'>
                <Card label='CPU'>
                    <div className='text-2xl font-semibold text-cream-50'>{metrics.cpu.toFixed(1)}%</div>
                    <div className='mt-1 text-xs text-cream-400/60'>{metrics.cpu_cores} cores</div>
                </Card>
                <Card label='Uptime'>
                    <div className='text-2xl font-semibold text-cream-50'>{formatUptime(metrics.uptime)}</div>
                </Card>
                <Card label='Memory'>
                    <UsageBar used={metrics.memory.used} total={metrics.memory.total} percent={memoryPercent} />
                </Card>
                <Card label='Disk'>
                    <UsageBar used={metrics.disk.used} total={metrics.disk.total} percent={diskPercent} />
                </Card>
            </div>

            <div className='mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4'>
                <Card label='System'>
                    <dl className='space-y-2 text-sm'>
                        {[
                            ['Hostname', system.hostname],
                            ['OS', system.os],
                            ['PHP', system.php_version],
                        ].map(([key, value]) => (
                            <div key={key} className='flex justify-between gap-4'>
                                <dt className='text-cream-400/60'>{key}</dt>
                                <dd className='truncate text-cream-50'>{value}</dd>
                            </div>
                        ))}
                    </dl>
                </Card>
                <Card label='Load Average'>
                    <LoadGraph loads={system.load_average} />
                </Card>
            </div>
        </PageContentBlock>
    );
};

export default OverviewContainer;
