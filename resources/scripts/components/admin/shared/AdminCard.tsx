import type { ReactNode } from 'react';

interface AdminCardProps {
    children: ReactNode;
    header?: ReactNode;
    footer?: ReactNode;
    className?: string;
    noPadding?: boolean;
}

export function AdminCard({ children, header, footer, className = '', noPadding = false }: AdminCardProps) {
    return (
        <div className={`bg-mocha-500 border border-mocha-400 rounded-xl overflow-hidden ${className}`}>
            {header && <div className='px-5 py-4 border-b border-mocha-400 flex items-center space-x-2'>{header}</div>}
            <div className={noPadding ? '' : 'p-5'}>{children}</div>
            {footer && (
                <div className='px-5 py-4 border-t border-mocha-400 flex items-center justify-end gap-3'>{footer}</div>
            )}
        </div>
    );
}
