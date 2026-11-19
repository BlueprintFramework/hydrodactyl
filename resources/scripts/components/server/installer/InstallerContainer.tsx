import { Magnifier, TrashBin } from '@gravity-ui/icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { httpErrorToHuman } from '@/api/http';
import deleteFiles from '@/api/server/files/deleteFiles';
import type {
    GameVersions,
    MarketplaceCategory,
    MarketplaceProject,
    MarketplaceSourceMeta,
    MarketplaceType,
} from '@/api/server/marketplace';
import {
    getMarketplaceCategories,
    getMarketplaceGameVersions,
    getMarketplaceLoaders,
    getMarketplaceProject,
    searchMarketplace,
} from '@/api/server/marketplace';
import Dropdown from '@/components/elements/Dropdown';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import Spinner from '@/components/elements/Spinner';
import ServerHeader from '@/components/server/header/ServerHeader';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/I18nProvider';
import { cn } from '@/lib/utils';
import { useNests } from '@/plugins/useNests';
import { ServerContext } from '@/state/server';
import { destinationFolder, loadersFor, supportsType } from './eggFeatures';
import FilterSidebar from './FilterSidebar';
import { mergeEggMarketplaceFeatures } from './hybridEggFeatures';
import InstallerCard from './InstallerCard';
import { type InstalledEntry, type InstalledItem, readAllInstalled, removeInstall } from './installedState';
import { DEFAULT_SOURCE, sourceLabel } from './sources';
import VersionPicker from './VersionPicker';

const PAGE_SIZE = 24;
/** Combined search across every enabled provider. */
const ALL_PROVIDERS = 'all';

const typeFromPath = (pathname: string): MarketplaceType => {
    if (pathname.includes('/installer/mods')) return 'mod';
    if (pathname.includes('/installer/modpacks')) return 'mod'; // dedicated ModpackContainer owns this route
    return 'plugin';
};

interface PickerCtx {
    project: MarketplaceProject;
    type: MarketplaceType;
    source: string;
    directory: string;
    loader: string | null;
    preferredVersionId?: string | null;
}

const InstallerContainer = () => {
    const { t } = useTranslation();
    const location = useLocation();
    const tab = typeFromPath(location.pathname);
    const uuid = ServerContext.useStoreState((state) => state.server.data?.uuid);
    const eggId = ServerContext.useStoreState((state) => state.server.data?.egg);
    const rawEggFeatures = ServerContext.useStoreState((state) => state.server.data?.eggFeatures ?? []);
    const variables = ServerContext.useStoreState((state) => state.server.data?.variables ?? []);
    const { data: nests } = useNests();
    const eggName = useMemo(
        () =>
            nests
                ?.find((nest) => nest.attributes.relationships.eggs.data.find((egg) => egg.attributes.uuid === eggId))
                ?.attributes.relationships.eggs.data.find((egg) => egg.attributes.uuid === eggId)?.attributes.name,
        [nests, eggId],
    );
    const eggFeatures = useMemo(() => mergeEggMarketplaceFeatures(rawEggFeatures, eggName), [rawEggFeatures, eggName]);

    const [view, setView] = useState<'browse' | 'installed'>('browse');
    const [sources, setSources] = useState<MarketplaceSourceMeta[]>([]);
    const [source, setSource] = useState<string>(DEFAULT_SOURCE);
    const [query, setQuery] = useState('');
    const [loader, setLoader] = useState<string | null>(null);
    const [results, setResults] = useState<MarketplaceProject[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [hasNextPage, setHasNextPage] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const resultsTopRef = useRef<HTMLDivElement>(null);
    const [picker, setPicker] = useState<PickerCtx | null>(null);
    const [installedItems, setInstalledItems] = useState<InstalledItem[]>([]);
    const [removingKey, setRemovingKey] = useState<string | null>(null);
    // latest_version_id keyed by source:projectId for Installed-view update badges
    const [latestByKey, setLatestByKey] = useState<Record<string, string>>({});
    // Live Modrinth loader-tag list, used to validate the loader extracted from
    // the server's egg features (so new loaders Modrinth adds are supported
    // without a code change). Empty until the fetch resolves.
    const [knownLoaders, setKnownLoaders] = useState<string[]>([]);
    const knownLoadersRef = useRef(knownLoaders);
    knownLoadersRef.current = knownLoaders;

    const [gameVersions, setGameVersions] = useState<GameVersions>({});
    const [releaseType, setReleaseType] = useState<string>('');
    const [gameVersion, setGameVersion] = useState<string | null>(null);
    const [categories, setCategories] = useState<MarketplaceCategory[]>([]);
    const [category, setCategory] = useState<string | null>(null);

    const directory = destinationFolder(tab);
    const typeSupported = supportsType(eggFeatures, tab);
    // Hangar/Spigot have no game-version search — only Modrinth (and "all").
    const showGameVersionFilter = source === DEFAULT_SOURCE || source === ALL_PROVIDERS;

    const installedForTab = useMemo(() => installedItems.filter((item) => item.type === tab), [installedItems, tab]);

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
                    const latestRelease = releases?.[0];
                    if (latestRelease) {
                        return { version: latestRelease, type: 'release' };
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
                const firstType = types[0];
                if (firstType) {
                    const egg = findEggVersion(versions);
                    if (egg) {
                        setReleaseType(egg.type);
                        setGameVersion(egg.version);
                    } else {
                        setReleaseType(firstType);
                        setGameVersion(versions[firstType]?.[0] ?? null);
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

    // Reset browse selections when switching Plugins/Mods route. Source always
    // defaults to Modrinth (not combined "all").
    useEffect(() => {
        setLoader(loadersFor(eggFeatures, tab, knownLoadersRef.current)[0] ?? null);
        setQuery('');
        setSource(DEFAULT_SOURCE);
        setSources([]);
        setResults([]);
        setError(null);
        setCategory(null);
        setView('browse');
        const types = Object.keys(gameVersions);
        const firstType = types[0];
        if (firstType) {
            const egg = findEggVersion(gameVersions);
            if (egg) {
                setReleaseType(egg.type);
                setGameVersion(egg.version);
            } else {
                setReleaseType(firstType);
                setGameVersion(gameVersions[firstType]?.[0] ?? null);
            }
        }
    }, [tab, eggFeatures, findEggVersion, gameVersions]);

    // Re-apply egg loader once the live Modrinth loader list arrives, so a
    // pending knownLoaders fetch still ends up selecting the egg's loader.
    useEffect(() => {
        if (knownLoaders.length === 0) return;
        const next = loadersFor(eggFeatures, tab, knownLoaders)[0] ?? null;
        setLoader((prev) => (prev === next ? prev : next));
    }, [knownLoaders, eggFeatures, tab]);

    // Categories are per-provider — hide/clear when browsing "all".
    useEffect(() => {
        setCategory(null);
        setCategories([]);
        if (!uuid || !typeSupported || source === ALL_PROVIDERS) return;

        let cancelled = false;
        getMarketplaceCategories(uuid, tab, source)
            .then((rows) => {
                if (!cancelled) setCategories(rows);
            })
            .catch(() => {
                if (!cancelled) setCategories([]);
            });

        return () => {
            cancelled = true;
        };
    }, [uuid, tab, source, typeSupported]);

    // Filters / query / tab / source → back to page 1.
    useEffect(() => {
        setPage(1);
    }, [tab, source, query, loader, gameVersion, category, showGameVersionFilter]);

    // Debounced, cancellable search. Default source is Modrinth; "all" fans out
    // across every enabled provider on the backend.
    const requestId = useRef(0);
    useEffect(() => {
        if (!uuid || !typeSupported) return;

        const id = ++requestId.current;
        const handle = setTimeout(() => {
            setLoading(true);
            setError(null);
            searchMarketplace(uuid, {
                type: tab,
                source,
                query: query.trim() || undefined,
                loader,
                game_version: showGameVersionFilter ? gameVersion : null,
                category,
                limit: PAGE_SIZE,
                offset: (page - 1) * PAGE_SIZE,
            })
                .then((data) => {
                    if (id !== requestId.current) return;
                    if (data.sources.length > 0) setSources(data.sources);
                    setResults(data.results);
                    setHasNextPage(data.results.length >= PAGE_SIZE);
                })
                .catch((err) => {
                    if (id !== requestId.current) return;
                    setError(httpErrorToHuman(err) || t('server.installer.error_search'));
                    setResults([]);
                    setHasNextPage(false);
                })
                .finally(() => {
                    if (id === requestId.current) setLoading(false);
                });
        }, 350);

        return () => clearTimeout(handle);
    }, [uuid, tab, source, query, loader, gameVersion, category, showGameVersionFilter, typeSupported, page, t]);

    const goToPage = useCallback((next: number) => {
        setPage(Math.max(1, next));
        resultsTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, []);

    // Resolve latest version ids for installed items so we can show update badges.
    // Pass egg loader + game version so Modrinth/Hangar don't pick an
    // incompatible "latest" (wrong loader / wrong MC).
    useEffect(() => {
        if (!uuid || view !== 'installed' || installedForTab.length === 0) {
            setLatestByKey({});
            return;
        }

        const eggLoader = loadersFor(eggFeatures, tab, knownLoaders)[0] ?? null;
        let cancelled = false;
        Promise.all(
            installedForTab.map(async (item) => {
                try {
                    const versions = await getMarketplaceProject(uuid, {
                        type: item.type,
                        source: item.source,
                        projectId: item.projectId,
                        loader: eggLoader,
                        gameVersion,
                    });
                    const latest = versions[0]?.id;
                    return latest ? { key: `${item.source}:${item.projectId}`, latest } : null;
                } catch {
                    return null;
                }
            }),
        ).then((rows) => {
            if (cancelled) return;
            const next: Record<string, string> = {};
            for (const row of rows) {
                if (row) next[row.key] = row.latest;
            }
            setLatestByKey(next);
        });

        return () => {
            cancelled = true;
        };
    }, [uuid, view, installedForTab, eggFeatures, tab, knownLoaders, gameVersion]);

    const tabLoaders = useMemo(() => loadersFor(eggFeatures, tab, knownLoaders), [eggFeatures, tab, knownLoaders]);

    const openPicker = useCallback(
        (
            project: MarketplaceProject,
            type: MarketplaceType,
            src: string,
            dir: string,
            ld: string | null,
            preferredVersionId?: string | null,
        ) => setPicker({ project, type, source: src, directory: dir, loader: ld, preferredVersionId }),
        [],
    );

    const onInstalled = useCallback(() => {
        // VersionPicker already toasts success; only refresh install state here.
        refreshInstalled();
    }, [refreshInstalled]);

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
                toast.error(
                    httpErrorToHuman(err as { response?: { data?: unknown }; message?: string }) ||
                        t('server.installer.error_remove'),
                );
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

    if (!typeSupported) {
        return (
            <ServerContentBlock
                title={t(tab === 'plugin' ? 'server.installer.title_plugins' : 'server.installer.title_mods')}
            >
                <ServerHeader />
                <div className='rounded-2xl border border-mocha-300/50 bg-mocha-400/50 py-16 text-center text-cream-400/60'>
                    {t('server.installer.unsupported_type')}
                </div>
            </ServerContentBlock>
        );
    }

    const pageTitle = t(tab === 'plugin' ? 'server.installer.title_plugins' : 'server.installer.title_mods');
    const pageDescription = t(
        tab === 'plugin' ? 'server.installer.description_plugins' : 'server.installer.description_mods',
    );

    return (
        <ServerContentBlock title={pageTitle}>
            <ServerHeader />
            <div className='space-y-6'>
                <MainPageHeader direction='column' title={pageTitle}>
                    <p className='text-cream-400/60'>{pageDescription}</p>
                </MainPageHeader>

                <div className='inline-flex mr-3 rounded-xl border border-mocha-300/50 bg-mocha-400/50 p-1'>
                    {(['browse', 'installed'] as const).map((v) => (
                        <button
                            key={v}
                            type='button'
                            onClick={() => setView(v)}
                            className={cn(
                                'rounded-lg px-4 py-2 text-sm font-medium capitalize transition cursor-pointer',
                                view === v
                                    ? 'bg-brand-400/70 text-mocha-500'
                                    : 'text-cream-400/70 hover:bg-mocha-300/40',
                            )}
                        >
                            {v === 'installed'
                                ? t('server.installer.installed_count', { count: installedForTab.length })
                                : t('server.installer.browse')}
                        </button>
                    ))}
                </div>

                {view === 'browse' && (
                    <>
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

                            <Dropdown
                                value={source}
                                onChange={setSource}
                                triggerClassName='w-auto rounded-xl border border-mocha-300/50 bg-mocha-400/50 px-3 py-3 hover:bg-mocha-400/50'
                                options={[
                                    { value: ALL_PROVIDERS, label: t('server.installer.all_providers') },
                                    ...(sources.length > 0
                                        ? sources.map((s) => ({ value: s.key, label: sourceLabel(s.key) }))
                                        : [{ value: DEFAULT_SOURCE, label: sourceLabel(DEFAULT_SOURCE) }]),
                                ]}
                            />
                        </div>

                        <div className='flex flex-col gap-4 md:flex-row md:items-start'>
                            <div ref={resultsTopRef} className='min-w-0 flex-1 scroll-mt-4 space-y-4'>
                                {error && (
                                    <div className='rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400'>
                                        {error}
                                    </div>
                                )}

                                {loading ? (
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
                                        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-3'>
                                            {results.map((project) => {
                                                const entry = installedEntryFor(project);
                                                const updateAvailable = Boolean(
                                                    entry &&
                                                        project.latest_version_id &&
                                                        project.latest_version_id !== entry.version_id,
                                                );
                                                return (
                                                    <InstallerCard
                                                        key={`${project.source}:${project.id}`}
                                                        project={project}
                                                        installedEntry={entry}
                                                        updateAvailable={updateAvailable}
                                                        onInstall={(p) =>
                                                            openPicker(
                                                                p,
                                                                tab,
                                                                p.source,
                                                                directory,
                                                                loader,
                                                                updateAvailable ? p.latest_version_id : null,
                                                            )
                                                        }
                                                    />
                                                );
                                            })}
                                        </div>

                                        {(page > 1 || hasNextPage) && (
                                            <div className='flex flex-wrap items-center justify-center gap-3 pt-2'>
                                                <Button
                                                    variant='secondary'
                                                    onClick={() => goToPage(page - 1)}
                                                    disabled={page <= 1 || loading}
                                                    className='min-w-28'
                                                >
                                                    {t('server.installer.page_prev')}
                                                </Button>
                                                <span className='text-sm text-cream-400/70'>
                                                    {t('server.installer.page_label', { page })}
                                                </span>
                                                <Button
                                                    variant='secondary'
                                                    onClick={() => goToPage(page + 1)}
                                                    disabled={!hasNextPage || loading}
                                                    className='min-w-28'
                                                >
                                                    {t('server.installer.page_next')}
                                                </Button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            <FilterSidebar
                                showGameVersion={showGameVersionFilter}
                                gameVersions={gameVersions}
                                releaseType={releaseType}
                                onReleaseTypeChange={setReleaseType}
                                gameVersion={gameVersion}
                                onGameVersionChange={setGameVersion}
                                loaders={tabLoaders}
                                loader={loader}
                                onLoaderChange={setLoader}
                                categories={categories}
                                category={category}
                                onCategoryChange={setCategory}
                                className='md:self-start'
                            />
                        </div>
                    </>
                )}

                {view === 'installed' && (
                    <div className='space-y-3'>
                        {installedForTab.length === 0 ? (
                            <div className='rounded-2xl border border-mocha-300/50 bg-mocha-400/50 py-16 text-center text-cream-400/60'>
                                {t('server.installer.empty_installed')}
                            </div>
                        ) : (
                            installedForTab.map((item) => {
                                const key = `${item.type}:${item.source}:${item.projectId}`;
                                const removing = removingKey === key;
                                const latestId = latestByKey[`${item.source}:${item.projectId}`];
                                const updateAvailable = Boolean(latestId && latestId !== item.entry.version_id);
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
                                                <span className='rounded bg-mocha-300/60 px-1.5 py-0.5 text-[10px] uppercase text-cream-400/70'>
                                                    {sourceLabel(item.source)}
                                                </span>
                                                {updateAvailable && (
                                                    <span className='rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-medium uppercase text-amber-400'>
                                                        {t('server.installer.update_available')}
                                                    </span>
                                                )}
                                            </div>
                                            <div className='mt-1 truncate text-[11px] text-cream-400/50'>
                                                {item.entry.version_name} · {item.entry.filename}
                                            </div>
                                        </div>
                                        <div className='flex flex-shrink-0 items-center gap-2'>
                                            <Button
                                                size='sm'
                                                variant={updateAvailable ? 'attention' : 'secondary'}
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
                                                            latest_version_id: latestId ?? null,
                                                            externally_hosted: false,
                                                        },
                                                        item.type,
                                                        item.source,
                                                        destinationFolder(item.type),
                                                        null,
                                                        updateAvailable ? latestId : null,
                                                    )
                                                }
                                            >
                                                {updateAvailable
                                                    ? t('server.installer.update')
                                                    : t('server.installer.manage')}
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
                source={picker?.source ?? DEFAULT_SOURCE}
                loader={picker?.loader ?? null}
                gameVersion={gameVersion}
                directory={picker?.directory ?? directory}
                project={picker?.project ?? null}
                installedEntry={pickerInstalledEntry}
                preferredVersionId={picker?.preferredVersionId}
                onInstalled={onInstalled}
            />
        </ServerContentBlock>
    );
};

export default InstallerContainer;
