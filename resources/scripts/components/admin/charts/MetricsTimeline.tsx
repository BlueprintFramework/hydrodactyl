import { type LineSeries, ResponsiveLine } from '@nivo/line';
import type { MetricsSample } from '@/api/admin/metrics';

interface MetricsTimelineProps {
    samples: MetricsSample[];
}

function formatTime(isoStr: string): string {
    const d = new Date(isoStr);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

export function MetricsTimeline({ samples }: MetricsTimelineProps) {
    const cpuData: LineSeries[] = [
        {
            id: 'CPU',
            data: samples.map((s) => ({ x: formatTime(s.timestamp), y: s.cpu })),
        },
    ];
    const memData: LineSeries[] = [
        {
            id: 'Memory',
            data: samples.map((s) => ({
                x: formatTime(s.timestamp),
                y: s.memory_total > 0 ? (s.memory_used / s.memory_total) * 100 : 0,
            })),
        },
    ];
    const diskData: LineSeries[] = [
        {
            id: 'Disk',
            data: samples.map((s) => ({
                x: formatTime(s.timestamp),
                y: s.disk_total > 0 ? (s.disk_used / s.disk_total) * 100 : 0,
            })),
        },
    ];

    const allSeries = [...cpuData, ...memData, ...diskData];
    const colorMap: Record<string, string> = {
        CPU: '#fa4e49',
        Memory: '#fbbf24',
        Disk: '#34d399',
    };

    return (
        <div className='h-56 w-full'>
            <ResponsiveLine
                data={allSeries}
                margin={{ top: 12, right: 12, bottom: 12, left: 12 }}
                xScale={{ type: 'point' }}
                yScale={{ type: 'linear', min: 0, max: 100 }}
                curve='monotoneX'
                axisBottom={null}
                axisLeft={null}
                enableGridY
                enablePoints={false}
                enableArea
                areaOpacity={0.08}
                enableSlices='x'
                sliceTooltip={({ slice }) => (
                    <div className='rounded-lg border border-mocha-400 bg-mocha-500 px-3 py-2 shadow-lg'>
                        <p className='text-xs font-semibold text-cream-400 mb-1'>
                            {String(slice.points[0]?.data.x ?? '')}
                        </p>
                        {slice.points.map((pt) => (
                            <div key={pt.id} className='flex items-center gap-2 text-xs'>
                                <span
                                    className='inline-block h-2 w-2 rounded-full'
                                    style={{ backgroundColor: colorMap[pt.seriesId as string] ?? '#888' }}
                                />
                                <span className='text-mocha-100/70'>{String(pt.seriesId)}:</span>
                                <span className='text-cream-400 font-mono tabular-nums'>
                                    {typeof pt.data.y === 'number' ? pt.data.y.toFixed(1) : String(pt.data.y ?? 0)}%
                                </span>
                            </div>
                        ))}
                    </div>
                )}
                theme={{
                    grid: {
                        line: { stroke: '#29241f', strokeWidth: 1 },
                    },
                    crosshair: {
                        line: { stroke: '#433b32', strokeWidth: 1, strokeDasharray: '4 4' },
                    },
                }}
                colors={(d) => colorMap[d.id as string] ?? '#888'}
                lineWidth={2}
                motionConfig='slow'
            />
        </div>
    );
}
