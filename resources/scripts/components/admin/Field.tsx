export const Field = ({
    label,
    hint,
    error,
    children,
}: {
    label: string;
    hint?: string;
    error?: string;
    children: React.ReactNode;
}) => (
    <div className='block'>
        <span className='mb-1 block text-xs font-medium text-cream-400/70'>{label}</span>
        {children}
        {error ? (
            <span className='mt-1 block text-xs text-brand-600'>{error}</span>
        ) : hint ? (
            <span className='mt-1 block text-xs text-cream-400/50'>{hint}</span>
        ) : null}
    </div>
);
