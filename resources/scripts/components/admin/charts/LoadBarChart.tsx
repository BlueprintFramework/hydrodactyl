import { type BarTooltipProps, ResponsiveBar } from '@nivo/bar';

interface LoadBarChartProps {
    loads: number[];
}

function LoadTooltip({ data }: BarTooltipProps) {
    return (
        <div className='rounded-lg border border-mocha-400 bg-mocha-600 px-3 py-2 text-xs shadow-xl'>
            <span className='font-semibold text-cream-400'>
                {data.minute}: {Number(data.load).toFixed(2)} avg
            </span>
        </div>
    );
}

export function LoadBarChart({ loads }: LoadBarChartProps) {
    const data = loads.map((v, i) => ({
        minute: `${i + 1}m`,
        load: v,
        color: v > 2 ? '#f87171' : v > 1 ? '#fbbf24' : '#34d399',
    })) as Record<string, string | number>[];

    return (
        <div className='h-32 w-full'>
            <ResponsiveBar
                data={data}
                keys={['load']}
                indexBy='minute'
                margin={{ top: 4, right: 4, bottom: 4, left: 4 }}
                padding={0.3}
                enableGridY={false}
                enableLabel={false}
                axisBottom={null}
                axisLeft={null}
                colors={(d) => String((d.data as Record<string, unknown>).color)}
                borderRadius={3}
                tooltip={LoadTooltip}
                motionConfig='slow'
            />
        </div>
    );
}
