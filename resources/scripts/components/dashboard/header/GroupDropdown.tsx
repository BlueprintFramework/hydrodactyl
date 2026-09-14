import { Folder } from '@gravity-ui/icons';
import { useMemo } from 'react';
import type { FilterOption } from '@/api/getFilterOptions';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface GroupDropdownProps {
    groups: FilterOption[];
    activeGroupId?: number;
    onGroupChange: (groupId: number | undefined) => void;
}

const GroupDropdown = ({ groups, activeGroupId, onGroupChange }: GroupDropdownProps) => {
    const activeLabel = useMemo(() => {
        if (!activeGroupId) return null;
        const group = groups.find((g) => g.value === activeGroupId);
        return group?.label || null;
    }, [groups, activeGroupId]);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    size='sm'
                    variant='secondary'
                    aria-label={activeLabel ? `Group: ${activeLabel}` : 'Filter by group'}
                    className='h-11 sm:h-8 px-2 sm:px-3 gap-1 rounded-full hover:cursor-pointer'
                >
                    <div className='flex flex-row items-center gap-1.5'>
                        <Folder width={16} height={16} />
                        <span className='hidden sm:inline max-w-[140px] truncate'>{activeLabel || 'Groups'}</span>
                    </div>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                className='flex flex-col gap-1 z-99999 hover:cursor-pointer max-h-[40vh] overflow-y-auto'
                sideOffset={8}
            >
                {groups.length === 0 ? (
                    <DropdownMenuItem disabled className='opacity-50'>
                        No groups available
                    </DropdownMenuItem>
                ) : (
                    groups.map((group) => (
                        <DropdownMenuItem
                            key={group.value}
                            onSelect={() => onGroupChange(group.value === activeGroupId ? undefined : group.value)}
                            className={group.value === activeGroupId ? 'bg-cream-400/20' : ''}
                        >
                            <span className='flex items-center justify-between w-full gap-4'>
                                {group.label}
                                {group.value === activeGroupId && <span className='text-xs opacity-60'>&#10003;</span>}
                            </span>
                        </DropdownMenuItem>
                    ))
                )}
                {activeGroupId && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={() => onGroupChange(undefined)} className='text-red-400'>
                            Clear Group Filter
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default GroupDropdown;
