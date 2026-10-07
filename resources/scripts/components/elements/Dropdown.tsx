import { ChevronDown } from '@gravity-ui/icons';
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
    disabled?: boolean;
    id?: string;
}

const Dropdown = ({ value, onChange, options, placeholder = 'Select…', className, disabled, id }: Props) => {
    const selected = options.find((option) => option.value === value);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild disabled={disabled}>
                <button
                    id={id}
                    type='button'
                    disabled={disabled}
                    className={cn(
                        'flex w-full items-center justify-between gap-2 rounded-lg bg-[#ffffff11] px-4 py-2 text-left text-sm text-cream-100 outline-none transition-colors',
                        'hover:bg-[#ffffff17] focus-visible:ring-2 focus-visible:ring-hydro-500/40',
                        'disabled:cursor-not-allowed disabled:opacity-50',
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
                <DropdownMenuRadioGroup value={value} onValueChange={onChange}>
                    {options.map((option) => (
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
                    ))}
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default Dropdown;
