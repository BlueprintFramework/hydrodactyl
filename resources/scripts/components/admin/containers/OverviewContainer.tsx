import { useMemo } from 'react';
import { useSystemStatus } from '@/api/admin/useSystemStatus';
import { useVersionCheck } from '@/api/admin/useVersion';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import PageContentBlock from '@/components/elements/PageContentBlock';
import Spinner from '@/components/elements/Spinner';
import { type ChartConfig, EChartsBarChart } from '@/components/evilcharts/charts/echarts-bar-chart';
import { useTranslation } from '@/i18n/I18nProvider';
import { bytesToString } from '@/lib/formatters';

function formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
}

function Card({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className='rounded-xl border border-mocha-400 bg-mocha-500 p-4'>
            <div className='text-xs font-semibold uppercase tracking-wide text-cream-400/60'>{label}</div>
            <div className='mt-3'>{children}</div>
        </div>
    );
}

function UsageBar({
    used,
    total,
    percent,
    config,
}: {
    used: number;
    total: number;
    percent: number;
    config: ChartConfig;
}) {
    const { t } = useTranslation();
    const data = [{ name: t('admin.overview.usage'), used, free: Math.max(0, total - used) }];

    return (
        <div>
            <EChartsBarChart
                data={data}
                config={config}
                xDataKey='name'
                layout='horizontal'
                stackType='stacked'
                barRadius={4}
                className='h-[18px] w-full'
            >
                <EChartsBarChart.Tooltip valueFormatter={(value) => bytesToString(value)} />
                <EChartsBarChart.Bar dataKey='used' />
                <EChartsBarChart.Bar dataKey='free' />
            </EChartsBarChart>
            <div className='mt-2 flex items-baseline justify-between'>
                <span className='text-lg font-semibold text-cream-50'>{percent.toFixed(1)}%</span>
                <span className='text-xs text-cream-400/60'>
                    {bytesToString(used)} / {bytesToString(total)}
                </span>
            </div>
        </div>
    );
}

const LOAD_LABELS = ['1m', '5m', '15m'];

function LoadGraph({ loads, config }: { loads: number[]; config: ChartConfig }) {
    const data = loads.map((value, index) => ({
        name: LOAD_LABELS[index] ?? `${index + 1}m`,
        load: Number(value.toFixed(2)),
    }));

    return (
        <EChartsBarChart
            data={data}
            config={config}
            xDataKey='name'
            barRadius={3}
            barCategoryGap={24}
            className='h-[120px] w-full'
        >
            <EChartsBarChart.XAxis dataKey='name' />
            <EChartsBarChart.Tooltip />
            <EChartsBarChart.Bar dataKey='load' />
        </EChartsBarChart>
    );
}

function VersionCard() {
    const { t } = useTranslation();
    const { data } = useVersionCheck();

    const state = !data
        ? t('admin.overview.version_checking')
        : data.up_to_date === true
          ? t('admin.overview.version_up_to_date')
          : data.up_to_date === false
            ? t('admin.overview.version_update_to', { version: data.latest ?? '' })
            : t('admin.overview.version_unknown');

    const stateClass =
        data?.up_to_date === true ? 'text-hydro-400' : data?.up_to_date === false ? 'text-brand-400' : 'text-cream-50';

    return (
        <Card label={t('admin.overview.version')}>
            <dl className='space-y-2 text-sm'>
                {[
                    [t('admin.overview.version_panel'), data?.current ?? '—'],
                    [t('admin.overview.version_latest'), data?.latest ?? '—'],
                    [t('admin.overview.version_status'), state],
                ].map(([key, value]) => (
                    <div key={key} className='flex justify-between gap-4'>
                        <dt className='text-cream-400/60'>{key}</dt>
                        <dd
                            className={
                                key === t('admin.overview.version_status') ? stateClass : 'truncate text-cream-50'
                            }
                        >
                            {value}
                        </dd>
                    </div>
                ))}
            </dl>
        </Card>
    );
}

const OverviewContainer = () => {
    const { t } = useTranslation();
    const { data } = useSystemStatus();
    const chartConfigs = useMemo(
        () => ({
            used: {
                used: {
                    label: t('admin.overview.used'),
                    colors: { light: ['var(--color-hydro-500)'], dark: ['var(--color-hydro-500)'] },
                },
                free: {
                    label: t('admin.overview.free'),
                    colors: { light: ['var(--color-mocha-300)'], dark: ['var(--color-mocha-300)'] },
                },
            } satisfies ChartConfig,
            load: {
                load: { label: t('admin.overview.load'), colors: { light: ['#f1995a'], dark: ['#f1995a'] } },
            } satisfies ChartConfig,
        }),
        [t],
    );

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
        <PageContentBlock title={t('admin.nav.overview')}>
            <MainPageHeader direction='column' title={t('admin.nav.overview')}>
                <p className='text-sm text-neutral-400'>{t('admin.overview.description')}</p>
            </MainPageHeader>

            <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4'>
                <Card label={t('admin.overview.cpu')}>
                    <div className='text-2xl font-semibold text-cream-50'>{metrics.cpu.toFixed(1)}%</div>
                    <div className='mt-1 text-xs text-cream-400/60'>
                        {t('admin.overview.cores', { count: metrics.cpu_cores })}
                    </div>
                </Card>
                <Card label={t('admin.overview.uptime')}>
                    <div className='text-2xl font-semibold text-cream-50'>{formatUptime(metrics.uptime)}</div>
                </Card>
                <Card label={t('admin.overview.memory')}>
                    <UsageBar
                        used={metrics.memory.used}
                        total={metrics.memory.total}
                        percent={memoryPercent}
                        config={chartConfigs.used}
                    />
                </Card>
                <Card label={t('admin.overview.disk')}>
                    <UsageBar
                        used={metrics.disk.used}
                        total={metrics.disk.total}
                        percent={diskPercent}
                        config={chartConfigs.used}
                    />
                </Card>
            </div>

            <div className='mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4'>
                <Card label={t('admin.overview.system')}>
                    <dl className='space-y-2 text-sm'>
                        {[
                            [t('admin.overview.hostname'), system.hostname],
                            [t('admin.overview.os'), system.os],
                            [t('admin.overview.php'), system.php_version],
                        ].map(([key, value]) => (
                            <div key={key} className='flex justify-between gap-4'>
                                <dt className='text-cream-400/60'>{key}</dt>
                                <dd className='truncate text-cream-50'>{value}</dd>
                            </div>
                        ))}
                    </dl>
                </Card>
                <VersionCard />
                <Card label={t('admin.overview.load_average')}>
                    <LoadGraph loads={system.load_average} config={chartConfigs.load} />
                </Card>
            </div>
        </PageContentBlock>
    );
};

export default OverviewContainer;
