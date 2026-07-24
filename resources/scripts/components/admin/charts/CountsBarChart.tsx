import { type BarTooltipProps, ResponsiveBar } from '@nivo/bar';

interface CountsBarChartProps {
    counts: {
        servers: number;
        nodes: number;
        users: number;
        locations: number;
        nests: number;
        buckets: number;
    };
}

function CountsTooltip({ data }: BarTooltipProps) {
    return (
        <div className='rounded-lg border border-mocha-400 bg-mocha-600 px-3 py-2 text-xs shadow-xl'>
            <span className='font-semibold text-cream-400'>
                {data.entity}: {Number(data.count)} {Number(data.count) === 1 ? 'item' : 'items'}
            </span>
        </div>
    );
}

export function CountsBarChart({ counts }: CountsBarChartProps) {
    const data = [
        { entity: 'Servers', count: counts.servers, color: '#fa4e49' },
        { entity: 'Nodes', count: counts.nodes, color: '#f59e0b' },
        { entity: 'Users', count: counts.users, color: '#34d399' },
        { entity: 'Locations', count: counts.locations, color: '#60a5fa' },
        { entity: 'Nests', count: counts.nests, color: '#a78bfa' },
        { entity: 'Buckets', count: counts.buckets, color: '#f472b6' },
    ] as Record<string, string | number>[];

    return (
        <div className='h-48 w-full'>
            <ResponsiveBar
                data={data}
                keys={['count']}
                indexBy='entity'
                margin={{ top: 12, right: 12, bottom: 24, left: 12 }}
                padding={0.3}
                enableGridY={false}
                enableLabel={false}
                axisBottom={{
                    tickSize: 0,
                    tickPadding: 8,
                }}
                axisLeft={null}
                colors={(d) => String((d.data as Record<string, unknown>).color)}
                borderRadius={4}
                tooltip={CountsTooltip}
                motionConfig='slow'
            />
        </div>
    );
}
