import { Cancel01Icon, Drag01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { DashboardWidget } from './widgetTypes';

interface ChartCardProps {
    widget: DashboardWidget;
    title: string;
    isEditing: boolean;
    onRemove?: (id: string) => void;
    children: React.ReactNode;
}

export const ChartCard = memo(({ widget, title, isEditing, onRemove, children }: ChartCardProps) => {
    return (
        <TooltipProvider>
            <section
                aria-label={title}
                className={cn(
                    'group relative h-full rounded-xl border bg-mocha-500 overflow-hidden transition-all duration-200',
                    isEditing
                        ? 'border-brand/40 shadow-lg shadow-brand/5 hover:shadow-xl hover:shadow-brand/10'
                        : 'border-mocha-400 hover:border-mocha-300',
                )}
            >
                {/* Drag handle + actions — visible in edit mode */}
                {isEditing && (
                    <div className='absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-3 py-2 bg-gradient-to-b from-mocha-500/95 to-mocha-500/0 pointer-events-none'>
                        {/* Drag handle */}
                        <div className='flex items-center gap-1.5 pointer-events-auto cursor-grab active:cursor-grabbing drag-handle'>
                            <HugeiconsIcon icon={Drag01Icon} size={14} className='text-mocha-100/50' />
                            <span className='text-[10px] font-semibold uppercase tracking-wider text-mocha-100/50 select-none'>
                                Drag
                            </span>
                        </div>

                        {/* Action buttons */}
                        <div className='flex items-center gap-1 pointer-events-auto'>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant='ghost'
                                        size='icon'
                                        className='h-6 w-6 rounded-md'
                                        onClick={() => onRemove?.(widget.id)}
                                    >
                                        <HugeiconsIcon icon={Cancel01Icon} size={12} className='text-red-400' />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side='bottom'>
                                    <p>Remove widget</p>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                    </div>
                )}

                {/* Card content */}
                <div className={cn('h-full p-3 sm:p-5', isEditing && 'pt-10')}>
                    <h3 className='text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-mocha-100/60 mb-2 sm:mb-3 select-none'>
                        {title}
                    </h3>
                    <div className='h-[calc(100%-1.5rem)] sm:h-[calc(100%-1.75rem)]'>{children}</div>
                </div>

                {/* Edit mode border animation */}
                {isEditing && (
                    <div className='absolute inset-0 rounded-xl border-2 border-brand/20 pointer-events-none animate-pulse' />
                )}
            </section>
        </TooltipProvider>
    );
});

ChartCard.displayName = 'ChartCard';
