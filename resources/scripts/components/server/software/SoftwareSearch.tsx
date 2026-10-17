import { Magnifier, Xmark } from '@gravity-ui/icons';
import { useTranslation } from '@/i18n/I18nProvider';

interface Props {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    id?: string;
}

// Million compiles this into a block, which binds the input's onChange as the
// native `change` event (fires on blur/Enter) instead of React's synthetic one.
// million-ignore
const SoftwareSearch = ({ value, onChange, placeholder, id }: Props) => {
    const { t } = useTranslation();
    const resolvedPlaceholder = placeholder ?? t('server.software.search_placeholder');

    return (
        <div className='relative mb-4'>
            <Magnifier
                width={18}
                height={18}
                fill='currentColor'
                className='pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-cream-400/50'
            />
            <input
                id={id}
                type='text'
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={resolvedPlaceholder}
                className='w-full rounded-lg border border-mocha-300/60 bg-mocha-400/60 py-2.5 pl-10 pr-10 text-sm text-cream-100 placeholder:text-cream-400/40 transition-colors focus:border-brand-400/60 focus:outline-none'
            />
            {value.length > 0 && (
                <button
                    type='button'
                    onClick={() => onChange('')}
                    aria-label={t('server.software.clear_search')}
                    className='absolute right-3 top-1/2 -translate-y-1/2 text-cream-400/50 transition-colors hover:text-cream-400'
                >
                    <Xmark width={16} height={16} fill='currentColor' />
                </button>
            )}
        </div>
    );
};

export default SoftwareSearch;
