import { FilterIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useMemo } from 'react';
import type { FilterOption, FilterOptions } from '@/api/getFilterOptions';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type FilterCategory = 'owner_id' | 'nest_id' | 'egg_id' | 'node_id';

interface CategoryGroup {
    category: FilterCategory;
    label: string;
    options: FilterOption[];
}

interface FilterDropdownProps {
    filterOptions: FilterOptions;
    activeField?: FilterCategory;
    activeValue?: number;
    onFilterChange: (field: FilterCategory | undefined, value: number | undefined) => void;
}

const FilterDropdown = ({ filterOptions, activeField, activeValue, onFilterChange }: FilterDropdownProps) => {
    const groups: CategoryGroup[] = useMemo(
        () => [
            { category: 'owner_id', label: 'Owner', options: filterOptions.owners },
            { category: 'nest_id', label: 'Nest', options: filterOptions.nests },
            { category: 'egg_id', label: 'Egg', options: filterOptions.eggs },
            { category: 'node_id', label: 'Node', options: filterOptions.nodes },
        ],
        [filterOptions],
    );

    const activeGroup = useMemo(() => groups.find((g) => g.category === activeField), [groups, activeField]);

    const activeLabel = useMemo(() => {
        if (!activeGroup || activeValue === undefined) return null;
        const option = activeGroup.options.find((o) => o.value === activeValue);
        return option ? `${activeGroup.label}: ${option.label}` : null;
    }, [activeGroup, activeValue]);

    const hasActiveFilter = activeField && activeValue !== undefined;
    const totalOptions = groups.reduce((sum, g) => sum + g.options.length, 0);
    const allEmpty = totalOptions === 0;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    size={'sm'}
                    variant={'secondary'}
                    aria-label={activeLabel ? `Filter: ${activeLabel}` : 'Filter servers'}
                    className={`h-11 sm:h-8 px-2 sm:px-3 gap-1 rounded-full hover:cursor-pointer ${
                        hasActiveFilter ? 'border-accent/50' : ''
                    }`}
                >
                    <div className='flex flex-row items-center gap-1.5'>
                        <HugeiconsIcon size={16} strokeWidth={2} icon={FilterIcon} className='size-4' />
                        <span className='hidden sm:inline max-w-[140px] truncate'>{activeLabel || 'Filter'}</span>
                    </div>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                className='flex flex-col gap-1 z-99999 hover:cursor-pointer max-h-[60vh] overflow-y-auto'
                sideOffset={8}
            >
                {allEmpty ? (
                    <DropdownMenuItem disabled className='opacity-50'>
                        No filter options available
                    </DropdownMenuItem>
                ) : (
                    groups.map((group) =>
                        group.options.length === 0 ? null : (
                            <DropdownMenuSub key={group.category}>
                                <DropdownMenuSubTrigger className='font-medium'>
                                    {group.label} ({group.options.length})
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent className='max-h-[40vh] overflow-y-auto'>
                                    <DropdownMenuItem
                                        onSelect={() => onFilterChange(undefined, undefined)}
                                        className='text-red-400 text-xs'
                                    >
                                        Clear this filter
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    {group.options.map((option) => (
                                        <DropdownMenuItem
                                            key={`${group.category}-${option.value}`}
                                            onSelect={() => onFilterChange(group.category, option.value)}
                                            className={
                                                activeField === group.category && activeValue === option.value
                                                    ? 'bg-accent/20'
                                                    : ''
                                            }
                                        >
                                            {option.label}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuSubContent>
                            </DropdownMenuSub>
                        ),
                    )
                )}
                {hasActiveFilter && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onSelect={() => onFilterChange(undefined, undefined)}
                            className='text-red-400'
                        >
                            Clear All Filters
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default FilterDropdown;
