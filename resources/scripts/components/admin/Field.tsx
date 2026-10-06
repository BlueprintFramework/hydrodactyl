export const Field = ({
    label,
    hint,
    error,
    optional,
    children,
}: {
    label: string;
    hint?: string;
    error?: string;
    optional?: boolean;
    children: React.ReactNode;
}) => (
    <div className='block'>
        <span className='mb-1 flex items-center gap-2 text-xs font-medium text-cream-400/70'>
            {label}
            {optional && (
                <span className='rounded-full bg-mocha-300/60 px-2 py-0.5 text-[10px] font-normal uppercase tracking-wide text-cream-400/60'>
                    Optional
                </span>
            )}
        </span>
        {children}
        {error ? (
            <span className='mt-1 block text-xs text-brand-600'>{error}</span>
        ) : hint ? (
            <span className='mt-1 block text-xs text-cream-400/50'>{hint}</span>
        ) : null}
    </div>
);
