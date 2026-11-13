import { Magnifier } from '@gravity-ui/icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { httpErrorToHuman } from '@/api/http';
import type {
    GameVersions,
    MarketplaceCategory,
    MarketplaceProject,
    MarketplaceVersion,
} from '@/api/server/marketplace';
import {
    getMarketplaceCategories,
    getMarketplaceGameVersions,
    getMarketplaceLoaders,
    getMarketplaceProject,
    installModpack,
    searchMarketplace,
} from '@/api/server/marketplace';
import { Dialog } from '@/components/elements/dialog';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import Spinner from '@/components/elements/Spinner';
import ServerHeader from '@/components/server/header/ServerHeader';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/I18nProvider';
import type { TranslationKey } from '@/i18n/types';
import { rememberServerOperation } from '@/lib/serverOperationTracker';
import { cn } from '@/lib/utils';
import { useNests } from '@/plugins/useNests';
import { usePermissions } from '@/plugins/usePermissions';
import { ServerContext } from '@/state/server';
import { loadersFor, supportsType } from './eggFeatures';
import FilterSidebar from './FilterSidebar';
import { mergeEggMarketplaceFeatures } from './hybridEggFeatures';
import InstallerCard from './InstallerCard';

const PAGE_SIZE = 24;
const MODPACK_SOURCE = 'modrinth';
const MODPACK_LOADERS = ['fabric', 'forge', 'neoforge', 'quilt'];

const TYPE_BADGE: Record<string, { label: TranslationKey; className: string }> = {
    release: { label: 'server.installer.version_type_release', className: 'bg-brand-400/20 text-brand-400' },
    beta: { label: 'server.installer.version_type_beta', className: 'bg-amber-500/20 text-amber-400' },
    alpha: { label: 'server.installer.version_type_alpha', className: 'bg-red-500/20 text-red-400' },
};

type HttpishError = { response?: { data?: unknown }; message?: string };

const ModpackContainer = () => {
    const { t } = useTranslation();
    const uuid = ServerContext.useStoreState((state) => state.server.data?.uuid);
    const eggId = ServerContext.useStoreState((state) => state.server.data?.egg);
    const rawEggFeatures = ServerContext.useStoreState((state) => state.server.data?.eggFeatures ?? []);
    const { data: nests } = useNests();
    const eggName = useMemo(
        () =>
            nests
                ?.find((nest) => nest.attributes.relationships.eggs.data.find((egg) => egg.attributes.uuid === eggId))
                ?.attributes.relationships.eggs.data.find((egg) => egg.attributes.uuid === eggId)?.attributes.name,
        [nests, eggId],
    );
    const eggFeatures = useMemo(() => mergeEggMarketplaceFeatures(rawEggFeatures, eggName), [rawEggFeatures, eggName]);
    const typeSupported = supportsType(eggFeatures, 'modpack');

    const [canCreateBackups = false, canReadFiles = false, canDeleteFiles = false, canReinstall = false] =
        usePermissions(['backup.create', 'file.read', 'file.delete', 'settings.reinstall']);
    const canWipe = canReadFiles && canDeleteFiles;

    const [query, setQuery] = useState('');
    const [loader, setLoader] = useState<string | null>(null);
    const [results, setResults] = useState<MarketplaceProject[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [hasNextPage, setHasNextPage] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const resultsTopRef = useRef<HTMLDivElement>(null);
    const searchRequestId = useRef(0);
    const versionsRequestId = useRef(0);

    const [knownLoaders, setKnownLoaders] = useState<string[]>([]);
    const [gameVersions, setGameVersions] = useState<GameVersions>({});
    const [releaseType, setReleaseType] = useState('release');
    const [gameVersion, setGameVersion] = useState<string | null>(null);
    const [categories, setCategories] = useState<MarketplaceCategory[]>([]);
    const [category, setCategory] = useState<string | null>(null);

    const [pickerProject, setPickerProject] = useState<MarketplaceProject | null>(null);
    const [versions, setVersions] = useState<MarketplaceVersion[]>([]);
    const [versionsLoading, setVersionsLoading] = useState(false);
    const [selectedVersion, setSelectedVersion] = useState<MarketplaceVersion | null>(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [shouldBackup, setShouldBackup] = useState(true);
    const [shouldWipe, setShouldWipe] = useState(true);
    const [installing, setInstalling] = useState(false);

    const availableLoaders = useMemo(() => {
        const fromEgg = loadersFor(eggFeatures, 'mod', knownLoaders);
        const base = fromEgg.length > 0 ? fromEgg : MODPACK_LOADERS;
        return base.filter((l) => MODPACK_LOADERS.includes(l) || knownLoaders.includes(l));
    }, [eggFeatures, knownLoaders]);

    useEffect(() => {
        if (!uuid) return;
        let cancelled = false;

        getMarketplaceLoaders(uuid)
            .then((rows) => {
                if (!cancelled) setKnownLoaders(rows);
            })
            .catch(() => {
                if (!cancelled) setKnownLoaders([]);
            });
        getMarketplaceGameVersions(uuid)
            .then((rows) => {
                if (!cancelled) setGameVersions(rows);
            })
            .catch(() => {
                if (!cancelled) setGameVersions({});
            });

        return () => {
            cancelled = true;
        };
    }, [uuid]);

    useEffect(() => {
        if (!uuid) return;
        let cancelled = false;

        getMarketplaceCategories(uuid, 'modpack', MODPACK_SOURCE)
            .then((rows) => {
                if (!cancelled) setCategories(rows);
            })
            .catch(() => {
                if (!cancelled) setCategories([]);
            });

        return () => {
            cancelled = true;
        };
    }, [uuid]);

    useEffect(() => {
        setShouldBackup(Boolean(canCreateBackups));
        setShouldWipe(Boolean(canWipe));
    }, [canCreateBackups, canWipe]);

    const runSearch = useCallback(
        (pageNum: number) => {
            if (!uuid) return;
            const id = ++searchRequestId.current;
            setLoading(true);
            setError(null);
            searchMarketplace(uuid, {
                type: 'modpack',
                source: MODPACK_SOURCE,
                query: query.trim() || undefined,
                loader,
                game_version: gameVersion,
                category,
                limit: PAGE_SIZE,
                offset: (pageNum - 1) * PAGE_SIZE,
            })
                .then(({ results: next }) => {
                    if (id !== searchRequestId.current) return;
                    setResults(next);
                    setHasNextPage(next.length >= PAGE_SIZE);
                    setPage(pageNum);
                    resultsTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                })
                .catch((err) => {
                    if (id !== searchRequestId.current) return;
                    setResults([]);
                    setHasNextPage(false);
                    setError(httpErrorToHuman(err as HttpishError) || t('server.installer.error_search'));
                })
                .finally(() => {
                    if (id === searchRequestId.current) setLoading(false);
                });
        },
        [uuid, query, loader, gameVersion, category, t],
    );

    useEffect(() => {
        if (!typeSupported || !uuid) return;
        const handle = window.setTimeout(() => runSearch(1), 250);
        return () => window.clearTimeout(handle);
    }, [runSearch, typeSupported, uuid]);

    const openVersions = useCallback(
        async (project: MarketplaceProject) => {
            if (!uuid) return;
            const id = ++versionsRequestId.current;
            setPickerProject(project);
            setSelectedVersion(null);
            setVersions([]);
            setVersionsLoading(true);
            try {
                const list = await getMarketplaceProject(uuid, {
                    type: 'modpack',
                    source: MODPACK_SOURCE,
                    projectId: project.id,
                    loader,
                    gameVersion,
                });
                if (id !== versionsRequestId.current) return;
                setVersions(list);
                if (list[0]) setSelectedVersion(list[0]);
            } catch (err) {
                if (id !== versionsRequestId.current) return;
                toast.error(httpErrorToHuman(err as HttpishError) || t('server.installer.error_search'));
                setPickerProject(null);
            } finally {
                if (id === versionsRequestId.current) setVersionsLoading(false);
            }
        },
        [uuid, loader, gameVersion, t],
    );

    const requestInstall = () => {
        if (!selectedVersion || !pickerProject) return;
        if (!canReinstall) {
            toast.error(t('server.modpacks.missing_permissions'));
            return;
        }
        setConfirmOpen(true);
    };

    const executeInstall = async () => {
        if (!uuid || !pickerProject || !selectedVersion) return;
        setInstalling(true);
        try {
            const result = await installModpack(uuid, {
                projectId: pickerProject.id,
                versionId: selectedVersion.id,
                projectTitle: pickerProject.title,
                versionName: selectedVersion.name,
                shouldBackup: canCreateBackups ? shouldBackup : false,
                shouldWipe: canWipe ? shouldWipe : false,
            });
            setConfirmOpen(false);
            setPickerProject(null);
            rememberServerOperation(uuid, result.operation_id, 'modpack_install');
            toast.success(t('server.modpacks.queued'));
        } catch (err) {
            toast.error(httpErrorToHuman(err as HttpishError) || t('server.modpacks.error_install'));
        } finally {
            setInstalling(false);
        }
    };

    if (!typeSupported) {
        return (
            <ServerContentBlock title={t('server.modpacks.title')}>
                <ServerHeader />
                <div className='rounded-2xl border border-mocha-300/50 bg-mocha-400/50 py-16 text-center text-cream-400/60'>
                    {t('server.installer.unsupported_type')}
                </div>
            </ServerContentBlock>
        );
    }

    return (
        <ServerContentBlock title={t('server.modpacks.title')}>
            <ServerHeader />
            <div className='space-y-6'>
                <MainPageHeader direction='column' title={t('server.modpacks.title')}>
                    <p className='text-cream-400/60'>{t('server.modpacks.description')}</p>
                </MainPageHeader>

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
                        placeholder={t('server.modpacks.search_placeholder')}
                        className='w-full rounded-xl border border-mocha-300/50 bg-mocha-400/50 py-3 pl-11 pr-4 text-sm text-cream-400 placeholder:text-cream-400/40 focus:border-brand-400/60 focus:outline-none'
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
                                    {results.map((project) => (
                                        <InstallerCard
                                            key={`${project.source}:${project.id}`}
                                            project={project}
                                            onInstall={openVersions}
                                        />
                                    ))}
                                </div>
                                <div className='flex items-center justify-between gap-3 pt-2'>
                                    <Button
                                        variant='secondary'
                                        disabled={page <= 1 || loading}
                                        onClick={() => runSearch(page - 1)}
                                    >
                                        {t('server.installer.page_prev')}
                                    </Button>
                                    <span className='text-sm text-cream-400/60'>
                                        {t('server.installer.page_label', { page })}
                                    </span>
                                    <Button
                                        variant='secondary'
                                        disabled={!hasNextPage || loading}
                                        onClick={() => runSearch(page + 1)}
                                    >
                                        {t('server.installer.page_next')}
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>

                    <FilterSidebar
                        showGameVersion
                        gameVersions={gameVersions}
                        releaseType={releaseType}
                        onReleaseTypeChange={setReleaseType}
                        gameVersion={gameVersion}
                        onGameVersionChange={setGameVersion}
                        loaders={availableLoaders}
                        loader={loader}
                        onLoaderChange={setLoader}
                        categories={categories}
                        category={category}
                        onCategoryChange={setCategory}
                    />
                </div>
            </div>

            <Dialog.Confirm
                open={Boolean(pickerProject) && !confirmOpen}
                onClose={() => {
                    versionsRequestId.current += 1;
                    setPickerProject(null);
                }}
                title={pickerProject?.title ?? t('server.modpacks.title')}
                confirm={t('server.modpacks.continue')}
                onConfirmed={requestInstall}
                loading={versionsLoading}
            >
                <div className='space-y-3'>
                    <p className='text-sm text-cream-400/70'>{t('server.modpacks.pick_version')}</p>
                    {versionsLoading ? (
                        <div className='flex items-center gap-2 py-6 text-cream-400/60'>
                            <Spinner size='small' />
                            <span className='text-sm'>{t('server.installer.loading_versions')}</span>
                        </div>
                    ) : versions.length === 0 ? (
                        <p className='text-sm text-cream-400/60'>{t('server.installer.no_versions')}</p>
                    ) : (
                        <div className='max-h-72 space-y-2 overflow-y-auto pr-1'>
                            {versions.map((version) => {
                                const badge = TYPE_BADGE[version.type] ?? {
                                    label: 'server.installer.version_type_other' as TranslationKey,
                                    className: 'bg-mocha-300/40 text-cream-400/60',
                                };
                                const selected = selectedVersion?.id === version.id;
                                return (
                                    <button
                                        key={version.id}
                                        type='button'
                                        onClick={() => setSelectedVersion(version)}
                                        className={cn(
                                            'flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left transition',
                                            selected
                                                ? 'border-brand-400/60 bg-brand-400/10'
                                                : 'border-mocha-300/40 bg-mocha-500/40 hover:border-mocha-200/50',
                                        )}
                                    >
                                        <div className='min-w-0'>
                                            <div className='truncate text-sm font-medium text-cream-100'>
                                                {version.name}
                                            </div>
                                            <div className='truncate text-xs text-cream-400/50'>
                                                {(version.game_versions || []).slice(0, 3).join(', ')}
                                                {version.loaders?.length ? ` · ${version.loaders.join(', ')}` : ''}
                                            </div>
                                        </div>
                                        <span
                                            className={cn('shrink-0 rounded-md px-2 py-0.5 text-xs', badge.className)}
                                        >
                                            {t(badge.label)}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </Dialog.Confirm>

            <Dialog.Confirm
                open={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                title={t('server.modpacks.confirm_title')}
                confirm={installing ? t('server.modpacks.installing') : t('server.modpacks.confirm_install')}
                onConfirmed={executeInstall}
                loading={installing}
            >
                <div className='space-y-4 text-sm text-cream-400/80'>
                    <p>
                        {t('server.modpacks.confirm_body', {
                            pack: pickerProject?.title ?? '',
                            version: selectedVersion?.name ?? '',
                        })}
                    </p>
                    <label className='flex items-center gap-3'>
                        <input
                            type='checkbox'
                            checked={shouldBackup}
                            disabled={!canCreateBackups}
                            onChange={(e) => setShouldBackup(e.target.checked)}
                            className='size-4 rounded border-mocha-300'
                        />
                        <span>{t('server.modpacks.option_backup')}</span>
                    </label>
                    <label className='flex items-center gap-3'>
                        <input
                            type='checkbox'
                            checked={shouldWipe}
                            disabled={!canWipe}
                            onChange={(e) => setShouldWipe(e.target.checked)}
                            className='size-4 rounded border-mocha-300'
                        />
                        <span>{t('server.modpacks.option_wipe')}</span>
                    </label>
                    {shouldWipe && (
                        <p className='rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-amber-200'>
                            {t('server.modpacks.wipe_warning')}
                        </p>
                    )}
                </div>
            </Dialog.Confirm>
        </ServerContentBlock>
    );
};

export default ModpackContainer;
