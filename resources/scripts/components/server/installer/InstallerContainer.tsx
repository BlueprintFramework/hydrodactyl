import { ChevronDown, Funnel, Magnifier, TrashBin } from '@gravity-ui/icons';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { httpErrorToHuman } from '@/api/http';
import deleteFiles from '@/api/server/files/deleteFiles';
import type {
    GameVersions,
    MarketplaceProject,
    MarketplaceSourceMeta,
    MarketplaceType,
} from '@/api/server/marketplace';
import { getMarketplaceGameVersions, getMarketplaceLoaders, searchMarketplace } from '@/api/server/marketplace';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import Spinner from '@/components/elements/Spinner';
import ServerHeader from '@/components/server/header/ServerHeader';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTranslation } from '@/i18n/I18nProvider';
import type { TranslationKey } from '@/i18n/types';
import { cn } from '@/lib/utils';
import { ServerContext } from '@/state/server';
import { destinationFolder, isMinecraftCapable, loadersFor } from './eggFeatures';
import InstallerCard from './InstallerCard';
import { type InstalledEntry, type InstalledItem, readAllInstalled, removeInstall } from './installedState';
import { sourceLabel } from './sources';
import VersionPicker from './VersionPicker';

const TABS: { key: MarketplaceType; label: TranslationKey; hint: TranslationKey }[] = [
    { key: 'plugin', label: 'server.installer.plugins', hint: 'server.installer.tab_plugins_hint' },
    { key: 'mod', label: 'server.installer.mods', hint: 'server.installer.tab_mods_hint' },
];

const PAGE_SIZE = 24;
/** Combined search across every enabled provider. */
const ALL_PROVIDERS = 'all';

/** localStorage key for the user's last-opened section (plugin/mod). */
const TAB_STORAGE_KEY = 'hydrodactyl:installer:tab';

/**
 * Read the user's last-used section from localStorage so they don't have to
 * re-pick "Plugins" vs "Mods" on every visit. Returns null when storage is
 * unavailable (private mode / quota) or the saved value isn't a valid section.
 */
const readSavedTab = (): MarketplaceType | null => {
    try {
        const saved = window.localStorage.getItem(TAB_STORAGE_KEY);
        if (saved === 'plugin' || saved === 'mod') return saved;
    } catch {
        // localStorage may be unavailable — fall through to the default.
    }

    return null;
};

const VersionDropdown = ({
    versions,
    value,
    onChange,
}: {
    versions: string[];
    value: string | null;
    onChange: (v: string | null) => void;
}) => {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const [filter, setFilter] = useState('');
    const parentRef = useRef<HTMLDivElement>(null);

    const filtered = filter ? versions.filter((v) => v.toLowerCase().includes(filter.toLowerCase())) : versions;

    const virtualizer = useVirtualizer({
        count: filtered.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 36,
        overscan: 15,
    });

    useEffect(() => {
        if (open) requestAnimationFrame(() => virtualizer.measure());
    }, [open, virtualizer]);

    return (
        <DropdownMenu
            open={open}
            onOpenChange={(next) => {
                setOpen(next);
                if (!next) setFilter('');
            }}
        >
            <DropdownMenuTrigger asChild>
                <button
                    type='button'
                    className='inline-flex items-center gap-2 rounded-xl border border-mocha-300/50 bg-mocha-400/50 px-3 py-3 text-sm text-cream-400 focus:border-brand-400/60 focus:outline-none'
                >
                    {value ?? t('server.installer.any')}
                    <ChevronDown width={14} height={14} fill='currentColor' className='text-cream-400/40' />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='flex flex-col p-0'>
                <div className='shrink-0 border-b border-mocha-400 p-2'>
                    <input
                        type='text'
                        placeholder={t('server.installer.filter_versions_placeholder')}
                        className='w-full rounded-lg border border-mocha-400 bg-mocha-500 px-2 py-1 text-xs text-cream-400 placeholder:text-cream-400/40 focus:outline-none'
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        onMouseDown={(e) => e.stopPropagation()}
                    />
                </div>
                <div ref={parentRef} className='max-h-60 overflow-y-auto p-1'>
                    <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
                        {virtualizer.getVirtualItems().map((virtualRow) => {
                            const v = filtered[virtualRow.index];
                            return (
                                <div
                                    key={v}
                                    style={{
                                        height: virtualRow.size,
                                        transform: `translateY(${virtualRow.start}px)`,
                                        position: 'absolute',
                                        insetInline: 0,
                                    }}
                                    className='flex cursor-default items-center rounded-xl px-2 py-1.5 text-sm outline-none select-none hover:bg-mocha-400 data-[selected=true]:bg-mocha-400'
                                    data-selected={v === value}
                                    role='option'
                                    aria-selected={v === value}
                                    tabIndex={-1}
                                    onMouseDown={() => {
                                        onChange(v);
                                        setOpen(false);
                                        setFilter('');
                                    }}
                                >
                                    {v}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

interface PickerCtx {
    project: MarketplaceProject;
    type: MarketplaceType;
    source: string;
    directory: string;
    loader: string | null;
}

const InstallerContainer = () => {
    const { t } = useTranslation();
    const uuid = ServerContext.useStoreState((state) => state.server.data?.uuid);
    const eggFeatures = ServerContext.useStoreState((state) => state.server.data?.eggFeatures ?? []);
    const variables = ServerContext.useStoreState((state) => state.server.data?.variables ?? []);

    const [view, setView] = useState<'browse' | 'installed'>('browse');
    const [tab, setTabState] = useState<MarketplaceType>(() => readSavedTab() ?? 'plugin');

    /** Switch section and remember the choice for the next visit. */
    const setTab = useCallback((next: MarketplaceType) => {
        setTabState(next);
        try {
            window.localStorage.setItem(TAB_STORAGE_KEY, next);
        } catch {
            // ignore write failures — the preference just won't persist.
        }
    }, []);
    const [sources, setSources] = useState<MarketplaceSourceMeta[]>([]);
    const [source, setSource] = useState<string>(ALL_PROVIDERS);
    const [query, setQuery] = useState('');
    const [loader, setLoader] = useState<string | null>(null);
    const [results, setResults] = useState<MarketplaceProject[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [picker, setPicker] = useState<PickerCtx | null>(null);
    const [installedItems, setInstalledItems] = useState<InstalledItem[]>([]);
    const [removingKey, setRemovingKey] = useState<string | null>(null);
    // Live Modrinth loader-tag list, used to validate the loader extracted from
    // the server's egg features (so new loaders Modrinth adds are supported
    // without a code change). Empty until the fetch resolves.
    const [knownLoaders, setKnownLoaders] = useState<string[]>([]);
    const knownLoadersRef = useRef(knownLoaders);
    knownLoadersRef.current = knownLoaders;

    const [gameVersions, setGameVersions] = useState<GameVersions>({});
    const [releaseType, setReleaseType] = useState<string>('');
    const [gameVersion, setGameVersion] = useState<string | null>(null);

    const directory = destinationFolder(tab);

    const refreshInstalled = useCallback(() => {
        if (!uuid) return;
        readAllInstalled(uuid)
            .then(setInstalledItems)
            .catch(() => setInstalledItems([]));
    }, [uuid]);

    useEffect(() => {
        refreshInstalled();
    }, [refreshInstalled]);

    // Re-sync when the user opens the Installed view, so a jar deleted via the
    // file manager (in another tab or while away) is pruned on entry.
    useEffect(() => {
        if (view === 'installed') {
            refreshInstalled();
        }
    }, [view, refreshInstalled]);

    // Fetch the authoritative Modrinth loader list once so egg-feature loaders
    // are validated against it. A failure leaves the list empty, which makes
    // loadersFor trust the egg feature as-is (no validation).
    useEffect(() => {
        if (!uuid) return;
        getMarketplaceLoaders(uuid)
            .then(setKnownLoaders)
            .catch(() => setKnownLoaders([]));
    }, [uuid]);

    const findEggVersion = useCallback(
        (versions: GameVersions): { version: string | null; type: string } | null => {
            // Collect candidate env var names from egg features' loaders + common patterns
            const candidates = new Set(
                loadersFor(eggFeatures, tab, knownLoaders).map((l) => `${l.toUpperCase()}_VERSION`),
            );
            for (const v of ['MINECRAFT_VERSION', 'VANILLA_VERSION', 'MC_VERSION']) {
                candidates.add(v);
            }

            for (const candidate of candidates) {
                const eggVar = variables.find((v) => v.envVariable === candidate);
                if (!eggVar) continue;
                const raw = eggVar.serverValue || eggVar.defaultValue || '';
                if (raw === 'latest') {
                    const releases = versions.release;
                    if (releases && releases.length > 0) {
                        return { version: releases[0], type: 'release' };
                    }
                    continue;
                }
                for (const [type, list] of Object.entries(versions)) {
                    if (list.includes(raw)) {
                        return { version: raw, type };
                    }
                }
            }
            return null;
        },
        [variables, eggFeatures, tab, knownLoaders],
    );

    // Fetch Modrinth game versions grouped by release type on mount.
    useEffect(() => {
        if (!uuid) return;
        getMarketplaceGameVersions(uuid)
            .then((versions) => {
                setGameVersions(versions);
                const types = Object.keys(versions);
                if (types.length > 0) {
                    const egg = findEggVersion(versions);
                    if (egg) {
                        setReleaseType(egg.type);
                        setGameVersion(egg.version);
                    } else {
                        setReleaseType(types[0]);
                        setGameVersion(versions[types[0]][0] ?? null);
                    }
                }
            })
            .catch(() => setGameVersions({}));
    }, [uuid, findEggVersion]);

    const installedEntryFor = useCallback(
        (project: MarketplaceProject): InstalledEntry | undefined =>
            installedItems.find((i) => i.source === project.source && i.projectId === project.id)?.entry,
        [installedItems],
    );

    // Reset browse selections when switching tabs. Source defaults to "all"
    // (combined providers) each time.
    useEffect(() => {
        setLoader(loadersFor(eggFeatures, tab, knownLoadersRef.current)[0] ?? null);
        setQuery('');
        setSource(ALL_PROVIDERS);
        setSources([]);
        setResults([]);
        setError(null);
        const types = Object.keys(gameVersions);
        if (types.length > 0) {
            const egg = findEggVersion(gameVersions);
            if (egg) {
                setReleaseType(egg.type);
                setGameVersion(egg.version);
            } else {
                setReleaseType(types[0]);
                setGameVersion(gameVersions[types[0]][0] ?? null);
            }
        }
    }, [tab, eggFeatures, findEggVersion, gameVersions]);

    // Debounced, cancellable search. "all" fans out across every enabled
    // provider on the backend; a specific provider queries just that one.
    const requestId = useRef(0);
    useEffect(() => {
        if (!uuid) return;

        const id = ++requestId.current;
        const handle = setTimeout(() => {
            setLoading(true);
            setError(null);
            searchMarketplace(uuid, {
                type: tab,
                source,
                query: query.trim() || undefined,
                loader,
                game_version: gameVersion,
                limit: PAGE_SIZE,
            })
                .then((data) => {
                    if (id !== requestId.current) return;
                    if (data.sources.length > 0) setSources(data.sources);
                    setResults(data.results);
                    setHasMore(data.results.length >= PAGE_SIZE);
                })
                .catch((err) => {
                    if (id !== requestId.current) return;
                    setError(httpErrorToHuman(err) || t('server.installer.error_search'));
                    setResults([]);
                    setHasMore(false);
                })
                .finally(() => {
                    if (id === requestId.current) setLoading(false);
                });
        }, 350);

        return () => clearTimeout(handle);
    }, [uuid, tab, source, query, loader, gameVersion, t]);

    const loadMore = useCallback(() => {
        if (!uuid || loadingMore || !hasMore) return;
        const nextOffset = results.length;
        setLoadingMore(true);
        searchMarketplace(uuid, {
            type: tab,
            source,
            query: query.trim() || undefined,
            loader,
            game_version: gameVersion,
            limit: PAGE_SIZE,
            offset: nextOffset,
        })
            .then((data) => {
                if (data.sources.length > 0) setSources(data.sources);
                const seen = new Set(results.map((r) => `${r.source}:${r.id}`));
                const fresh = data.results.filter((r) => !seen.has(`${r.source}:${r.id}`));
                setResults((prev) => [...prev, ...fresh]);
                setHasMore(fresh.length >= PAGE_SIZE);
            })
            .catch((err) => toast.error(httpErrorToHuman(err) || t('server.installer.error_load_more')))
            .finally(() => setLoadingMore(false));
    }, [uuid, loadingMore, hasMore, results, tab, source, query, loader, gameVersion, t]);

    const tabLoaders = useMemo(() => loadersFor(eggFeatures, tab, knownLoaders), [eggFeatures, tab, knownLoaders]);

    const openPicker = useCallback(
        (project: MarketplaceProject, type: MarketplaceType, src: string, dir: string, ld: string | null) =>
            setPicker({ project, type, source: src, directory: dir, loader: ld }),
        [],
    );

    const onInstalled = useCallback(
        (filename: string) => {
            toast.success(t('server.installer.install_complete', { filename }));
            refreshInstalled();
        },
        [refreshInstalled, t],
    );

    const uninstall = useCallback(
        async (item: InstalledItem) => {
            if (!uuid) return;
            const key = `${item.type}:${item.source}:${item.projectId}`;
            setRemovingKey(key);
            try {
                const dir = destinationFolder(item.type);
                await deleteFiles(uuid, dir, [item.entry.filename]);
                await removeInstall(uuid, dir, item.source, item.projectId);
                toast.success(t('server.installer.remove_success', { filename: item.entry.filename }));
                refreshInstalled();
            } catch (err) {
                toast.error(httpErrorToHuman(err) || t('server.installer.error_remove'));
            } finally {
                setRemovingKey(null);
            }
        },
        [uuid, refreshInstalled, t],
    );

    const pickerInstalledEntry = useMemo(() => {
        if (!picker) return undefined;
        return installedItems.find((i) => i.source === picker.project.source && i.projectId === picker.project.id)
            ?.entry;
    }, [picker, installedItems]);

    if (!isMinecraftCapable(eggFeatures)) {
        return null;
    }

    return (
        <ServerContentBlock title={t('server.installer.title')}>
            <ServerHeader />
            <div className='space-y-6'>
                <MainPageHeader direction='column' title={t('server.installer.title_plugins_mods')}>
                    <p className='text-cream-400/60'>{t('server.installer.description')}</p>
                </MainPageHeader>

                <div className='inline-flex rounded-xl border border-mocha-300/50 bg-mocha-400/50 p-1'>
                    {(['browse', 'installed'] as const).map((v) => (
                        <button
                            key={v}
                            type='button'
                            onClick={() => setView(v)}
                            className={cn(
                                'rounded-lg px-4 py-2 text-sm font-medium capitalize transition',
                                view === v
                                    ? 'bg-brand-400/70 text-mocha-500'
                                    : 'text-cream-400/70 hover:bg-mocha-300/40',
                            )}
                        >
                            {v === 'installed'
                                ? t('server.installer.installed_count', { count: installedItems.length })
                                : t('server.installer.browse')}
                        </button>
                    ))}
                </div>

                {view === 'browse' && (
                    <>
                        <div className='inline-flex rounded-xl border border-mocha-300/50 bg-mocha-400/50 p-1'>
                            {TABS.map((entry) => (
                                <button
                                    key={entry.key}
                                    type='button'
                                    title={t(entry.hint)}
                                    onClick={() => setTab(entry.key)}
                                    className={cn(
                                        'rounded-lg px-4 py-2 text-sm font-medium transition',
                                        tab === entry.key
                                            ? 'bg-brand-400/70 text-mocha-500'
                                            : 'text-cream-400/70 hover:bg-mocha-300/40',
                                    )}
                                >
                                    {t(entry.label)}
                                </button>
                            ))}
                        </div>

                        <div className='flex flex-col gap-3 lg:flex-row lg:items-center'>
                            <div className='relative flex-1'>
                                <Magnifier
                                    width={18}
                                    height={18}
                                    fill='currentColor'
                                    className='pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-cream-400/40'
                                />
                                <input
                                    type='text'
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder={
                                        tab === 'plugin'
                                            ? t('server.installer.search_plugins_placeholder')
                                            : t('server.installer.search_mods_placeholder')
                                    }
                                    className='w-full rounded-xl border border-mocha-300/50 bg-mocha-400/50 py-3 pl-11 pr-4 text-sm text-cream-400 placeholder:text-cream-400/40 focus:border-brand-400/60 focus:outline-none'
                                />
                            </div>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        type='button'
                                        className='inline-flex items-center gap-2 rounded-xl border border-mocha-300/50 bg-mocha-400/50 px-3 py-3 text-sm text-cream-400 focus:border-brand-400/60 focus:outline-none'
                                    >
                                        {source === ALL_PROVIDERS
                                            ? t('server.installer.all_providers')
                                            : sourceLabel(source)}
                                        <ChevronDown
                                            width={14}
                                            height={14}
                                            fill='currentColor'
                                            className='text-cream-400/40'
                                        />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align='end'>
                                    <DropdownMenuRadioGroup value={source} onValueChange={setSource}>
                                        <DropdownMenuRadioItem value={ALL_PROVIDERS}>
                                            {t('server.installer.all_providers')}
                                        </DropdownMenuRadioItem>
                                        {sources.map((s) => (
                                            <DropdownMenuRadioItem key={s.key} value={s.key}>
                                                {sourceLabel(s.key)}
                                            </DropdownMenuRadioItem>
                                        ))}
                                    </DropdownMenuRadioGroup>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {tabLoaders.length > 1 && (
                                <div className='flex items-center gap-2 rounded-xl border border-mocha-300/50 bg-mocha-400/50 px-3 py-2'>
                                    <Funnel width={16} height={16} fill='currentColor' className='text-cream-400/40' />
                                    <select
                                        value={loader ?? ''}
                                        onChange={(e) => setLoader(e.target.value || null)}
                                        className='bg-transparent text-sm text-cream-400 focus:outline-none'
                                        aria-label={t('server.installer.loader')}
                                    >
                                        {tabLoaders.map((l) => (
                                            <option key={l} value={l} className='bg-mocha-500'>
                                                {l}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {Object.keys(gameVersions).length > 0 && (
                                <>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button
                                                type='button'
                                                className='inline-flex items-center gap-2 rounded-xl border border-mocha-300/50 bg-mocha-400/50 px-3 py-3 text-sm text-cream-400 focus:border-brand-400/60 focus:outline-none'
                                            >
                                                {releaseType.charAt(0).toUpperCase() + releaseType.slice(1)}
                                                <ChevronDown
                                                    width={14}
                                                    height={14}
                                                    fill='currentColor'
                                                    className='text-cream-400/40'
                                                />
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align='end'>
                                            <DropdownMenuRadioGroup
                                                value={releaseType}
                                                onValueChange={(t) => {
                                                    setReleaseType(t);
                                                    setGameVersion((gameVersions[t] ?? [])[0] ?? null);
                                                }}
                                            >
                                                {['release', 'snapshot', 'beta', 'alpha']
                                                    .filter((t) => gameVersions[t])
                                                    .concat(
                                                        Object.keys(gameVersions)
                                                            .filter(
                                                                (t) =>
                                                                    !['release', 'snapshot', 'beta', 'alpha'].includes(
                                                                        t,
                                                                    ),
                                                            )
                                                            .sort(),
                                                    )
                                                    .map((t) => (
                                                        <DropdownMenuRadioItem key={t} value={t}>
                                                            {t.charAt(0).toUpperCase() + t.slice(1)}
                                                        </DropdownMenuRadioItem>
                                                    ))}
                                            </DropdownMenuRadioGroup>
                                        </DropdownMenuContent>
                                    </DropdownMenu>

                                    <VersionDropdown
                                        versions={gameVersions[releaseType] ?? []}
                                        value={gameVersion}
                                        onChange={setGameVersion}
                                    />
                                </>
                            )}
                        </div>

                        {error && (
                            <div className='rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400'>
                                {error}
                            </div>
                        )}

                        {loading && results.length === 0 ? (
                            <div className='flex items-center justify-center gap-2 py-20 text-cream-400/60'>
                                <Spinner size='small' />
                                <span className='text-sm'>{t('server.installer.loading')}</span>
                            </div>
                        ) : results.length === 0 && !error ? (
                            <div className='rounded-2xl border border-mocha-300/50 bg-mocha-400/50 py-20 text-center text-cream-400/60'>
                                {query.trim()
                                    ? t('server.installer.no_results')
                                    : t('server.installer.nothing_to_show')}
                            </div>
                        ) : (
                            <>
                                <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3'>
                                    {results.map((project) => (
                                        <InstallerCard
                                            key={`${project.source}:${project.id}`}
                                            project={project}
                                            installedEntry={installedEntryFor(project)}
                                            onInstall={(p) => openPicker(p, tab, p.source, directory, loader)}
                                        />
                                    ))}
                                </div>

                                {hasMore && (
                                    <div className='flex justify-center pt-2'>
                                        <Button
                                            variant='secondary'
                                            onClick={loadMore}
                                            disabled={loadingMore}
                                            className='gap-2'
                                        >
                                            {loadingMore && <Spinner size='small' />}
                                            {loadingMore
                                                ? t('server.installer.loading')
                                                : t('server.installer.load_more')}
                                        </Button>
                                    </div>
                                )}
                            </>
                        )}
                    </>
                )}

                {view === 'installed' && (
                    <div className='space-y-3'>
                        {installedItems.length === 0 ? (
                            <div className='rounded-2xl border border-mocha-300/50 bg-mocha-400/50 py-16 text-center text-cream-400/60'>
                                {t('server.installer.empty_installed')}
                            </div>
                        ) : (
                            installedItems.map((item) => {
                                const key = `${item.type}:${item.source}:${item.projectId}`;
                                const removing = removingKey === key;
                                return (
                                    <div
                                        key={key}
                                        className='flex items-center justify-between gap-3 rounded-xl border border-mocha-300/50 bg-mocha-400/50 p-3'
                                    >
                                        <div className='min-w-0'>
                                            <div className='flex flex-wrap items-center gap-2'>
                                                <span className='truncate text-sm font-medium text-cream-400'>
                                                    {item.entry.project_title}
                                                </span>
                                                <span
                                                    className={cn(
                                                        'rounded px-1.5 py-0.5 text-[10px] font-medium uppercase',
                                                        item.type === 'mod'
                                                            ? 'bg-brand-400/20 text-brand-400'
                                                            : 'bg-amber-500/20 text-amber-400',
                                                    )}
                                                >
                                                    {item.type}
                                                </span>
                                                <span className='rounded bg-mocha-300/60 px-1.5 py-0.5 text-[10px] uppercase text-cream-400/70'>
                                                    {sourceLabel(item.source)}
                                                </span>
                                            </div>
                                            <div className='mt-1 truncate text-[11px] text-cream-400/50'>
                                                {item.entry.version_name} · {item.entry.filename}
                                            </div>
                                        </div>
                                        <div className='flex flex-shrink-0 items-center gap-2'>
                                            <Button
                                                size='sm'
                                                variant='secondary'
                                                onClick={() =>
                                                    openPicker(
                                                        {
                                                            source: item.source,
                                                            id: item.projectId,
                                                            title: item.entry.project_title,
                                                            slug: '',
                                                            description: '',
                                                            author: '',
                                                            icon: null,
                                                            downloads: 0,
                                                            categories: [],
                                                            url: null,
                                                            updated_at: null,
                                                        },
                                                        item.type,
                                                        item.source,
                                                        destinationFolder(item.type),
                                                        null,
                                                    )
                                                }
                                            >
                                                {t('server.installer.manage')}
                                            </Button>
                                            <Button
                                                size='sm'
                                                variant='ghost'
                                                disabled={removing}
                                                onClick={() => uninstall(item)}
                                                className='text-red-400 hover:bg-red-500/10'
                                            >
                                                {removing ? (
                                                    <Spinner size='small' />
                                                ) : (
                                                    <TrashBin width={16} height={16} fill='currentColor' />
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </div>

            <VersionPicker
                open={picker !== null}
                onClose={() => setPicker(null)}
                uuid={uuid ?? ''}
                type={picker?.type ?? tab}
                source={picker?.source ?? 'modrinth'}
                loader={picker?.loader ?? null}
                directory={picker?.directory ?? directory}
                project={picker?.project ?? null}
                installedEntry={pickerInstalledEntry}
                onInstalled={onInstalled}
            />
        </ServerContentBlock>
    );
};

export default InstallerContainer;
