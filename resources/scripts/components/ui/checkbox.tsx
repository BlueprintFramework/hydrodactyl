import * as React from 'react';
import { cn } from '../../lib/utils';

interface CheckboxProps extends Omit<React.ComponentProps<'input'>, 'type'> {
    label?: string;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
    ({ className, label, id, checked, onChange, disabled, ...props }, ref) => {
        const generatedId = React.useId();
        const checkboxId = id || generatedId;

        return (
            <div className={cn('inline-flex items-center gap-2', className)}>
                <label
                    htmlFor={checkboxId}
                    className='relative flex items-center justify-center w-4 h-4 shrink-0 cursor-pointer'
                >
                    <input
                        ref={ref}
                        type='checkbox'
                        id={checkboxId}
                        checked={checked}
                        onChange={onChange}
                        disabled={disabled}
                        className='peer sr-only'
                        {...props}
                    />
                    <div
                        className={cn(
                            'w-4 h-4 rounded border-2 transition-all duration-150',
                            'border-mocha-400 bg-mocha-600',
                            'peer-checked:bg-cream-400 peer-checked:border-cream-400',
                            'peer-focus-visible:ring-2 peer-focus-visible:ring-cream-400/40 peer-focus-visible:ring-offset-1 peer-focus-visible:ring-offset-mocha-600',
                            'peer-disabled:opacity-50 peer-disabled:cursor-not-allowed',
                            'hover:border-mocha-300',
                        )}
                    >
                        <svg
                            className={cn(
                                'w-full h-full text-mocha-600 transition-opacity duration-100',
                                checked ? 'opacity-100' : 'opacity-0',
                            )}
                            viewBox='0 0 12 12'
                            fill='none'
                            xmlns='http://www.w3.org/2000/svg'
                            role='presentation'
                        >
                            <path
                                d='M2.5 6L5 8.5L9.5 3.5'
                                stroke='currentColor'
                                strokeWidth='2'
                                strokeLinecap='round'
                                strokeLinejoin='round'
                            />
                        </svg>
                    </div>
                </label>
                {label && (
                    <label
                        htmlFor={checkboxId}
                        className={cn(
                            'text-sm text-cream-400 select-none',
                            disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
                        )}
                    >
                        {label}
                    </label>
                )}
            </div>
        );
    },
);

Checkbox.displayName = 'Checkbox';

export { Checkbox, type CheckboxProps };
