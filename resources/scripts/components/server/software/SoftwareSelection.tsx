import { useMemo, useState } from 'react';
import { useDebounce } from 'use-debounce';
import Spinner from '@/components/elements/Spinner';
import { Button } from '@/components/ui/button';
import DescriptionText from './DescriptionText';
import SoftwareCard from './SoftwareCard';
import SoftwareSearch from './SoftwareSearch';
import type { Egg, Nest } from './types';

interface Props {
    selectedNest: Nest;
    isLoading: boolean;
    selectedEggUuid: string | undefined;
    onSelectEgg: (egg: Egg) => void;
    onBack: () => void;
    onCancel: () => void;
}

const SoftwareSelection = ({ selectedNest, isLoading, selectedEggUuid, onSelectEgg, onBack, onCancel }: Props) => {
    const [query, setQuery] = useState('');
    const [debouncedQuery] = useDebounce(query, 150);
    const normalizedQuery = debouncedQuery.trim().toLowerCase();

    const eggs = selectedNest?.attributes?.relationships?.eggs?.data || [];

    const filteredEggs = useMemo(() => {
        if (!normalizedQuery) return eggs;

        return eggs.filter(
            (egg) =>
                egg.attributes.name.toLowerCase().includes(normalizedQuery) ||
                (egg.attributes.description || '').toLowerCase().includes(normalizedQuery),
        );
    }, [eggs, normalizedQuery]);

    return (
        <SoftwareCard title={`Select Software - ${selectedNest?.attributes.name}`}>
            <div className='space-y-4'>
                <div className='flex flex-col sm:flex-row gap-3'>
                    <Button variant='secondary' onClick={onBack} className='w-full sm:w-auto'>
                        Back to Games
                    </Button>
                    <Button variant='secondary' onClick={onCancel} className='w-full sm:w-auto'>
                        Cancel
                    </Button>
                </div>

                <SoftwareSearch
                    id='software-search'
                    value={query}
                    onChange={setQuery}
                    placeholder='Search software...'
                />

                {isLoading ? (
                    <div className='flex items-center justify-center py-16'>
                        <div className='flex flex-col items-center text-center'>
                            <Spinner size='large' />
                            <p className='text-cream-400/70 mt-4'>Loading software options...</p>
                        </div>
                    </div>
                ) : filteredEggs.length === 0 ? (
                    <div className='flex flex-col items-center justify-center py-12 text-center'>
                        <p className='text-cream-400 font-medium'>No software found</p>
                        <p className='text-sm text-cream-400/50 mt-1'>
                            {normalizedQuery
                                ? `Nothing in this category matched “${query.trim()}”.`
                                : 'This category does not have any software available.'}
                        </p>
                    </div>
                ) : (
                    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4'>
                        {filteredEggs.map((egg) => (
                            <button
                                type='button'
                                key={egg.attributes.uuid}
                                onClick={() => onSelectEgg(egg)}
                                disabled={isLoading}
                                className='p-4 bg-mocha-400/60 border border-mocha-300/60 rounded-lg hover:border-brand-400/60 transition-all text-left touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed'
                            >
                                <div className='flex items-center gap-2 mb-2'>
                                    {isLoading && selectedEggUuid === egg?.attributes?.uuid && <Spinner size='small' />}
                                    <h3 className='font-semibold text-cream-100 text-sm sm:text-base'>
                                        {egg?.attributes?.name}
                                    </h3>
                                </div>
                                <DescriptionText
                                    description={egg?.attributes?.description || ''}
                                    id={`egg-${egg?.attributes?.uuid}`}
                                />
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </SoftwareCard>
    );
};

export default SoftwareSelection;
