import Spinner from '@/components/elements/Spinner';
import DescriptionText from './DescriptionText';
import { getMcjarsIconUrl } from './mcjarsIcons';
import type { Egg } from './types';

interface Props {
    egg: Egg;
    isLoading: boolean;
    isSelected: boolean;
    badge?: string;
    onSelect: (egg: Egg) => void;
}

const SoftwareEggButton = ({ egg, isLoading, isSelected, badge, onSelect }: Props) => {
    const iconUrl = getMcjarsIconUrl(egg?.attributes?.name);

    return (
        <button
            type='button'
            onClick={() => onSelect(egg)}
            disabled={isLoading}
            className='p-4 bg-mocha-400/60 border border-mocha-300/60 rounded-lg hover:border-brand-400/60 transition-all text-left touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed relative'
        >
            {badge && (
                <span className='absolute top-2 right-2 text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-300 border border-brand-400/30'>
                    {badge}
                </span>
            )}
            <div className='flex items-center gap-3 mb-2'>
                {iconUrl && (
                    <img
                        src={iconUrl}
                        alt=''
                        className='h-10 w-10 rounded-lg object-contain bg-[#ffffff0a] border border-[#ffffff12] p-1.5 shrink-0'
                        loading='lazy'
                        decoding='async'
                        referrerPolicy='no-referrer'
                        onError={(e) => {
                            e.currentTarget.style.display = 'none';
                        }}
                    />
                )}
                <div className='flex items-center gap-2 min-w-0 pr-10'>
                    {isLoading && isSelected && <Spinner size='small' />}
                    <h3 className='font-semibold text-cream-100 text-sm sm:text-base truncate'>
                        {egg?.attributes?.name}
                    </h3>
                </div>
            </div>
            <DescriptionText description={egg?.attributes?.description || ''} id={`egg-${egg?.attributes?.uuid}`} />
        </button>
    );
};

export default SoftwareEggButton;
