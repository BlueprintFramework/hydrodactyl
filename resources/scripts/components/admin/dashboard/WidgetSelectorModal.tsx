import { HugeiconsIcon } from '@hugeicons/react';
import { memo, useCallback, useState } from 'react';
import { Dialog } from '@/components/elements/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { WIDGET_TYPES } from './widgetDefinitions';
import { WIDGET_SIZES, type WidgetSize } from './widgetTypes';

interface WidgetSelectorModalProps {
    open: boolean;
    onClose: () => void;
    onAddWidget: (typeId: string, size: WidgetSize) => void;
}

const SIZE_LABELS: Record<WidgetSize, string> = {
    sm: 'Small',
    md: 'Medium',
    lg: 'Large',
    xl: 'Extra Large',
};

export const WidgetSelectorModal = memo(({ open, onClose, onAddWidget }: WidgetSelectorModalProps) => {
    const [selectedSize, setSelectedSize] = useState<WidgetSize>('md');
    const [hoveredType, setHoveredType] = useState<string | null>(null);

    const handleAdd = useCallback(
        (typeId: string) => {
            onAddWidget(typeId, selectedSize);
            onClose();
        },
        [onAddWidget, selectedSize, onClose],
    );

    return (
        <Dialog open={open} title='Add Widget' description='Choose a widget to add to your dashboard' onClose={onClose}>
            {/* Size selector */}
            <div className='flex flex-wrap items-center gap-1.5 sm:gap-2 mb-4'>
                <span className='text-xs font-semibold text-mocha-100/60 uppercase tracking-wider mr-1 sm:mr-2'>
                    Size:
                </span>
                {Object.entries(SIZE_LABELS).map(([size, label]) => (
                    <Button
                        key={size}
                        variant={selectedSize === size ? 'default' : 'secondary'}
                        size='sm'
                        onClick={() => setSelectedSize(size as WidgetSize)}
                        className={cn(
                            'text-[10px] sm:text-xs h-6 sm:h-7 px-2 sm:px-2.5',
                            selectedSize === size && 'ring-2 ring-brand/50',
                        )}
                    >
                        {label}
                    </Button>
                ))}
            </div>

            {/* Widget grid */}
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 max-h-[50vh] sm:max-h-[400px] overflow-y-auto pr-1'>
                {WIDGET_TYPES.map((widgetType) => {
                    const sizeConfig = WIDGET_SIZES[selectedSize];
                    const isHovered = hoveredType === widgetType.id;

                    return (
                        <button
                            type='button'
                            key={widgetType.id}
                            onClick={() => handleAdd(widgetType.id)}
                            onMouseEnter={() => setHoveredType(widgetType.id)}
                            onMouseLeave={() => setHoveredType(null)}
                            className={cn(
                                'group flex items-start gap-2.5 sm:gap-3 rounded-xl border p-3 sm:p-4 text-left transition-all duration-200',
                                'border-mocha-400 hover:border-brand/40 hover:bg-mocha-400/20 cursor-pointer',
                                isHovered && 'border-brand/40 bg-mocha-400/20 shadow-lg shadow-brand/5',
                            )}
                        >
                            <div
                                className={cn(
                                    'flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg transition-colors duration-200',
                                    'bg-mocha-400/60 text-cream-400 group-hover:bg-brand/20 group-hover:text-brand',
                                )}
                            >
                                <HugeiconsIcon icon={widgetType.icon} size={18} />
                            </div>
                            <div className='flex-1 min-w-0'>
                                <p className='text-sm font-semibold text-cream-400 mb-0.5'>{widgetType.title}</p>
                                <p className='text-xs text-mocha-100/60 line-clamp-2'>{widgetType.description}</p>
                                <div className='flex items-center gap-1.5 mt-2'>
                                    <span className='text-[10px] text-mocha-100/40 uppercase tracking-wider'>
                                        {sizeConfig.w}×{sizeConfig.h} grid
                                    </span>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </Dialog>
    );
});

WidgetSelectorModal.displayName = 'WidgetSelectorModal';
