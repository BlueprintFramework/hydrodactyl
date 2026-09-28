import { CloudDownload, CloudUpload } from '@carbon/icons-react';
import { useEffect, useRef, useState } from 'react';
import { Line } from 'react-chartjs-2';
import CopyOnClick from '@/components/elements/CopyOnClick';
import ChartBlock from '@/components/server/console/ChartBlock';
import { useChart, useChartTickLabel } from '@/components/server/console/chart';
import { SocketEvent } from '@/components/server/events';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTranslation } from '@/i18n/I18nProvider';
import { bytesToString, ip } from '@/lib/formatters';
import { hexToRgba } from '@/lib/helpers';
import useWebsocketEvent from '@/plugins/useWebsocketEvent';
import { ServerContext } from '@/state/server';

import formatUptime from '../UptimeDuration';

interface StatsData {
    cpu_absolute: number;
    memory_bytes: number;
    uptime: number;
    network: {
        tx_bytes: number;
        rx_bytes: number;
    };
}

const StatGraphs = () => {
    const { t, locale } = useTranslation();
    const status = ServerContext.useStoreState((state) => state.status.value);
    const limits = ServerContext.useStoreState((state) => state.server.data?.limits);
    const previous = useRef<Record<'tx' | 'rx', number>>({ tx: -1, rx: -1 });

    const cpu = useChartTickLabel(t('server.console.cpu'), limits.cpu, '%', 2, locale);
    const [uptime, setUptime] = useState(0);
    const memory = useChartTickLabel(t('server.console.memory'), limits.memory, 'MiB');
    const network = useChart(t('server.console.network_activity'), {
        sets: 2,
        options: {
            scales: {
                y: {
                    ticks: {
                        callback(value) {
                            return bytesToString(typeof value === 'string' ? parseInt(value, 10) : value, 2, locale);
                        },
                    },
                },
            },
        },
        callback(opts, index) {
            return {
                ...opts,
                label: !index ? t('server.console.network_in') : t('server.console.network_out'),
                borderColor: !index ? '#facc15' : '#60a5fa',
                backgroundColor: hexToRgba(!index ? '#facc15' : '#60a5fa', 0.09),
            };
        },
    });

    // When the server goes offline, clear the charts once. Do NOT list the
    // per-chart `clear` functions in the deps — useChart() recreates them every
    // render, so doing so makes this effect re-fire every render -> clear()
    // calls setData -> re-render -> re-fire, i.e. a "Maximum update depth
    // exceeded" infinite loop. They only close over stable setData/merge, so a
    // status-only dependency is both correct and safe.
    // biome-ignore lint/correctness/useExhaustiveDependencies: intentional — clear fns are unstable, see above.
    useEffect(() => {
        if (status !== 'offline') return;

        cpu.clear();
        memory.clear();
        network.clear();
        setUptime(0);
    }, [status]);

    useWebsocketEvent(SocketEvent.STATS, (data: string) => {
        let values: StatsData;
        try {
            values = JSON.parse(data) as StatsData;
        } catch {
            return;
        }
        setUptime(values.uptime);
        cpu.push(values.cpu_absolute);
        memory.push(Math.floor(values.memory_bytes / 1024 / 1024));

        network.push([
            previous.current.tx < 0 ? 0 : Math.max(0, values.network.tx_bytes - previous.current.tx),
            previous.current.rx < 0 ? 0 : Math.max(0, values.network.rx_bytes - previous.current.rx),
        ]);

        previous.current = {
            tx: values.network.tx_bytes,
            rx: values.network.rx_bytes,
        };
    });

    const allocation = ServerContext.useStoreState((state) => {
        const match = state.server.data?.allocations.find((allocation) => allocation.isDefault);

        return !match ? null : `${match.alias || ip(match.ip)}:${match.port}`;
    });

    const description = ServerContext.useStoreState((state) => state.server.data?.description);

    const allocationText = allocation ?? t('server.console.not_available');

    return (
        <TooltipProvider>
            <div className='flex h-full flex-col gap-4 overflow-y-auto flex-none'>
                <div>
                    <div className='group p-4 justify-between relative rounded-xl border border-[#ffffff11] bg-[#110f0d] flex gap-4 text-sm'>
                        <h3 className='font-extrabold'>{t('server.console.ip_address')}</h3>
                        <CopyOnClick text={allocationText}>
                            <div className='font-medium'>{allocationText}</div>
                        </CopyOnClick>
                    </div>
                </div>
                <div>
                    <div className='group p-4 justify-between relative rounded-xl border border-[#ffffff11] bg-[#110f0d] flex gap-4 text-sm'>
                        <h3 className='font-extrabold'>{t('server.console.uptime')}</h3>
                        <div className='font-medium'>{formatUptime(uptime, t)}</div>
                    </div>
                </div>
                {description && (
                    <div>
                        <div className='group p-4 justify-between relative rounded-xl border border-[#ffffff11] flex-col bg-[#110f0d] flex gap-4 text-sm'>
                            <h3 className='font-extrabold'>{t('server.console.description')}</h3>
                            <div className='font-medium'>{description}</div>
                        </div>
                    </div>
                )}
                <div>
                    <ChartBlock title={t('server.console.cpu')}>
                        <Line aria-label={t('server.console.cpu_usage')} role='img' {...cpu.props} />
                    </ChartBlock>
                </div>
                <div>
                    <ChartBlock title={t('server.console.ram')}>
                        <Line aria-label={t('server.console.memory_usage')} role='img' {...memory.props} />
                    </ChartBlock>
                </div>
                <div>
                    <ChartBlock
                        title={t('server.console.network_activity')}
                        legend={
                            <div className='flex gap-2'>
                                <Tooltip delayDuration={200}>
                                    <TooltipTrigger asChild>
                                        <div className='flex items-center cursor-default'>
                                            <CloudDownload className='mr-2 w-4 h-4 text-yellow-400' />
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent side='top' sideOffset={5}>
                                        {t('server.console.inbound')}
                                    </TooltipContent>
                                </Tooltip>

                                <Tooltip delayDuration={200}>
                                    <TooltipTrigger asChild>
                                        <div className='flex items-center cursor-default'>
                                            <CloudUpload className='w-4 h-4 text-blue-400' />
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent side='top' sideOffset={5}>
                                        {t('server.console.outbound')}
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                        }
                    >
                        <Line aria-label={t('server.console.network_activity_aria')} role='img' {...network.props} />
                    </ChartBlock>
                </div>
            </div>
        </TooltipProvider>
    );
};

export default StatGraphs;
