import { SortByDown02Icon, SortByUp02Icon, Sorting01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTranslation } from '@/i18n/I18nProvider';

export interface SortPreset {
    value: string;
    label: string;
}

interface SortDropdownProps {
    presets: SortPreset[];
    // Sort field, prefixed with "-" when descending.
    value?: string;
    onSortChange: (value: string) => void;
}

const SortDropdown = ({ presets, value, onSortChange }: SortDropdownProps) => {
    const { t } = useTranslation();
    const descending = value?.startsWith('-') ?? false;
    const field = descending ? value?.slice(1) : value;
    const currentPreset = useMemo(() => presets.find((p) => p.value === field), [presets, field]);
    const directionLabel = descending ? t('dashboard.sort.descending') : t('dashboard.sort.ascending');

    return (
        <div className='flex items-center gap-1.5 sm:gap-2'>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        size={'sm'}
                        variant={'secondary'}
                        aria-label={
                            currentPreset
                                ? t('dashboard.sort.aria_sorted', { sort: currentPreset.label })
                                : t('dashboard.sort.aria')
                        }
                        className='grow h-11 sm:h-8 px-2 sm:px-3 gap-1 rounded-full hover:cursor-pointer'
                    >
                        <div className='flex flex-row items-center gap-1.5'>
                            <HugeiconsIcon size={16} strokeWidth={2} icon={Sorting01Icon} className='size-4' />
                            <span className='hidden sm:inline'>
                                {currentPreset?.label || t('dashboard.sort.label')}
                            </span>
                        </div>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className='flex flex-col gap-1 z-99999 hover:cursor-pointer' sideOffset={8}>
                    {presets.map((preset) => (
                        <DropdownMenuItem
                            key={preset.value}
                            onSelect={() => onSortChange(descending ? `-${preset.value}` : preset.value)}
                            className={field === preset.value ? 'bg-accent/20' : ''}
                        >
                            <span className='flex items-center justify-between w-full gap-4'>
                                {preset.label}
                                {field === preset.value && <span className='text-xs opacity-60'>&#10003;</span>}
                            </span>
                        </DropdownMenuItem>
                    ))}
                    {value && (
                        <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={() => onSortChange('')} className='text-red-400'>
                                {t('dashboard.sort.clear')}
                            </DropdownMenuItem>
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
            <Button
                size={'sm'}
                variant={'secondary'}
                disabled={!field}
                aria-label={t('dashboard.sort.aria_direction', { direction: directionLabel })}
                title={directionLabel}
                onClick={() => field && onSortChange(descending ? field : `-${field}`)}
                className='size-11 sm:size-8 p-0 rounded-full'
            >
                <HugeiconsIcon
                    size={16}
                    strokeWidth={2}
                    icon={descending ? SortByDown02Icon : SortByUp02Icon}
                    className='size-4'
                />
            </Button>
        </div>
    );
};

export default SortDropdown;
