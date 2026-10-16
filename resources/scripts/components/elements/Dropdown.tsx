import { ChevronDown, Magnifier, Xmark } from '@gravity-ui/icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export interface DropdownOption {
    value: string;
    label: string;
    description?: string;
}

interface Props {
    value: string;
    onChange: (value: string) => void;
    options: DropdownOption[];
    placeholder?: string;
    className?: string;
    /** Classes for the trigger button. Defaults to a full-width field. */
    triggerClassName?: string;
    disabled?: boolean;
    id?: string;
    /** When true, shows a search field at the top of the menu to filter the options. */
    searchable?: boolean;
    /** Placeholder for the search field shown when `searchable` is enabled. */
    searchPlaceholder?: string;
}

const Dropdown = ({
    value,
    onChange,
    options,
    placeholder = 'Select…',
    className,
    triggerClassName,
    disabled,
    id,
    searchable = false,
    searchPlaceholder = 'Search…',
}: Props) => {
    const selected = options.find((option) => option.value === value);

    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const searchInputRef = useRef<HTMLInputElement>(null);

    const visibleOptions = useMemo(() => {
        if (!searchable || !query.trim()) return options;

        const needle = query.trim().toLowerCase();
        return options.filter(
            (option) => option.label.toLowerCase().includes(needle) || option.value.toLowerCase().includes(needle),
        );
    }, [options, query, searchable]);

    useEffect(() => {
        if (open && searchable) {
            searchInputRef.current?.focus();
        }
    }, [open, searchable]);

    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen);
        if (!isOpen) setQuery('');
    };

    return (
        <DropdownMenu open={open} onOpenChange={handleOpenChange}>
            <DropdownMenuTrigger asChild disabled={disabled}>
                <button
                    id={id}
                    type='button'
                    disabled={disabled}
                    className={cn(
                        'flex w-full items-center justify-between gap-2 rounded-lg bg-overlay/7 px-4 py-2 text-left text-sm text-cream-100 outline-none transition-colors',
                        'hover:bg-overlay/9 focus-visible:ring-2 focus-visible:ring-hydro-500/40',
                        'disabled:cursor-not-allowed disabled:opacity-50',
                        triggerClassName,
                        className,
                    )}
                >
                    <span className={cn('truncate', !selected && 'text-cream-400/50')}>
                        {selected?.label ?? placeholder}
                    </span>
                    <ChevronDown width={16} height={16} className='shrink-0 text-cream-400/50' />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align='start'
                sideOffset={6}
                className='z-99999 max-h-72 w-[var(--radix-dropdown-menu-trigger-width)] overflow-y-auto'
            >
                {searchable && (
                    <div className='sticky top-0 z-10 border-b border-overlay/7 bg-bg-lowered p-2'>
                        <div className='relative'>
                            <Magnifier
                                width={16}
                                height={16}
                                className='pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-cream-400/50'
                                fill='currentColor'
                            />
                            <input
                                type='text'
                                ref={searchInputRef}
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                placeholder={searchPlaceholder}
                                className='w-full rounded-lg bg-overlay/4 py-1.5 pl-8 pr-8 text-sm text-cream-100 outline-none placeholder:text-cream-400/50 focus:ring-2 focus:ring-hydro-500/40'
                            />
                            {query && (
                                <button
                                    type='button'
                                    onClick={() => setQuery('')}
                                    className='absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-cream-400/50 hover:text-cream-100'
                                    aria-label='Clear search'
                                >
                                    <Xmark width={14} height={14} fill='currentColor' />
                                </button>
                            )}
                        </div>
                    </div>
                )}
                <DropdownMenuRadioGroup value={value} onValueChange={onChange}>
                    {visibleOptions.length === 0 ? (
                        <p className='px-3 py-2 text-sm text-cream-400/50'>No matches</p>
                    ) : (
                        visibleOptions.map((option) => (
                            <DropdownMenuRadioItem
                                key={option.value}
                                value={option.value}
                                className='flex-col items-start gap-0.5'
                            >
                                <span className='w-full truncate'>{option.label}</span>
                                {option.description && (
                                    <span className='text-xs font-normal text-cream-400/50'>{option.description}</span>
                                )}
                            </DropdownMenuRadioItem>
                        ))
                    )}
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default Dropdown;
