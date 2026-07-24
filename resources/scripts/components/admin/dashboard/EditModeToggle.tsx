import { Edit02Icon, ViewIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { memo } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EditModeToggleProps {
    isEditing: boolean;
    onToggle: () => void;
    className?: string;
}

export const EditModeToggle = memo(({ isEditing, onToggle, className }: EditModeToggleProps) => {
    return (
        <Button
            variant={isEditing ? 'attention' : 'secondary'}
            size='sm'
            onClick={onToggle}
            className={cn(
                'gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-semibold transition-all duration-200',
                isEditing && 'ring-2 ring-brand/50 animate-pulse-slow',
                className,
            )}
        >
            <HugeiconsIcon
                icon={isEditing ? ViewIcon : Edit02Icon}
                size={14}
                className={cn('transition-colors', isEditing ? 'text-mocha-500' : 'text-cream-400')}
            />
            <span className='hidden sm:inline'>{isEditing ? 'Done' : 'Customize'}</span>
            <span className='sm:hidden'>{isEditing ? 'Done' : 'Edit'}</span>
        </Button>
    );
});

EditModeToggle.displayName = 'EditModeToggle';
