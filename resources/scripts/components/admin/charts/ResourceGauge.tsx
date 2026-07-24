import { Pie, type PieTooltipProps } from '@nivo/pie';

function gaugeColor(pct: number): string {
    if (pct >= 80) return '#f87171';
    if (pct >= 60) return '#fbbf24';
    return '#34d399';
}

interface ResourceGaugeProps {
    value: number;
    label: string;
    sublabel: string;
}

function GaugeTooltip({ datum }: PieTooltipProps<{ id: string; value: number; color: string }>) {
    if (datum.id !== 'used') return null;
    return (
        <div className='rounded-lg border border-mocha-400 bg-mocha-600 px-3 py-2 text-xs shadow-xl'>
            <span className='font-semibold text-cream-400'>
                {datum.label}: {datum.formattedValue}%
            </span>
        </div>
    );
}

export function ResourceGauge({ value, label, sublabel }: ResourceGaugeProps) {
    const clamped = Math.max(0, Math.min(100, value));
    const color = gaugeColor(clamped);

    const data = [
        { id: 'used', value: clamped, color },
        { id: 'free', value: Math.max(0.5, 100 - clamped), color: '#29241f' },
    ];

    return (
        <div className='flex flex-col items-center gap-2'>
            <div className='relative' style={{ width: 120, height: 100 }}>
                <Pie
                    data={data}
                    width={120}
                    height={100}
                    startAngle={-225}
                    endAngle={45}
                    innerRadius={36}
                    padAngle={0}
                    borderWidth={0}
                    isInteractive={true}
                    tooltip={GaugeTooltip}
                    enableArcLabels={false}
                    enableArcLinkLabels={false}
                    fit={false}
                />
                <div className='absolute inset-0 flex items-center justify-center pb-2 pointer-events-none'>
                    <span className='text-xl font-bold text-cream-400 tabular-nums leading-none'>
                        {Math.round(clamped)}%
                    </span>
                </div>
            </div>
            <div className='text-center'>
                <p className='text-sm font-semibold text-cream-400'>{label}</p>
                <p className='text-xs text-mocha-100/60'>{sublabel}</p>
            </div>
        </div>
    );
}
