import { FilterIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useState } from 'react';
import type { FilterOption, FilterOptions } from '@/api/getFilterOptions';
import { Button } from '@/components/ui/button';
import FilterDropdown from './FilterDropdown';
import GroupDropdown from './GroupDropdown';
import SortDropdown, { type SortPreset } from './SortDropdown';

interface FiltersMenuProps {
    filterOptions: FilterOptions;
    groups: FilterOption[];
    activeField?: 'owner_id' | 'nest_id' | 'egg_id' | 'node_id';
    activeValue?: number;
    activeGroupId?: number;
    sortValue?: string;
    sortPresets: SortPreset[];
    showGroups: boolean;
    onFilterChange: (
        field: 'owner_id' | 'nest_id' | 'egg_id' | 'node_id' | undefined,
        value: number | undefined,
    ) => void;
    onGroupChange: (groupId: number | undefined) => void;
    onSortChange: (value: string) => void;
}

const FiltersMenu = ({
    filterOptions,
    groups,
    activeField,
    activeValue,
    activeGroupId,
    sortValue,
    sortPresets,
    showGroups,
    onFilterChange,
    onGroupChange,
    onSortChange,
}: FiltersMenuProps) => {
    const [open, setOpen] = useState(false);

    return (
        <div className='relative'>
            <Button
                size='sm'
                variant='secondary'
                aria-label='Open filters'
                aria-expanded={open}
                onClick={() => setOpen((value) => !value)}
                className='h-11 sm:h-8 px-2 sm:px-3 gap-1 rounded-full hover:cursor-pointer'
            >
                <div className='flex flex-row items-center gap-1.5'>
                    <HugeiconsIcon size={16} strokeWidth={2} icon={FilterIcon} className='size-4' />
                    <span className='hidden sm:inline'>Filters</span>
                </div>
            </Button>
            {open && (
                <>
                    <div className='fixed inset-0 z-40' onClick={() => setOpen(false)} aria-hidden />
                    <div className='absolute right-0 z-50 mt-2 flex w-60 flex-col gap-2 rounded-xl border border-cream-500/20 bg-mocha-500 p-3 shadow-xl shadow-black/40'>
                        {showGroups && (
                            <GroupDropdown
                                groups={groups}
                                activeGroupId={activeGroupId}
                                onGroupChange={onGroupChange}
                            />
                        )}
                        <FilterDropdown
                            filterOptions={filterOptions}
                            activeField={activeField}
                            activeValue={activeValue}
                            onFilterChange={onFilterChange}
                        />
                        <SortDropdown presets={sortPresets} value={sortValue} onSortChange={onSortChange} />
                    </div>
                </>
            )}
        </div>
    );
};

export default FiltersMenu;
