import { memo } from 'react';

interface ChartCardProps {
    title: string;
    children: React.ReactNode;
}

export const ChartCard = memo(({ title, children }: ChartCardProps) => {
    return (
        <section
            aria-label={title}
            className='group relative h-full rounded-xl border border-mocha-400 bg-mocha-500 overflow-hidden transition-all duration-200 hover:border-mocha-300'
        >
            <div className='h-full p-3 sm:p-5'>
                <h3 className='text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-mocha-100/60 mb-2 sm:mb-3 select-none'>
                    {title}
                </h3>
                <div className='h-[calc(100%-1.5rem)] sm:h-[calc(100%-1.75rem)]'>{children}</div>
            </div>
        </section>
    );
});

ChartCard.displayName = 'ChartCard';
