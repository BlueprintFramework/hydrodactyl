import { Check, ChevronDown, Tag, Xmark } from '@gravity-ui/icons';
import { useVirtualizer } from '@tanstack/react-virtual';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import type { GameVersions, MarketplaceCategory } from '@/api/server/marketplace';
import { useTranslation } from '@/i18n/I18nProvider';
import type { Translate, TranslationKey } from '@/i18n/types';
import { cn } from '@/lib/utils';
import { categoryVisual } from './categoryIcons';

const versionTypeLabel = (t: Translate, type: string) => {
    const key = `server.installer.version_type_${type}`;
    const translated = t(key as TranslationKey);

    return translated === key ? type.charAt(0).toUpperCase() + type.slice(1) : translated;
};

const RELEASE_ORDER = ['release', 'snapshot', 'beta', 'alpha'];

interface FilterSidebarProps {
    showGameVersion: boolean;
    gameVersions: GameVersions;
    releaseType: string;
    onReleaseTypeChange: (type: string) => void;
    gameVersion: string | null;
    onGameVersionChange: (version: string | null) => void;
    loaders: string[];
    loader: string | null;
    onLoaderChange: (loader: string | null) => void;
    categories: MarketplaceCategory[];
    category: string | null;
    onCategoryChange: (id: string | null) => void;
    className?: string;
}

/**
 * Right-rail browse filters (Modrinth / Hangar / Spigot style): stacked
 * collapsible sections for game version, loader, and category.
 */
const FilterSidebar = ({
    showGameVersion,
    gameVersions,
    releaseType,
    onReleaseTypeChange,
    gameVersion,
    onGameVersionChange,
    loaders,
    loader,
    onLoaderChange,
    categories,
    category,
    onCategoryChange,
    className,
}: FilterSidebarProps) => {
    const { t } = useTranslation();

    const hasGameVersion = showGameVersion && Object.keys(gameVersions).length > 0;
    const hasLoaders = loaders.length > 0;
    const hasCategories = categories.length > 0;

    if (!hasGameVersion && !hasLoaders && !hasCategories) {
        return null;
    }

    const releaseTypes = RELEASE_ORDER.filter((type) => gameVersions[type]).concat(
        Object.keys(gameVersions)
            .filter((type) => !RELEASE_ORDER.includes(type))
            .sort(),
    );

    return (
        <aside className={cn('flex w-full shrink-0 flex-col gap-2 md:w-60 lg:w-64', className)}>
            {hasGameVersion && (
                <FilterSection title={t('server.installer.game_version')} defaultOpen>
                    <div className='mb-2 flex flex-wrap gap-1 px-1'>
                        {releaseTypes.map((type) => (
                            <button
                                key={type}
                                type='button'
                                onClick={() => {
                                    onReleaseTypeChange(type);
                                    onGameVersionChange((gameVersions[type] ?? [])[0] ?? null);
                                }}
                                className={cn(
                                    'rounded-lg px-2 py-1 text-[11px] font-medium transition',
                                    type === releaseType
                                        ? 'bg-brand-400/70 text-mocha-500'
                                        : 'bg-mocha-300/40 text-cream-400/70 hover:bg-mocha-300/60',
                                )}
                            >
                                {versionTypeLabel(t, type)}
                            </button>
                        ))}
                    </div>
                    <VersionList
                        versions={gameVersions[releaseType] ?? []}
                        value={gameVersion}
                        onChange={onGameVersionChange}
                        anyLabel={t('server.installer.any')}
                        filterPlaceholder={t('server.installer.filter_versions_placeholder')}
                    />
                </FilterSection>
            )}

            {hasLoaders && (
                <FilterSection title={t('server.installer.loader')} defaultOpen={loaders.length > 1}>
                    <OptionList
                        options={loaders.map((l) => ({ id: l, label: l }))}
                        value={loader}
                        onChange={onLoaderChange}
                        anyLabel={t('server.installer.any')}
                        allowClear={loaders.length > 1}
                    />
                </FilterSection>
            )}

            {hasCategories && (
                <FilterSection title={t('server.installer.category')} defaultOpen>
                    <OptionList
                        options={categories.map((c) => ({ id: c.id, label: c.label, iconId: c.id }))}
                        value={category}
                        onChange={onCategoryChange}
                        anyLabel={t('server.installer.category_any')}
                        showIcons
                    />
                </FilterSection>
            )}
        </aside>
    );
};

const FilterSection = ({
    title,
    defaultOpen = false,
    children,
}: {
    title: string;
    defaultOpen?: boolean;
    children: ReactNode;
}) => {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <div className='rounded-2xl border border-mocha-300/50 bg-mocha-400/50'>
            <button
                type='button'
                onClick={() => setOpen((v) => !v)}
                className='flex w-full items-center justify-between gap-2 px-4 py-3 text-left'
                aria-expanded={open}
            >
                <span className='text-sm font-semibold text-cream-400'>{title}</span>
                <ChevronDown
                    width={16}
                    height={16}
                    fill='currentColor'
                    className={cn(
                        'shrink-0 text-cream-400/50 transition-transform duration-300 ease-out',
                        open && 'rotate-180',
                    )}
                />
            </button>
            <div
                className={cn(
                    'grid transition-[grid-template-rows] duration-300 ease-out',
                    open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                )}
            >
                <div className='min-h-0 overflow-hidden'>
                    <div
                        className={cn(
                            'px-2 pb-3 transition-opacity duration-300 ease-out',
                            open ? 'opacity-100' : 'opacity-0',
                        )}
                    >
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};

const OptionList = ({
    options,
    value,
    onChange,
    anyLabel,
    showIcons = false,
    allowClear = true,
}: {
    options: Array<{ id: string; label: string; iconId?: string }>;
    value: string | null;
    onChange: (id: string | null) => void;
    anyLabel: string;
    showIcons?: boolean;
    allowClear?: boolean;
}) => (
    <ul className='max-h-64 space-y-0.5 overflow-y-auto'>
        {allowClear && (
            <li>
                <OptionRow
                    label={anyLabel}
                    selected={value === null}
                    onClick={() => onChange(null)}
                    Icon={showIcons ? Tag : undefined}
                />
            </li>
        )}
        {options.map((opt) => {
            const selected = value === opt.id;
            const visual = showIcons ? categoryVisual(opt.iconId ?? opt.id, opt.label) : null;
            return (
                <li key={opt.id}>
                    <OptionRow
                        label={opt.label}
                        selected={selected}
                        onClick={() => onChange(selected && allowClear ? null : opt.id)}
                        Icon={visual?.Icon}
                        iconColorClass={visual?.colorClass}
                    />
                </li>
            );
        })}
    </ul>
);

const OptionRow = ({
    label,
    selected,
    onClick,
    Icon,
    iconColorClass,
}: {
    label: string;
    selected: boolean;
    onClick: () => void;
    Icon?: typeof Tag;
    iconColorClass?: string;
}) => (
    <button
        type='button'
        onClick={onClick}
        className={cn(
            'group flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm transition',
            selected
                ? 'bg-mocha-300/50 text-cream-400'
                : 'text-cream-400/65 hover:bg-mocha-300/30 hover:text-cream-400',
        )}
    >
        {Icon ? (
            <Icon
                width={16}
                height={16}
                fill='currentColor'
                className={cn('shrink-0', iconColorClass ?? 'text-cream-400/70')}
            />
        ) : null}
        <span className='min-w-0 flex-1 truncate text-left'>{label}</span>
        {selected ? (
            <span className='flex shrink-0 items-center gap-1 text-cream-400/70'>
                <Check width={14} height={14} fill='currentColor' />
                <Xmark
                    width={14}
                    height={14}
                    fill='currentColor'
                    className='opacity-0 transition group-hover:opacity-100'
                    aria-hidden
                />
            </span>
        ) : null}
    </button>
);

const VersionList = ({
    versions,
    value,
    onChange,
    anyLabel,
    filterPlaceholder,
}: {
    versions: string[];
    value: string | null;
    onChange: (v: string | null) => void;
    anyLabel: string;
    filterPlaceholder: string;
}) => {
    const [filter, setFilter] = useState('');
    const parentRef = useRef<HTMLDivElement>(null);
    const filtered = filter ? versions.filter((v) => v.toLowerCase().includes(filter.toLowerCase())) : versions;

    const virtualizer = useVirtualizer({
        count: filtered.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 36,
        overscan: 12,
    });

    useEffect(() => {
        // Re-measure when the version set changes — otherwise rows stay blank
        // until the user scrolls to the absolute bottom of a stale total height.
        parentRef.current?.scrollTo({ top: 0 });
        requestAnimationFrame(() => virtualizer.measure());
    }, [filtered.length, filter, versions, virtualizer]);

    return (
        <div className='space-y-2'>
            <input
                type='text'
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder={filterPlaceholder}
                className='w-full rounded-lg border border-mocha-300/40 bg-mocha-500/60 px-2.5 py-1.5 text-xs text-cream-400 placeholder:text-cream-400/40 focus:border-brand-400/60 focus:outline-none'
            />
            <button
                type='button'
                onClick={() => onChange(null)}
                className={cn(
                    'flex w-full items-center rounded-xl px-2.5 py-2 text-sm transition',
                    value === null
                        ? 'bg-mocha-300/50 text-cream-400'
                        : 'text-cream-400/65 hover:bg-mocha-300/30 hover:text-cream-400',
                )}
            >
                {anyLabel}
            </button>
            <div ref={parentRef} className='max-h-56 overflow-y-auto overscroll-contain'>
                <div style={{ height: `${virtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
                    {virtualizer.getVirtualItems().map((row) => {
                        const v = filtered[row.index];
                        if (v === undefined) return null;
                        const selected = v === value;
                        return (
                            <button
                                key={`${row.index}-${v}`}
                                type='button'
                                style={{
                                    height: `${row.size}px`,
                                    transform: `translateY(${row.start}px)`,
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                }}
                                onClick={() => onChange(selected ? null : v)}
                                className={cn(
                                    'flex w-full items-center rounded-xl px-2.5 text-left text-sm transition',
                                    selected
                                        ? 'bg-mocha-300/50 text-cream-400'
                                        : 'text-cream-400/65 hover:bg-mocha-300/30 hover:text-cream-400',
                                )}
                            >
                                {v}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default FilterSidebar;
