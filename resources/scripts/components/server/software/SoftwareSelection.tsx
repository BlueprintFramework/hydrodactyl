import { useMemo, useState } from 'react';
import { useDebounce } from 'use-debounce';
import Spinner from '@/components/elements/Spinner';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/I18nProvider';
import { isMcjarsCatalogEgg } from './mcjarsTypes';
import SoftwareCard from './SoftwareCard';
import SoftwareEggButton from './SoftwareEggButton';
import SoftwareSearch from './SoftwareSearch';
import { groupEggsByPriority, type SoftwareSectionId } from './softwarePriority';
import type { Egg, Nest } from './types';
import { blank_egg_prefix } from './types';

interface Props {
    selectedNest: Nest;
    isLoading: boolean;
    selectedEggUuid: string | undefined;
    flatMinecraft?: boolean;
    onSelectEgg: (egg: Egg) => void;
    onBack: () => void;
    onCancel: () => void;
}

const SECTION_I18N: Record<SoftwareSectionId, string> = {
    favorites: 'server.software.selection.section_favorites',
    established: 'server.software.selection.section_established',
    experimental: 'server.software.selection.section_experimental',
    miscellaneous: 'server.software.selection.section_miscellaneous',
    limbos: 'server.software.selection.section_limbos',
    other: 'server.software.selection.section_other',
};

const SoftwareSelection = ({
    selectedNest,
    isLoading,
    selectedEggUuid,
    flatMinecraft = false,
    onSelectEgg,
    onBack,
    onCancel,
}: Props) => {
    const { t } = useTranslation();
    const [query, setQuery] = useState('');
    const [debouncedQuery] = useDebounce(query, 150);
    const normalizedQuery = debouncedQuery.trim().toLowerCase();

    const eggs = useMemo(() => {
        const raw = selectedNest?.attributes?.relationships?.eggs?.data || [];
        return raw.filter((egg) => {
            if (egg.attributes.name.includes(blank_egg_prefix)) return false;
            // Minecraft catalog: only eggs that exist on MCJars (Java).
            // Bedrock / PocketMine / Waterdog / hybrids without an MCJars type are excluded.
            if (flatMinecraft) return isMcjarsCatalogEgg(egg.attributes.name);
            return true;
        });
    }, [selectedNest, flatMinecraft]);

    const filteredEggs = useMemo(() => {
        if (!normalizedQuery) return eggs;

        return eggs.filter(
            (egg) =>
                egg.attributes.name.toLowerCase().includes(normalizedQuery) ||
                (egg.attributes.description || '').toLowerCase().includes(normalizedQuery),
        );
    }, [eggs, normalizedQuery]);

    const sections = useMemo(
        () => (flatMinecraft ? groupEggsByPriority(filteredEggs) : null),
        [filteredEggs, flatMinecraft],
    );

    return (
        <SoftwareCard
            title={
                flatMinecraft
                    ? t('server.software.selection.title_flat')
                    : t('server.software.selection.title', { nest: selectedNest?.attributes.name })
            }
        >
            <div className='space-y-4'>
                <div className='flex flex-col sm:flex-row gap-3'>
                    <Button variant='secondary' onClick={onBack} className='w-full sm:w-auto'>
                        {t('server.software.selection.back_to_games')}
                    </Button>
                    <Button variant='secondary' onClick={onCancel} className='w-full sm:w-auto'>
                        {t('common.cancel')}
                    </Button>
                </div>

                <SoftwareSearch
                    id='software-search'
                    value={query}
                    onChange={setQuery}
                    placeholder={t('server.software.selection.search_placeholder')}
                />

                {isLoading ? (
                    <div className='flex items-center justify-center py-16'>
                        <div className='flex flex-col items-center text-center'>
                            <Spinner size='large' />
                            <p className='text-cream-400/70 mt-4'>{t('server.software.selection.loading')}</p>
                        </div>
                    </div>
                ) : filteredEggs.length === 0 ? (
                    <div className='flex flex-col items-center justify-center py-12 text-center'>
                        <p className='text-cream-400 font-medium'>{t('server.software.selection.no_results')}</p>
                        <p className='text-sm text-cream-400/50 mt-1'>
                            {normalizedQuery
                                ? t('server.software.selection.no_results_query', { query: query.trim() })
                                : t('server.software.selection.no_results_empty')}
                        </p>
                    </div>
                ) : sections ? (
                    <div className='space-y-8'>
                        {sections.map((section) => (
                            <section key={section.id} className='space-y-3'>
                                <div>
                                    <h3 className='text-sm font-semibold uppercase tracking-wide text-cream-300'>
                                        {t(SECTION_I18N[section.id])}
                                    </h3>
                                    {section.id === 'favorites' && (
                                        <p className='text-xs text-cream-400/60 mt-1'>
                                            {t('server.software.selection.favorites_hint')}
                                        </p>
                                    )}
                                </div>
                                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4'>
                                    {section.eggs.map((egg) => (
                                        <SoftwareEggButton
                                            key={egg.attributes.uuid}
                                            egg={egg}
                                            isLoading={isLoading}
                                            isSelected={selectedEggUuid === egg.attributes.uuid}
                                            badge={
                                                section.id === 'favorites'
                                                    ? t('server.software.selection.favorite_badge')
                                                    : undefined
                                            }
                                            onSelect={onSelectEgg}
                                        />
                                    ))}
                                </div>
                            </section>
                        ))}
                    </div>
                ) : (
                    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4'>
                        {filteredEggs.map((egg) => (
                            <SoftwareEggButton
                                key={egg.attributes.uuid}
                                egg={egg}
                                isLoading={isLoading}
                                isSelected={selectedEggUuid === egg.attributes.uuid}
                                onSelect={onSelectEgg}
                            />
                        ))}
                    </div>
                )}
            </div>
        </SoftwareCard>
    );
};

export default SoftwareSelection;
