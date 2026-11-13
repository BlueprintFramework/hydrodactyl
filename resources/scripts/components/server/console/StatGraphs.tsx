import { CloudDownload, CloudUpload } from '@carbon/icons-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import getServerResourceHistory from '@/api/server/getServerResourceHistory';
import CopyOnClick from '@/components/elements/CopyOnClick';
import ChartBlock from '@/components/server/console/ChartBlock';
import { SocketEvent } from '@/components/server/events';
import { useTranslation } from '@/i18n/I18nProvider';
import { bytesToString, ip, mbToBytes } from '@/lib/formatters';
import useWebsocketEvent from '@/plugins/useWebsocketEvent';
import { ServerContext } from '@/state/server';

import formatUptime from '../UptimeDuration';

const POINTS = 24;

/** Match Wings' ~1s stats cadence so each new point eases in over one tick. */
const SCROLL_MS = 1000;

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

const lerp = (from: number, to: number, t: number): number => from + (to - from) * t;

const useSmoothLive = (target: LiveStats): LiveStats => {
    const [display, setDisplay] = useState(target);
    const displayRef = useRef(display);
    const fromRef = useRef(target);
    const toRef = useRef(target);
    const startedAtRef = useRef(performance.now());
    const rafRef = useRef(0);
    const signatureRef = useRef(`${target.cpu}:${target.memory}:${target.tx}:${target.rx}:${target.uptime}`);

    displayRef.current = display;

    useEffect(() => {
        const signature = `${target.cpu}:${target.memory}:${target.tx}:${target.rx}:${target.uptime}`;
        if (signature === signatureRef.current) return;

        signatureRef.current = signature;
        fromRef.current = displayRef.current;
        toRef.current = target;
        startedAtRef.current = performance.now();
        cancelAnimationFrame(rafRef.current);

        const tick = (now: number) => {
            const t = Math.min(1, (now - startedAtRef.current) / SCROLL_MS);
            const from = fromRef.current;
            const to = toRef.current;

            setDisplay({
                cpu: lerp(from.cpu, to.cpu, t),
                memory: lerp(from.memory, to.memory, t),
                tx: lerp(from.tx, to.tx, t),
                rx: lerp(from.rx, to.rx, t),
                uptime: to.uptime,
            });

            if (t < 1) rafRef.current = requestAnimationFrame(tick);
        };

        rafRef.current = requestAnimationFrame(tick);

        return () => cancelAnimationFrame(rafRef.current);
    }, [target]);

    useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

    return display;
};

type SeriesKey = keyof Omit<Sample, 'index'>;

/**
 * SVG strip-chart with viewBox panning. No ECharts — eliminates the resize/rescale "toc".
 */
const LiveSparkline = ({
    data,
    series,
    floor,
}: {
    data: Sample[];
    series: { key: SeriesKey; color: string }[];
    floor: number;
}) => {
    const [buffer, setBuffer] = useState<Sample[]>(() => data.slice(-POINTS));
    const [viewX, setViewX] = useState(0);

    const realRef = useRef<Sample[]>(data.slice(-POINTS));
    const busyRef = useRef(false);
    const queueRef = useRef<Sample | null>(null);
    const yMaxRef = useRef(floor);
    const rafRef = useRef(0);
    const appendRef = useRef<(sample: Sample) => void>(() => undefined);

    const cancelPan = () => {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
    };

    const settle = (real: Sample[]) => {
        cancelPan();
        busyRef.current = false;
        realRef.current = real.slice(-POINTS);
        setViewX(0);
        setBuffer(realRef.current);
    };

    const finishScroll = () => {
        // viewX is 1 and buffer has POINTS+1 — drop oldest, snap viewX to 0.
        // Same pixels: window [1..POINTS] of old buffer ≡ [0..POINTS-1] of trimmed.
        settle(realRef.current.slice(-POINTS));

        const queued = queueRef.current;
        queueRef.current = null;
        if (queued) appendRef.current(queued);
    };

    const runPan = () => {
        const started = performance.now();
        cancelPan();

        const tick = (now: number) => {
            const t = Math.min(1, (now - started) / SCROLL_MS);
            setViewX(t);

            if (t < 1) {
                rafRef.current = requestAnimationFrame(tick);
            } else {
                finishScroll();
            }
        };

        rafRef.current = requestAnimationFrame(tick);
    };

    const appendSample = (sample: Sample) => {
        if (busyRef.current) {
            queueRef.current = sample;
            return;
        }

        const current = realRef.current;
        if (current.at(-1)?.index === sample.index) return;

        if (current.length < POINTS) {
            const next = [...current, sample];
            realRef.current = next;
            setBuffer(next);
            return;
        }

        busyRef.current = true;
        const live = [...current.slice(-POINTS), sample];
        // Post-pan real data (oldest dropped) — finishScroll reads this.
        realRef.current = live.slice(1);
        setViewX(0);
        setBuffer(live);
        runPan();
    };

    appendRef.current = appendSample;

    useEffect(() => {
        if (data.length === 0) {
            settle([]);
            return;
        }

        const latest = data.at(-1);
        if (!latest) return;

        const localLatest = realRef.current.at(-1);

        if (!localLatest || latest.index < localLatest.index || latest.index > localLatest.index + 1) {
            settle(data);
            return;
        }

        if (latest.index === localLatest.index) return;

        appendSample(latest);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data]);

    useEffect(() => () => cancelPan(), []);

    const values = series.flatMap((s) => buffer.map((sample) => sample[s.key]));
    const peak = values.reduce((m, v) => Math.max(m, v), 0);

    // Freeze Y while panning so the line doesn't vertically jump mid-scroll.
    if (!busyRef.current) {
        if (peak > yMaxRef.current) {
            yMaxRef.current = Math.max(peak * 1.15, floor);
        } else if (peak > 0 && peak < yMaxRef.current * 0.45) {
            yMaxRef.current = Math.max(peak * 1.15, floor);
        } else if (yMaxRef.current < floor) {
            yMaxRef.current = floor;
        }
    }

    const yMax = Math.max(yMaxRef.current, floor);
    const length = buffer.length;

    if (length < 2) {
        return <div className='h-full w-full' />;
    }

    const span = POINTS - 1;
    // Warm-up: pin samples to the right edge so the line grows leftward
    // instead of a tiny scribble stuck on the left of an empty chart.
    const xOffset = length <= POINTS ? Math.max(0, POINTS - length) : 0;

    const toPoints = (key: SeriesKey) =>
        buffer
            .map((sample, index) => {
                const y = 1 - Math.min(1, Math.max(0, sample[key] / yMax));
                return `${xOffset + index},${y}`;
            })
            .join(' ');

    return (
        <svg className='h-full w-full' viewBox={`${viewX} 0 ${span} 1`} preserveAspectRatio='none' aria-hidden>
            {series.map((s) => (
                <polyline
                    key={s.key}
                    fill='none'
                    stroke={s.color}
                    strokeWidth={1.6}
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    vectorEffect='non-scaling-stroke'
                    points={toPoints(s.key)}
                />
            ))}
        </svg>
    );
};

const StatGraphs = () => {
    const { t } = useTranslation();
    const status = ServerContext.useStoreState((state) => state.status.value);
    const limits = ServerContext.useStoreState((state) => state.server.data?.limits);
    const uuid = ServerContext.useStoreState((state) => state.server.data?.uuid);
    const previous = useRef<Record<'tx' | 'rx', number>>({ tx: -1, rx: -1 });
    const [liveTarget, setLiveTarget] = useState<LiveStats>(EMPTY_STATS);
    const [samples, setSamples] = useState<Sample[]>(() => readCachedSamples(uuid));
    const live = useSmoothLive(liveTarget);

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
                    setLiveTarget((current) => (current.uptime > 0 ? current : { ...current, uptime: latest.uptime }));
                    previous.current = { tx: latest.tx, rx: latest.rx };
                }
            })
            .catch((error) => console.error(error));
    }, [uuid]);

    useEffect(() => {
        if (status !== 'offline') return;

        setSamples([]);
        setLiveTarget(EMPTY_STATS);
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

        setLiveTarget({
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
    const offline = status === 'offline';
    const loading = samples.length === 0 && !offline;
    const chartData = loading ? [] : samples;

    const cpuValue =
        limits?.cpu && limits.cpu > 0 ? `${live.cpu.toFixed(1)}% / ${limits.cpu}%` : `${live.cpu.toFixed(1)}%`;

    const memoryValue =
        limits?.memory && limits.memory > 0
            ? `${bytesToString(live.memory)} / ${bytesToString(mbToBytes(limits.memory))}`
            : bytesToString(live.memory);

    const cpuSeries = useMemo(() => [{ key: 'cpu' as const, color: '#f1995a' }], []);
    const memorySeries = useMemo(() => [{ key: 'memory' as const, color: '#52a9ff' }], []);
    const networkSeries = useMemo(
        () => [
            { key: 'inbound' as const, color: '#5eead4' },
            { key: 'outbound' as const, color: '#c084fc' },
        ],
        [],
    );

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

            {uuid && (
                <div className='rounded-2xl border border-mocha-400 bg-mocha-500 p-4'>
                    <p className='text-xs font-semibold uppercase tracking-wide text-cream-400/60'>
                        {t('server.console.server_uuid')}
                    </p>
                    <CopyOnClick text={uuid}>
                        <div className='mt-1 truncate text-sm font-medium text-cream-50 tabular-nums'>{uuid}</div>
                    </CopyOnClick>
                </div>
            )}

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

            <ChartBlock title={t('server.console.cpu')} value={<span className='tabular-nums'>{cpuValue}</span>}>
                {loading ? (
                    <div className='flex h-full items-center justify-center text-xs text-cream-400/40'>
                        {t('common.loading')}
                    </div>
                ) : (
                    <LiveSparkline data={chartData} series={cpuSeries} floor={1} />
                )}
            </ChartBlock>

            <ChartBlock title={t('server.console.memory')} value={<span className='tabular-nums'>{memoryValue}</span>}>
                {loading ? (
                    <div className='flex h-full items-center justify-center text-xs text-cream-400/40'>
                        {t('common.loading')}
                    </div>
                ) : (
                    <LiveSparkline data={chartData} series={memorySeries} floor={64} />
                )}
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
                {loading ? (
                    <div className='flex h-full items-center justify-center text-xs text-cream-400/40'>
                        {t('common.loading')}
                    </div>
                ) : (
                    <LiveSparkline data={chartData} series={networkSeries} floor={1024} />
                )}
            </ChartBlock>
        </div>
    );
};

export default StatGraphs;
