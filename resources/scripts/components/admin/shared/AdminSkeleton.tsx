interface SkeletonProps {
    className?: string;
}

function SkeletonBar({ className = '' }: SkeletonProps) {
    return <div className={`bg-mocha-400/30 rounded animate-pulse ${className}`} />;
}

export function SkeletonTable({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
    return (
        <div className='bg-mocha-500 border border-mocha-400 rounded-xl overflow-hidden'>
            <table className='w-full text-sm'>
                <thead>
                    <tr className='border-b border-mocha-400'>
                        {Array.from({ length: columns }).map((_, i) => (
                            <th key={i} className='text-left px-4 py-3'>
                                <SkeletonBar className='h-3 w-16' />
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {Array.from({ length: rows }).map((_, row) => (
                        <tr key={row} className='border-b border-mocha-400 last:border-0'>
                            {Array.from({ length: columns }).map((_, col) => (
                                <td key={col} className='px-4 py-3'>
                                    <SkeletonBar className='h-3 w-24' />
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export function SkeletonCards({ count = 4 }: { count?: number }) {
    return (
        <div className='grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3'>
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className='bg-mocha-500 border border-mocha-400 rounded-xl p-5 animate-pulse'>
                    <div className='flex items-center justify-between mb-3'>
                        <div className='h-3 w-16 rounded bg-mocha-400/30' />
                        <div className='h-9 w-9 rounded-lg bg-mocha-400/20' />
                    </div>
                    <div className='h-9 w-14 rounded bg-mocha-400/30 mb-2' />
                    <div className='h-2 w-24 rounded bg-mocha-400/20' />
                </div>
            ))}
        </div>
    );
}

export function SkeletonForm({ fields = 4 }: { fields?: number }) {
    return (
        <div className='bg-mocha-500 border border-mocha-400 rounded-xl p-5 space-y-4'>
            {Array.from({ length: fields }).map((_, i) => (
                <div key={i}>
                    <SkeletonBar className='h-3 w-24 mb-2' />
                    <SkeletonBar className='h-9 w-full' />
                </div>
            ))}
        </div>
    );
}

export function SkeletonChart() {
    return (
        <div className='bg-mocha-500 border border-mocha-400 rounded-xl p-5'>
            <SkeletonBar className='h-4 w-32 mb-4' />
            <div className='flex items-end gap-2 h-24'>
                {Array.from({ length: 6 }).map((_, i) => (
                    <SkeletonBar key={i} className='flex-1' style={{ height: `${30 + Math.random() * 70}%` }} />
                ))}
            </div>
        </div>
    );
}
