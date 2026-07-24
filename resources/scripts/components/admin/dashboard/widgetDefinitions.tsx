import {
    Activity02Icon,
    Archive01Icon,
    BarChartIcon,
    ChartLineData01Icon,
    Clock01Icon,
    CubeIcon,
    GlobalIcon,
    ServerStack02Icon,
    UserMultiple02Icon,
} from '@hugeicons/core-free-icons';
import type { IconSvgElement } from '@hugeicons/react';
import { createContext, useContext } from 'react';

/* ────────────────────── dashboard data context ────────────────────── */

export interface DashboardData {
    cpuPct: number;
    memPct: number;
    diskPct: number;
    memUsed: string;
    memTotal: string;
    diskUsed: string;
    diskTotal: string;
    loadAvg: number[];
    uptimeSeconds: number;
    hostname: string;
    os: string;
    phpVersion: string;
    counts: {
        servers: number;
        nodes: number;
        users: number;
        locations: number;
        nests: number;
        buckets: number;
    };
    timelineCpu: number[];
    timelineMem: number[];
    timelineDisk: number[];
}

export const DashboardDataContext = createContext<DashboardData>({
    cpuPct: 0,
    memPct: 0,
    diskPct: 0,
    memUsed: '0 B',
    memTotal: '0 B',
    diskUsed: '0 B',
    diskTotal: '0 B',
    loadAvg: [0, 0, 0],
    uptimeSeconds: 0,
    hostname: '',
    os: '',
    phpVersion: '',
    counts: { servers: 0, nodes: 0, users: 0, locations: 0, nests: 0, buckets: 0 },
    timelineCpu: [],
    timelineMem: [],
    timelineDisk: [],
});

export function useDashboardData() {
    return useContext(DashboardDataContext);
}

/* ────────────────────── shared mini components ────────────────────── */

function gaugeColor(pct: number): string {
    if (pct >= 80) return '#f87171';
    if (pct >= 60) return '#fbbf24';
    return '#34d399';
}

function MiniGauge({ value, label, sublabel }: { value: number; label: string; sublabel?: string }) {
    const pct = Math.max(0, Math.min(100, value));
    const color = gaugeColor(pct);

    return (
        <div className='flex flex-col items-center gap-1.5 sm:gap-2'>
            <div className='relative h-14 w-14 sm:h-20 sm:w-20'>
                <svg viewBox='0 0 36 36' className='h-full w-full -rotate-90' role='img' aria-label={`${label} gauge`}>
                    <title>{label} gauge</title>
                    <circle cx='18' cy='18' r='15.9155' fill='none' stroke='#29241f' strokeWidth='3' />
                    <circle
                        cx='18'
                        cy='18'
                        r='15.9155'
                        fill='none'
                        stroke={color}
                        strokeWidth='3'
                        strokeDasharray={`${pct} ${100 - pct}`}
                        strokeLinecap='round'
                    />
                </svg>
                <div className='absolute inset-0 flex items-center justify-center'>
                    <span className='text-xs sm:text-sm font-bold text-cream-400 tabular-nums'>{Math.round(pct)}%</span>
                </div>
            </div>
            <div className='text-center'>
                <p className='text-[10px] sm:text-xs font-semibold text-cream-400'>{label}</p>
                {sublabel && (
                    <p className='text-[9px] sm:text-[10px] text-mocha-100/50 max-w-[80px] truncate'>{sublabel}</p>
                )}
            </div>
        </div>
    );
}

function MiniBar({ items }: { items: { label: string; value: number; max?: number; color: string }[] }) {
    const maxVal = Math.max(...items.map((i) => i.max ?? i.value), 1);

    return (
        <div className='space-y-2 sm:space-y-2.5'>
            {items.map((item) => (
                <div key={item.label} className='flex items-center gap-2 sm:gap-3'>
                    <span className='w-12 sm:w-16 text-[9px] sm:text-[10px] font-medium text-mocha-100/60 truncate shrink-0'>
                        {item.label}
                    </span>
                    <div className='flex-1 h-1.5 sm:h-2 rounded-full bg-mocha-400/30 overflow-hidden'>
                        <div
                            className='h-full rounded-full transition-all duration-700'
                            style={{
                                width: `${(item.value / maxVal) * 100}%`,
                                backgroundColor: item.color,
                            }}
                        />
                    </div>
                    <span className='w-10 sm:w-14 text-right text-[9px] sm:text-[10px] font-mono text-mocha-100/60 tabular-nums shrink-0'>
                        {item.value % 1 !== 0 ? item.value.toFixed(2) : item.value}
                    </span>
                </div>
            ))}
        </div>
    );
}

function MiniTimeline({ data, color = '#fa4e49' }: { data: number[]; color?: string }) {
    if (data.length === 0) {
        return <div className='h-full flex items-center justify-center text-[10px] text-mocha-100/40'>No data yet</div>;
    }

    const max = Math.max(...data, 1);
    const min = Math.min(...data, 0);
    const range = max - min || 1;
    const h = 60;

    const points = data
        .map((v, i) => {
            const x = (i / (data.length - 1 || 1)) * 100;
            const y = h - ((v - min) / range) * h;
            return `${x},${y}`;
        })
        .join(' ');

    const areaPoints = `0,${h} ${points} 100,${h}`;

    return (
        <svg
            viewBox={`0 0 100 ${h}`}
            className='w-full h-full'
            preserveAspectRatio='none'
            role='img'
            aria-label='Timeline chart'
        >
            <title>Timeline chart</title>
            <defs>
                <linearGradient id={`gradient-${color.replace('#', '')}`} x1='0' y1='0' x2='0' y2='1'>
                    <stop offset='0%' stopColor={color} stopOpacity='0.3' />
                    <stop offset='100%' stopColor={color} stopOpacity='0.02' />
                </linearGradient>
            </defs>
            <polygon points={areaPoints} fill={`url(#gradient-${color.replace('#', '')})`} />
            <polyline points={points} fill='none' stroke={color} strokeWidth='1.5' vectorEffect='non-scaling-stroke' />
        </svg>
    );
}

function StatWidget({ value, label, sublabel }: { value: number; label: string; sublabel?: string }) {
    return (
        <div className='flex items-center justify-center h-full'>
            <div className='text-center'>
                <p className='text-2xl sm:text-3xl font-extrabold text-cream-400 tabular-nums leading-none'>
                    {value.toLocaleString()}
                </p>
                <p className='text-[10px] sm:text-xs font-semibold text-cream-400 mt-1.5 sm:mt-2'>{label}</p>
                {sublabel && <p className='text-[9px] sm:text-[10px] text-mocha-100/50 mt-0.5'>{sublabel}</p>}
            </div>
        </div>
    );
}

function UptimeWidget({ seconds }: { seconds: number }) {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const text = d > 0 ? `${d}d ${h}h ${m}m` : h > 0 ? `${h}h ${m}m` : `${m}m`;

    return (
        <div className='flex items-center justify-center h-full'>
            <div className='text-center'>
                <p className='text-xl sm:text-2xl font-extrabold text-emerald-400 font-mono tabular-nums leading-none'>
                    {text}
                </p>
                <p className='text-[10px] sm:text-xs font-semibold text-cream-400 mt-1.5 sm:mt-2'>Uptime</p>
                <p className='text-[9px] sm:text-[10px] text-mocha-100/50 mt-0.5'>Panel host</p>
            </div>
        </div>
    );
}

/* ────────────────────── widget render functions ────────────────────── */

function ResourceHealthWidget() {
    const data = useDashboardData();
    return (
        <div className='flex flex-col sm:flex-row items-center justify-around gap-3 sm:gap-0 h-full py-1 sm:py-2'>
            <MiniGauge value={data.cpuPct} label='CPU' sublabel={`${data.cpuPct.toFixed(1)}%`} />
            <div className='h-px sm:h-16 w-16 sm:w-px bg-gradient-to-r sm:bg-gradient-to-b from-transparent via-mocha-400/40 to-transparent' />
            <MiniGauge value={data.memPct} label='Memory' sublabel={`${data.memUsed} / ${data.memTotal}`} />
            <div className='h-px sm:h-16 w-16 sm:w-px bg-gradient-to-r sm:bg-gradient-to-b from-transparent via-mocha-400/40 to-transparent' />
            <MiniGauge value={data.diskPct} label='Disk' sublabel={`${data.diskUsed} / ${data.diskTotal}`} />
        </div>
    );
}

function SystemInfoWidget() {
    const data = useDashboardData();
    return (
        <div className='space-y-4 h-full flex flex-col justify-center'>
            <MiniBar
                items={[
                    { label: '1 min', value: data.loadAvg[0] ?? 0, color: '#fa4e49' },
                    { label: '5 min', value: data.loadAvg[1] ?? 0, color: '#fbbf24' },
                    { label: '15 min', value: data.loadAvg[2] ?? 0, color: '#34d399' },
                ]}
            />
            <div className='space-y-1.5 pt-2 border-t border-mocha-400/40'>
                <div className='flex justify-between text-[10px]'>
                    <span className='text-mocha-100/50'>Hostname</span>
                    <span className='text-cream-400 font-mono truncate ml-4'>{data.hostname}</span>
                </div>
                <div className='flex justify-between text-[10px]'>
                    <span className='text-mocha-100/50'>OS</span>
                    <span className='text-cream-400 font-mono truncate ml-4'>{data.os}</span>
                </div>
                <div className='flex justify-between text-[10px]'>
                    <span className='text-mocha-100/50'>PHP</span>
                    <span className='text-cream-400 font-mono truncate ml-4'>{data.phpVersion}</span>
                </div>
            </div>
        </div>
    );
}

function MetricsTimelineWidget() {
    const data = useDashboardData();

    if (data.timelineCpu.length === 0) {
        return (
            <div className='h-full flex items-center justify-center text-xs text-mocha-100/40'>Collecting data...</div>
        );
    }

    return (
        <div className='h-full flex flex-col gap-1.5 sm:gap-2'>
            <div className='flex-1 min-h-0'>
                <MiniTimeline data={data.timelineCpu} color='#fa4e49' />
            </div>
            <div className='flex items-center justify-center gap-3 sm:gap-4'>
                <span className='flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-[10px] text-mocha-100/60'>
                    <span className='h-1.5 w-1.5 rounded-full bg-[#fa4e49]' /> CPU
                </span>
                <span className='flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-[10px] text-mocha-100/60'>
                    <span className='h-1.5 w-1.5 rounded-full bg-[#fbbf24]' /> Memory
                </span>
                <span className='flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-[10px] text-mocha-100/60'>
                    <span className='h-1.5 w-1.5 rounded-full bg-[#34d399]' /> Disk
                </span>
            </div>
        </div>
    );
}

function EntityDistributionWidget() {
    const data = useDashboardData();
    const { counts } = data;
    const total = counts.servers + counts.nodes + counts.users + counts.locations + counts.nests + counts.buckets;

    return (
        <div className='space-y-2 sm:space-y-3 h-full flex flex-col justify-center'>
            <div className='text-center mb-1 sm:mb-2'>
                <p className='text-xl sm:text-2xl font-extrabold text-cream-400 tabular-nums'>
                    {total.toLocaleString()}
                </p>
                <p className='text-[9px] sm:text-[10px] text-mocha-100/50'>Total Resources</p>
            </div>
            <MiniBar
                items={[
                    { label: 'Servers', value: counts.servers, color: '#fa4e49' },
                    { label: 'Nodes', value: counts.nodes, color: '#f59e0b' },
                    { label: 'Users', value: counts.users, color: '#34d399' },
                    { label: 'Locations', value: counts.locations, color: '#60a5fa' },
                    { label: 'Nests', value: counts.nests, color: '#a78bfa' },
                    { label: 'Buckets', value: counts.buckets, color: '#f472b6' },
                ]}
            />
        </div>
    );
}

function StatServersWidget() {
    const data = useDashboardData();
    return <StatWidget value={data.counts.servers} label='Servers' sublabel='Deployed instances' />;
}

function StatNodesWidget() {
    const data = useDashboardData();
    return <StatWidget value={data.counts.nodes} label='Nodes' sublabel='Infrastructure nodes' />;
}

function StatUsersWidget() {
    const data = useDashboardData();
    return <StatWidget value={data.counts.users} label='Users' sublabel='Registered accounts' />;
}

function StatLocationsWidget() {
    const data = useDashboardData();
    return <StatWidget value={data.counts.locations} label='Locations' sublabel='Deployment regions' />;
}

function StatNestsWidget() {
    const data = useDashboardData();
    return <StatWidget value={data.counts.nests} label='Nests' sublabel='Egg containers' />;
}

function StatBucketsWidget() {
    const data = useDashboardData();
    return <StatWidget value={data.counts.buckets} label='Buckets' sublabel='S3 object storage' />;
}

function UptimeWidgetWrapper() {
    const data = useDashboardData();
    return <UptimeWidget seconds={data.uptimeSeconds} />;
}

/* ────────────────────── widget type definitions ────────────────────── */

export interface DashboardWidgetType {
    id: string;
    title: string;
    icon: IconSvgElement;
    description: string;
    component: React.ComponentType;
    defaultW: number;
    defaultH: number;
    minW: number;
    minH: number;
}

export const WIDGET_TYPES: DashboardWidgetType[] = [
    {
        id: 'resource-health',
        title: 'Resource Health',
        icon: Activity02Icon,
        description: 'CPU, memory, and disk usage gauges',
        component: ResourceHealthWidget,
        defaultW: 6,
        defaultH: 3,
        minW: 4,
        minH: 2,
    },
    {
        id: 'system-info',
        title: 'System Info',
        icon: CubeIcon,
        description: 'Host details and load averages',
        component: SystemInfoWidget,
        defaultW: 4,
        defaultH: 3,
        minW: 3,
        minH: 2,
    },
    {
        id: 'metrics-timeline',
        title: 'Metrics Timeline',
        icon: ChartLineData01Icon,
        description: 'CPU usage over time',
        component: MetricsTimelineWidget,
        defaultW: 8,
        defaultH: 3,
        minW: 4,
        minH: 2,
    },
    {
        id: 'entity-distribution',
        title: 'Entity Distribution',
        icon: BarChartIcon,
        description: 'Resource counts across the panel',
        component: EntityDistributionWidget,
        defaultW: 4,
        defaultH: 3,
        minW: 3,
        minH: 2,
    },
    {
        id: 'stat-servers',
        title: 'Servers',
        icon: ServerStack02Icon,
        description: 'Active server count',
        component: StatServersWidget,
        defaultW: 2,
        defaultH: 2,
        minW: 2,
        minH: 2,
    },
    {
        id: 'stat-nodes',
        title: 'Nodes',
        icon: Activity02Icon,
        description: 'Active infrastructure nodes',
        component: StatNodesWidget,
        defaultW: 2,
        defaultH: 2,
        minW: 2,
        minH: 2,
    },
    {
        id: 'stat-users',
        title: 'Users',
        icon: UserMultiple02Icon,
        description: 'Registered panel accounts',
        component: StatUsersWidget,
        defaultW: 2,
        defaultH: 2,
        minW: 2,
        minH: 2,
    },
    {
        id: 'stat-locations',
        title: 'Locations',
        icon: GlobalIcon,
        description: 'Deployment regions',
        component: StatLocationsWidget,
        defaultW: 2,
        defaultH: 2,
        minW: 2,
        minH: 2,
    },
    {
        id: 'stat-nests',
        title: 'Nests',
        icon: CubeIcon,
        description: 'Egg containers',
        component: StatNestsWidget,
        defaultW: 2,
        defaultH: 2,
        minW: 2,
        minH: 2,
    },
    {
        id: 'stat-buckets',
        title: 'S3 Buckets',
        icon: Archive01Icon,
        description: 'Object storage buckets',
        component: StatBucketsWidget,
        defaultW: 2,
        defaultH: 2,
        minW: 2,
        minH: 2,
    },
    {
        id: 'uptime',
        title: 'Uptime',
        icon: Clock01Icon,
        description: 'Panel host uptime counter',
        component: UptimeWidgetWrapper,
        defaultW: 3,
        defaultH: 2,
        minW: 2,
        minH: 2,
    },
];

export function getWidgetType(typeId: string): DashboardWidgetType | undefined {
    return WIDGET_TYPES.find((w) => w.id === typeId);
}
