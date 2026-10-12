import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ChartBlockProps {
    title: string;
    value?: ReactNode;
    hint?: ReactNode;
    children: ReactNode;
    className?: string;
}

export default ({ title, value, hint, children, className }: ChartBlockProps) => (
    <div
        className={cn('group relative overflow-hidden rounded-2xl border border-mocha-400 bg-mocha-500 p-4', className)}
    >
        <div className='flex items-start justify-between gap-3'>
            <div className='min-w-0'>
                <div className='flex items-center gap-2'>
                    <p className='truncate text-sm font-medium text-cream-200'>{title}</p>
                </div>
                {hint && <p className='mt-1 text-[11px] leading-none text-cream-400/40 tabular-nums'>{hint}</p>}
            </div>
            {value && (
                <div className='shrink-0 text-right text-lg font-semibold leading-tight text-cream-50'>{value}</div>
            )}
        </div>
        <div className='relative mt-3 h-32 overflow-hidden'>{children}</div>
    </div>
);
