import { CloudDownload, CloudUpload } from '@carbon/icons-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import getServerResourceHistory from '@/api/server/getServerResourceHistory';
import CopyOnClick from '@/components/elements/CopyOnClick';
import { type ChartConfig, EChartsLineChart } from '@/components/evilcharts/charts/echarts-line-chart';
import ChartBlock from '@/components/server/console/ChartBlock';
import { SocketEvent } from '@/components/server/events';
import { useTranslation } from '@/i18n/I18nProvider';
import { bytesToString, ip, mbToBytes } from '@/lib/formatters';
import useWebsocketEvent from '@/plugins/useWebsocketEvent';
import { ServerContext } from '@/state/server';

import formatUptime from '../UptimeDuration';

const POINTS = 20;

const GRAPH_STROKE_WIDTH = 1.6;

interface StatsData {
    cpu_absolute: number;
    memory_bytes: number;
    uptime: number;
    network: {
        tx_bytes: number;
        rx_bytes: number;
    };
}

interface LiveStats {
    cpu: number;
    memory: number;
    tx: number;
    rx: number;
    uptime: number;
}

interface Sample {
    [key: string]: number;
    index: number;
    cpu: number;
    memory: number;
    inbound: number;
    outbound: number;
}

const EMPTY_STATS: LiveStats = { cpu: 0, memory: 0, tx: 0, rx: 0, uptime: 0 };

const cacheKey = (uuid: string) => `hydrodactyl:stats:${uuid}`;

const readCachedSamples = (uuid: string | undefined): Sample[] => {
    if (!uuid) return [];

    try {
        const cached = JSON.parse(localStorage.getItem(cacheKey(uuid)) ?? '[]') as Sample[];

        return Array.isArray(cached) ? cached.filter((sample) => typeof sample?.cpu === 'number').slice(-POINTS) : [];
    } catch {
        return [];
    }
};

const StatGraphs = () => {
    const { t } = useTranslation();
    const chartConfigs = useMemo(
        () => ({
            cpu: {
                cpu: { label: t('server.console.cpu'), colors: { light: ['#f1995a'], dark: ['#f1995a'] } },
            } satisfies ChartConfig,
            memory: {
                memory: { label: t('server.console.memory'), colors: { light: ['#52a9ff'], dark: ['#52a9ff'] } },
            } satisfies ChartConfig,
            network: {
                inbound: { label: t('server.console.inbound'), colors: { light: ['#5eead4'], dark: ['#5eead4'] } },
                outbound: { label: t('server.console.outbound'), colors: { light: ['#c084fc'], dark: ['#c084fc'] } },
            } satisfies ChartConfig,
        }),
        [t],
    );
    const status = ServerContext.useStoreState((state) => state.status.value);
    const limits = ServerContext.useStoreState((state) => state.server.data?.limits);
    const uuid = ServerContext.useStoreState((state) => state.server.data?.uuid);
    const previous = useRef<Record<'tx' | 'rx', number>>({ tx: -1, rx: -1 });
    const [live, setLive] = useState<LiveStats>(EMPTY_STATS);
    const [samples, setSamples] = useState<Sample[]>(() => readCachedSamples(uuid));

    useEffect(() => {
        if (!uuid || samples.length === 0) return;

        localStorage.setItem(cacheKey(uuid), JSON.stringify(samples));
    }, [uuid, samples]);

    useEffect(() => {
        if (!uuid) return;

        getServerResourceHistory(uuid)
            .then((history) => {
                if (history.length === 0) return;

                const restored = history.slice(-POINTS).map((sample, index) => {
                    const earlier = history[index - 1];

                    return {
                        index,
                        cpu: Number(sample.cpu.toFixed(2)),
                        memory: sample.memory,
                        inbound: earlier ? Math.max(0, sample.tx - earlier.tx) : 0,
                        outbound: earlier ? Math.max(0, sample.rx - earlier.rx) : 0,
                    };
                });

                setSamples((current) => (current.length > restored.length ? current : restored));

                const latest = history.at(-1);
                if (latest) {
                    setLive((current) => (current.uptime > 0 ? current : { ...current, uptime: latest.uptime }));
                    previous.current = { tx: latest.tx, rx: latest.rx };
                }
            })
            .catch((error) => console.error(error));
    }, [uuid]);

    useEffect(() => {
        if (status !== 'offline') return;

        setSamples([]);
        setLive(EMPTY_STATS);
        if (uuid) localStorage.removeItem(cacheKey(uuid));
    }, [status, uuid]);

    useWebsocketEvent(SocketEvent.STATS, (data) => {
        let values: StatsData;
        try {
            values = JSON.parse(String(data)) as StatsData;
        } catch {
            return;
        }

        const tx = previous.current.tx < 0 ? 0 : Math.max(0, values.network.tx_bytes - previous.current.tx);
        const rx = previous.current.rx < 0 ? 0 : Math.max(0, values.network.rx_bytes - previous.current.rx);

        setSamples((current) =>
            [
                ...current,
                {
                    index: (current.at(-1)?.index ?? -1) + 1,
                    cpu: Number(values.cpu_absolute.toFixed(2)),
                    memory: Math.floor(values.memory_bytes / 1024 / 1024),
                    inbound: tx,
                    outbound: rx,
                },
            ].slice(-POINTS),
        );

        setLive({
            cpu: values.cpu_absolute,
            memory: values.memory_bytes,
            tx,
            rx,
            uptime: values.uptime,
        });

        previous.current = {
            tx: values.network.tx_bytes,
            rx: values.network.rx_bytes,
        };
    });

    const allocation = ServerContext.useStoreState((state) => {
        const match = state.server.data?.allocations.find((allocation) => allocation.isDefault);

        return !match ? 'n/a' : `${match.alias || ip(match.ip)}:${match.port}`;
    });

    const description = ServerContext.useStoreState((state) => state.server.data?.description);
    const loading = samples.length === 0;

    return (
        <div className='flex h-full flex-none flex-col gap-3 overflow-y-auto'>
            <div className='rounded-2xl border border-mocha-400 bg-mocha-500 p-4'>
                <p className='text-xs font-semibold uppercase tracking-wide text-cream-400/60'>
                    {t('server.console.ip_address')}
                </p>
                <CopyOnClick text={allocation}>
                    <div className='mt-1 truncate text-sm font-medium text-cream-50 tabular-nums'>{allocation}</div>
                </CopyOnClick>
            </div>

            <div className='rounded-2xl border border-mocha-400 bg-mocha-500 p-4'>
                <p className='text-xs font-semibold uppercase tracking-wide text-cream-400/60'>
                    {t('server.console.uptime')}
                </p>
                <div className='mt-1 text-sm font-medium text-cream-50 tabular-nums'>
                    {formatUptime(live.uptime, t)}
                </div>
            </div>

            {description && (
                <div className='rounded-2xl border border-mocha-400 bg-mocha-500 p-4'>
                    <p className='text-xs font-semibold uppercase tracking-wide text-cream-400/60'>
                        {t('server.console.description')}
                    </p>
                    <div className='mt-1 text-sm font-medium text-cream-50'>{description}</div>
                </div>
            )}

            <ChartBlock
                title={t('server.console.cpu')}
                hint={limits?.cpu ? t('server.console.of_value', { value: `${limits.cpu}%` }) : undefined}
                value={<span className='tabular-nums'>{live.cpu.toFixed(1)}%</span>}
            >
                <EChartsLineChart
                    data={loading ? [] : samples}
                    config={chartConfigs.cpu}
                    xDataKey='index'
                    isLoading={loading}
                    curveType='bump'
                    className='h-full w-full'
                >
                    <EChartsLineChart.Tooltip />
                    <EChartsLineChart.Line dataKey='cpu' strokeVariant='solid' strokeWidth={GRAPH_STROKE_WIDTH} />
                </EChartsLineChart>
            </ChartBlock>

            <ChartBlock
                title={t('server.console.memory')}
                hint={
                    limits?.memory
                        ? t('server.console.of_value', { value: bytesToString(mbToBytes(limits.memory)) })
                        : undefined
                }
                value={<span className='tabular-nums'>{bytesToString(live.memory)}</span>}
            >
                <EChartsLineChart
                    data={loading ? [] : samples}
                    config={chartConfigs.memory}
                    xDataKey='index'
                    isLoading={loading}
                    curveType='bump'
                    className='h-full w-full'
                >
                    <EChartsLineChart.Tooltip valueFormatter={(value) => bytesToString(mbToBytes(value))} />
                    <EChartsLineChart.Line dataKey='memory' strokeVariant='solid' strokeWidth={GRAPH_STROKE_WIDTH} />
                </EChartsLineChart>
            </ChartBlock>

            <ChartBlock
                title={t('server.console.network_activity')}
                value={
                    <div className='flex flex-col items-end gap-1 text-xs font-semibold tabular-nums'>
                        <span className='flex items-center gap-1.5'>
                            <CloudDownload className='size-3.5' style={{ color: '#5eead4' }} />
                            {bytesToString(live.tx)}
                        </span>
                        <span className='flex items-center gap-1.5'>
                            <CloudUpload className='size-3.5' style={{ color: '#c084fc' }} />
                            {bytesToString(live.rx)}
                        </span>
                    </div>
                }
            >
                <EChartsLineChart
                    data={loading ? [] : samples}
                    config={chartConfigs.network}
                    xDataKey='index'
                    isLoading={loading}
                    curveType='bump'
                    className='h-full w-full'
                >
                    <EChartsLineChart.Tooltip valueFormatter={(value) => bytesToString(value)} />
                    <EChartsLineChart.Line dataKey='inbound' strokeVariant='solid' strokeWidth={GRAPH_STROKE_WIDTH} />
                    <EChartsLineChart.Line dataKey='outbound' strokeVariant='solid' strokeWidth={GRAPH_STROKE_WIDTH} />
                </EChartsLineChart>
            </ChartBlock>
        </div>
    );
};

export default StatGraphs;
