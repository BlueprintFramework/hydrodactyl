import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface AdminErrorStateProps {
    message: string;
    onRetry?: () => void;
    title?: string;
    icon?: ReactNode;
    className?: string;
}

export function AdminErrorState({
    message,
    onRetry,
    title = 'Something went wrong',
    icon,
    className = '',
}: AdminErrorStateProps) {
    return (
        <div className={`bg-mocha-500 border border-red-400/30 rounded-xl p-12 text-center ${className}`}>
            {icon ?? (
                <div className='flex justify-center mb-4'>
                    <svg
                        className='w-10 h-10 text-red-400/70'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                        aria-hidden='true'
                    >
                        <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth='1.5'
                            d='M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z'
                        />
                    </svg>
                </div>
            )}
            <h3 className='text-lg font-semibold text-cream-400 mb-1'>{title}</h3>
            <p className='text-sm text-mocha-200/80 mb-4 max-w-md mx-auto'>{message}</p>
            {onRetry && (
                <Button variant='secondary' onClick={onRetry}>
                    Try Again
                </Button>
            )}
        </div>
    );
}
