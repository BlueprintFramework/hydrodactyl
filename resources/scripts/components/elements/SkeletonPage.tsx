import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export interface SkeletonPageProps {
    className?: string;
    variant?: 'dashboard' | 'server' | 'default';
}

export const SkeletonPage = ({ className, variant = 'default' }: SkeletonPageProps) => {
    if (variant === 'dashboard') {
        return (
            <div
                className={cn(
                    'w-full max-w-[120rem] mx-auto flex flex-col flex-1 h-full p-7 gap-6 animate-pulse',
                    className,
                )}
            >
                {/* Header skeleton */}
                <div className='flex items-center justify-between gap-4'>
                    <div className='flex flex-col gap-2'>
                        <Skeleton className='h-8 w-48 rounded-lg bg-mocha-400/80' />
                        <Skeleton className='h-4 w-72 rounded-md bg-mocha-400/50' />
                    </div>
                    <div className='flex items-center gap-3'>
                        <Skeleton className='h-10 w-32 rounded-xl bg-mocha-400/60' />
                        <Skeleton className='h-10 w-24 rounded-xl bg-mocha-400/60' />
                    </div>
                </div>

                {/* Server list cards skeleton */}
                <div className='flex flex-col gap-4 mt-2'>
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div
                            key={i}
                            className='flex items-center justify-between p-6 rounded-2xl border border-mocha-400/60 bg-mocha-500/80 shadow-xs'
                        >
                            <div className='flex items-center gap-4'>
                                <Skeleton className='h-10 w-10 rounded-xl bg-mocha-400/70' />
                                <div className='flex flex-col gap-2'>
                                    <Skeleton className='h-5 w-48 rounded-md bg-mocha-400/80' />
                                    <Skeleton className='h-3.5 w-32 rounded-md bg-mocha-400/50' />
                                </div>
                            </div>
                            <div className='hidden sm:flex items-center gap-4'>
                                <Skeleton className='h-8 w-20 rounded-md bg-mocha-400/60' />
                                <Skeleton className='h-8 w-24 rounded-md bg-mocha-400/60' />
                                <Skeleton className='h-8 w-24 rounded-md bg-mocha-400/60' />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (variant === 'server') {
        return (
            <div
                className={cn(
                    'w-full max-w-[120rem] mx-auto flex flex-col flex-1 h-full p-6 gap-6 animate-pulse',
                    className,
                )}
            >
                {/* Server header */}
                <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-3'>
                        <Skeleton className='h-6 w-24 rounded-full bg-mocha-400/80' />
                        <Skeleton className='h-7 w-48 rounded-lg bg-mocha-400/80' />
                    </div>
                    <div className='flex gap-2'>
                        <Skeleton className='h-9 w-20 rounded-xl bg-mocha-400/60' />
                        <Skeleton className='h-9 w-20 rounded-xl bg-mocha-400/60' />
                        <Skeleton className='h-9 w-20 rounded-xl bg-mocha-400/60' />
                    </div>
                </div>

                {/* Console + Stat layout skeleton */}
                <div className='flex flex-col lg:flex-row gap-4 flex-1 min-h-0'>
                    <div className='flex flex-col flex-1 gap-3 min-h-[300px]'>
                        <Skeleton className='w-full h-full min-h-[360px] rounded-2xl bg-mocha-500/80 border border-mocha-400/50' />
                        <Skeleton className='w-full h-11 rounded-xl bg-mocha-400/70' />
                    </div>
                    <div className='w-full lg:w-80 flex flex-col gap-4 shrink-0'>
                        <Skeleton className='h-20 w-full rounded-xl bg-mocha-500/70 border border-mocha-400/50' />
                        <Skeleton className='h-20 w-full rounded-xl bg-mocha-500/70 border border-mocha-400/50' />
                        <Skeleton className='h-40 w-full rounded-xl bg-mocha-500/70 border border-mocha-400/50' />
                        <Skeleton className='h-40 w-full rounded-xl bg-mocha-500/70 border border-mocha-400/50' />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className={cn(
                'w-full max-w-[120rem] mx-auto flex flex-col flex-1 h-full p-7 gap-6 animate-pulse',
                className,
            )}
        >
            <div className='flex items-center justify-between'>
                <div className='flex flex-col gap-2'>
                    <Skeleton className='h-8 w-56 rounded-lg bg-mocha-400/80' />
                    <Skeleton className='h-4 w-80 rounded-md bg-mocha-400/50' />
                </div>
                <Skeleton className='h-10 w-28 rounded-xl bg-mocha-400/60' />
            </div>

            <div className='flex flex-col gap-4 mt-2'>
                <Skeleton className='h-32 w-full rounded-2xl bg-mocha-500/80 border border-mocha-400/50' />
                <Skeleton className='h-48 w-full rounded-2xl bg-mocha-500/80 border border-mocha-400/50' />
                <Skeleton className='h-32 w-full rounded-2xl bg-mocha-500/80 border border-mocha-400/50' />
            </div>
        </div>
    );
};

export default SkeletonPage;
