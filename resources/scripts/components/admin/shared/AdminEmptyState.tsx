import type { ReactNode } from 'react';

interface AdminEmptyStateProps {
    title: string;
    description?: string;
    icon?: ReactNode;
    action?: ReactNode;
    className?: string;
}

export function AdminEmptyState({ title, description, icon, action, className = '' }: AdminEmptyStateProps) {
    return (
        <div className={`bg-mocha-500 border border-mocha-400 rounded-xl p-12 text-center ${className}`}>
            {icon && <div className='flex justify-center mb-4 text-mocha-200/60'>{icon}</div>}
            <h3 className='text-lg font-semibold text-cream-400 mb-1'>{title}</h3>
            {description && <p className='text-sm text-mocha-200/80 mb-4 max-w-md mx-auto'>{description}</p>}
            {action && <div>{action}</div>}
        </div>
    );
}
