import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface Props {
    title?: ReactNode;
    className?: string;
    children: ReactNode;
}

const SoftwareCard = ({ title, className, children }: Props) => (
    <div
        className={cn(
            'relative overflow-hidden rounded-2xl border border-mocha-400 bg-mocha-500 p-6 sm:p-8',
            className,
        )}
    >
        {title && (
            <div className='mb-4'>
                {typeof title === 'string' ? (
                    <p className='text-xl font-extrabold tracking-tight text-cream-100'>{title}</p>
                ) : (
                    title
                )}
            </div>
        )}
        <div className='h-full w-full'>{children}</div>
    </div>
);

export default SoftwareCard;
