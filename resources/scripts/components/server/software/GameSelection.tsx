import { useMemo, useState } from 'react';
import { useDebounce } from 'use-debounce';
import Spinner from '@/components/elements/Spinner';
import { Button } from '@/components/ui/button';
import DescriptionText from './DescriptionText';
import SoftwareCard from './SoftwareCard';
import SoftwareSearch from './SoftwareSearch';
import type { Egg, Nest } from './types';

const hidden_nest_prefix = '!';

interface Props {
    nests: Nest[];
    isLoading: boolean;
    selectedEggUuid: string | undefined;
    onSelectNest: (nest: Nest) => void;
    onSelectSoftware: (nest: Nest, egg: Egg) => void;
    onBack: () => void;
}

const GameSelection = ({ nests, isLoading, selectedEggUuid, onSelectNest, onSelectSoftware, onBack }: Props) => {
    const [query, setQuery] = useState('');
    const [debouncedQuery] = useDebounce(query, 150);
    const normalizedQuery = debouncedQuery.trim().toLowerCase();

    const visibleNests = useMemo(
        () => (nests || []).filter((nest) => !nest?.attributes?.name?.includes(hidden_nest_prefix)),
        [nests],
    );

    const matchingNests = useMemo(() => {
        if (!normalizedQuery) return visibleNests;

        return visibleNests.filter(
            (nest) =>
                nest.attributes.name.toLowerCase().includes(normalizedQuery) ||
                (nest.attributes.description || '').toLowerCase().includes(normalizedQuery),
        );
    }, [visibleNests, normalizedQuery]);

    // Search across every category so duplicate software stored in different places is still found.
    const matchingSoftware = useMemo(() => {
        if (!normalizedQuery) return [];

        return visibleNests.flatMap((nest) =>
            (nest.attributes.relationships?.eggs?.data || [])
                .filter(
                    (egg) =>
                        egg.attributes.name.toLowerCase().includes(normalizedQuery) ||
                        (egg.attributes.description || '').toLowerCase().includes(normalizedQuery),
                )
                .map((egg) => ({ nest, egg })),
        );
    }, [visibleNests, normalizedQuery]);

    const hasResults = matchingNests.length > 0 || matchingSoftware.length > 0;

    return (
        <SoftwareCard title='Select Category'>
            <div className='space-y-4'>
                <div className='flex justify-start'>
                    <Button variant='secondary' onClick={onBack} className='w-full sm:w-auto'>
                        Back to Overview
                    </Button>
                </div>

                <SoftwareSearch
                    id='software-category-search'
                    value={query}
                    onChange={setQuery}
                    placeholder='Search categories and software...'
                />

                {!normalizedQuery && (
                    <p className='text-sm text-cream-400/70'>Choose the type of game or software you want to run</p>
                )}

                {normalizedQuery && !hasResults && (
                    <div className='flex flex-col items-center justify-center py-12 text-center'>
                        <p className='text-cream-400 font-medium'>No matches found</p>
                        <p className='text-sm text-cream-400/50 mt-1'>
                            Nothing matched &ldquo;{query.trim()}&rdquo;. Try a different search term.
                        </p>
                    </div>
                )}

                {matchingNests.length > 0 && (
                    <div className='space-y-3'>
                        {normalizedQuery && (
                            <h3 className='text-sm font-semibold text-cream-400 uppercase tracking-wide'>Categories</h3>
                        )}
                        <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4'>
                            {matchingNests.map((nest) => (
                                <button
                                    type='button'
                                    key={nest?.attributes?.uuid}
                                    onClick={() => onSelectNest(nest)}
                                    className='p-4 sm:p-5 bg-mocha-400/60 border border-mocha-300/60 rounded-lg hover:border-brand-400/60 transition-all text-left active:bg-mocha-400 touch-manipulation'
                                >
                                    <h3 className='font-semibold text-cream-100 mb-2 text-base sm:text-lg'>
                                        {nest?.attributes?.name}
                                    </h3>
                                    <DescriptionText
                                        description={nest?.attributes?.description || ''}
                                        id={`nest-${nest?.attributes?.uuid}`}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {matchingSoftware.length > 0 && (
                    <div className='space-y-3'>
                        <h3 className='text-sm font-semibold text-cream-400 uppercase tracking-wide'>Software</h3>
                        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4'>
                            {matchingSoftware.map(({ nest, egg }) => (
                                <button
                                    type='button'
                                    key={`${nest.attributes.uuid}-${egg.attributes.uuid}`}
                                    onClick={() => onSelectSoftware(nest, egg)}
                                    disabled={isLoading}
                                    className='p-4 bg-mocha-400/60 border border-mocha-300/60 rounded-lg hover:border-brand-400/60 transition-all text-left touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed'
                                >
                                    <div className='flex items-center gap-2 mb-2'>
                                        {isLoading && selectedEggUuid === egg?.attributes?.uuid && (
                                            <Spinner size='small' />
                                        )}
                                        <h3 className='font-semibold text-cream-100 text-sm sm:text-base'>
                                            {egg?.attributes?.name}
                                        </h3>
                                    </div>
                                    <p className='text-xs text-cream-400/50 mb-2'>in {nest.attributes.name}</p>
                                    <DescriptionText
                                        description={egg?.attributes?.description || ''}
                                        id={`egg-${egg?.attributes?.uuid}`}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </SoftwareCard>
    );
};

export default GameSelection;
