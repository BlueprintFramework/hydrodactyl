import { type ChangeEvent, useId } from 'react';

const inputClass =
    'w-full bg-mocha-600 border border-mocha-400 rounded-lg px-3 py-2 text-sm text-cream-400 placeholder-mocha-200/40 focus:outline-none focus:border-mocha-300 transition-colors';
const labelClass = 'block text-sm font-medium text-mocha-200 mb-1';
const hintClass = 'text-xs text-mocha-200/60 mt-1';

interface AdminInputProps {
    label: string;
    value: string;
    onChange: (e: ChangeEvent<HTMLInputElement>) => void;
    type?: string;
    placeholder?: string;
    hint?: string;
    disabled?: boolean;
    required?: boolean;
    error?: string;
    className?: string;
}

export function AdminInput({
    label,
    value,
    onChange,
    type = 'text',
    placeholder,
    hint,
    disabled,
    required,
    error,
    className = '',
}: AdminInputProps) {
    const id = useId();
    return (
        <div className={className}>
            <label htmlFor={id} className={labelClass}>
                {label}
                {required && <span className='text-brand ml-1'>*</span>}
            </label>
            <input
                id={id}
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                disabled={disabled}
                required={required}
                className={`${inputClass} ${error ? 'border-red-400' : ''} ${disabled ? 'opacity-50' : ''}`}
            />
            {hint && !error && <p className={hintClass}>{hint}</p>}
            {error && <p className='text-xs text-red-400 mt-1'>{error}</p>}
        </div>
    );
}

interface AdminSelectProps {
    label: string;
    value: string | number;
    onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
    options: { label: string; value: string | number }[];
    hint?: string;
    disabled?: boolean;
    required?: boolean;
    error?: string;
    placeholder?: string;
    className?: string;
}

export function AdminSelect({
    label,
    value,
    onChange,
    options,
    hint,
    disabled,
    required,
    error,
    placeholder,
    className = '',
}: AdminSelectProps) {
    const id = useId();
    return (
        <div className={className}>
            <label htmlFor={id} className={labelClass}>
                {label}
                {required && <span className='text-brand ml-1'>*</span>}
            </label>
            <select
                id={id}
                value={value}
                onChange={onChange}
                disabled={disabled}
                required={required}
                className={`${inputClass} ${error ? 'border-red-400' : ''} ${disabled ? 'opacity-50' : ''}`}
            >
                {placeholder && (
                    <option value='' disabled className='bg-mocha-600 text-mocha-200'>
                        {placeholder}
                    </option>
                )}
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value} className='bg-mocha-600 text-cream-400'>
                        {opt.label}
                    </option>
                ))}
            </select>
            {hint && !error && <p className={hintClass}>{hint}</p>}
            {error && <p className='text-xs text-red-400 mt-1'>{error}</p>}
        </div>
    );
}

interface AdminTextareaProps {
    label: string;
    value: string;
    onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
    placeholder?: string;
    hint?: string;
    disabled?: boolean;
    required?: boolean;
    rows?: number;
    error?: string;
    className?: string;
}

export function AdminTextarea({
    label,
    value,
    onChange,
    placeholder,
    hint,
    disabled,
    required,
    rows = 3,
    error,
    className = '',
}: AdminTextareaProps) {
    const id = useId();
    return (
        <div className={className}>
            <label htmlFor={id} className={labelClass}>
                {label}
                {required && <span className='text-brand ml-1'>*</span>}
            </label>
            <textarea
                id={id}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                disabled={disabled}
                required={required}
                rows={rows}
                className={`${inputClass} resize-y ${error ? 'border-red-400' : ''} ${disabled ? 'opacity-50' : ''}`}
            />
            {hint && !error && <p className={hintClass}>{hint}</p>}
            {error && <p className='text-xs text-red-400 mt-1'>{error}</p>}
        </div>
    );
}

interface AdminRadioGroupProps {
    label: string;
    value: string | number;
    onChange: (value: string | number) => void;
    options: { value: string | number; label: string; description?: string }[];
    className?: string;
}

export function AdminRadioGroup({ label, value, onChange, options, className = '' }: AdminRadioGroupProps) {
    const name = useId();
    return (
        <div className={className}>
            <p className={labelClass}>{label}</p>
            <div className='flex gap-2'>
                {options.map((opt) => (
                    <label key={opt.value} className='flex-1 cursor-pointer'>
                        <input
                            type='radio'
                            name={name}
                            value={opt.value}
                            checked={value === opt.value}
                            onChange={() => onChange(opt.value)}
                            className='hidden peer'
                        />
                        <div className='px-4 py-3 bg-mocha-600 border border-mocha-400 rounded-lg text-center peer-checked:border-mocha-300 peer-checked:bg-mocha-500/20 transition-colors'>
                            <div
                                className={`text-sm font-medium ${value === opt.value ? 'text-cream-400' : 'text-mocha-100'}`}
                            >
                                {opt.label}
                            </div>
                            {opt.description && <div className='text-xs text-mocha-200/60 mt-1'>{opt.description}</div>}
                        </div>
                    </label>
                ))}
            </div>
        </div>
    );
}
