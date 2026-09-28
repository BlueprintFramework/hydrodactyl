import { ArrowDownToLine, Check } from '@gravity-ui/icons';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { httpErrorToHuman } from '@/api/http';
import pullFile from '@/api/server/files/pullFile';
import {
    getMarketplaceProject,
    type MarketplaceProject,
    type MarketplaceVersion,
    resolveMarketplaceInstall,
} from '@/api/server/marketplace';
import { Dialog } from '@/components/elements/dialog';
import Spinner from '@/components/elements/Spinner';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/I18nProvider';
import type { TranslationKey } from '@/i18n/types';
import { formatNumber } from '@/lib/formatters';
import { cn } from '@/lib/utils';

import { destinationFolder } from './eggFeatures';
import { type InstalledEntry, recordInstall } from './installedState';
import { SOURCE_LABELS } from './sources';

interface VersionPickerProps {
    open: boolean;
    onClose: () => void;
    uuid: string;
    type: 'mod' | 'plugin';
    source: string;
    loader: string | null;
    directory: string;
    project: MarketplaceProject | null;
    /** Currently-installed record for this project (if any), so we can mark it. */
    installedEntry?: InstalledEntry;
    /** Called after a file is successfully pulled so the UI can react. */
    onInstalled?: (filename: string, directory: string) => void;
}

const formatBytes = (bytes: number | null | undefined, locale: string): string => {
    if (!bytes) return '—';
    if (bytes >= 1_000_000) {
        return `${formatNumber(bytes / 1_000_000, locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} MB`;
    }

    if (bytes >= 1_000) {
        return `${formatNumber(bytes / 1_000, locale, { maximumFractionDigits: 0 })} KB`;
    }

    return `${bytes} B`;
};

const TYPE_BADGE: Record<string, { label: TranslationKey; className: string }> = {
    release: { label: 'server.installer.version_type_release', className: 'bg-brand-400/20 text-brand-400' },
    beta: { label: 'server.installer.version_type_beta', className: 'bg-amber-500/20 text-amber-400' },
    alpha: { label: 'server.installer.version_type_alpha', className: 'bg-red-500/20 text-red-400' },
};

const BADGE_FALLBACK: { label: TranslationKey; className: string } = {
    label: 'server.installer.version_type_other',
    className: 'bg-mocha-300/40 text-cream-400/60',
};

const VersionPicker = ({
    open,
    onClose,
    uuid,
    type,
    source,
    loader,
    directory,
    project,
    installedEntry,
    onInstalled,
}: VersionPickerProps) => {
    const { t, locale } = useTranslation();
    const [versions, setVersions] = useState<MarketplaceVersion[]>([]);
    const [loading, setLoading] = useState(false);
    const [installingId, setInstallingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!open || !project) return;

        let cancelled = false;
        setLoading(true);
        setError(null);
        setVersions([]);

        getMarketplaceProject(uuid, {
            type,
            source,
            projectId: project.id,
            loader,
        })
            .then((data) => {
                if (!cancelled) setVersions(data);
            })
            .catch((err) => {
                if (!cancelled) setError(httpErrorToHuman(err));
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [open, project, uuid, type, source, loader]);

    const install = async (version: MarketplaceVersion) => {
        if (!project) return;
        setInstallingId(version.id);
        try {
            const resolved = await resolveMarketplaceInstall(uuid, {
                type,
                source,
                projectId: project.id,
                versionId: version.id,
            });

            const targetDirectory = resolved.directory || directory || destinationFolder(type);

            await pullFile(uuid, {
                url: resolved.url,
                directory: targetDirectory,
                filename: resolved.filename,
            });

            // Persist the install in the folder manifest so cards reflect state
            // across reloads, then bubble up so the parent can refresh.
            const entry: InstalledEntry = {
                filename: resolved.filename,
                version_id: version.id,
                version_name: version.name,
                project_title: project.title,
                installed_at: new Date().toISOString(),
            };
            try {
                await recordInstall(uuid, targetDirectory, source, project.id, entry);
            } catch {
                // Non-fatal: the file is already on disk, manifest is best-effort.
            }

            toast.success(
                t('server.installer.install_success', { filename: resolved.filename, directory: targetDirectory }),
            );
            onInstalled?.(resolved.filename, targetDirectory);
            onClose();
        } catch (err) {
            toast.error(httpErrorToHuman(err) || t('server.installer.error_install'));
        } finally {
            setInstallingId(null);
        }
    };

    if (!project) return null;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            title={`${installedEntry ? t('server.installer.manage') : t('server.installer.install')} ${project.title}`}
            description={`${SOURCE_LABELS[source] ?? source} · ${project.author || t('server.installer.unknown_author')}`}
        >
            <div className='space-y-3'>
                {installedEntry && (
                    <div className='flex items-center gap-2 rounded-lg border border-brand-400/30 bg-brand-400/10 p-2 text-xs text-brand-400'>
                        <Check width={14} height={14} fill='currentColor' />
                        <span>
                            {t('server.installer.currently_installed')} <strong>{installedEntry.version_name}</strong> (
                            {installedEntry.filename})
                        </span>
                    </div>
                )}

                {loading && (
                    <div className='flex items-center justify-center gap-2 py-10 text-cream-400/70'>
                        <Spinner size='small' />
                        <span className='text-sm'>{t('server.installer.loading_versions')}</span>
                    </div>
                )}

                {error && <p className='rounded-lg bg-red-500/10 p-3 text-sm text-red-400'>{error}</p>}

                {!loading && !error && versions.length === 0 && (
                    <p className='py-10 text-center text-sm text-cream-400/60'>
                        {loader
                            ? t('server.installer.no_versions_loader', { loader })
                            : t('server.installer.no_versions')}
                    </p>
                )}

                {!loading && versions.length > 0 && (
                    <div className='max-h-[55vh] space-y-2 overflow-y-auto pr-1'>
                        {versions.map((version) => {
                            const badge = TYPE_BADGE[version.type] ?? BADGE_FALLBACK;
                            const installing = installingId === version.id;
                            const isInstalledVersion = installedEntry?.version_id === version.id;
                            return (
                                <div
                                    key={version.id}
                                    className={cn(
                                        'flex items-center justify-between gap-3 rounded-xl border bg-mocha-400/50 p-3',
                                        isInstalledVersion ? 'border-brand-400/50' : 'border-mocha-300/50',
                                    )}
                                >
                                    <div className='min-w-0'>
                                        <div className='flex flex-wrap items-center gap-2'>
                                            <span className='truncate text-sm font-medium text-cream-400'>
                                                {version.name}
                                            </span>
                                            <span className={cn('rounded px-1.5 py-0.5 text-[10px]', badge.className)}>
                                                {t(badge.label)}
                                            </span>
                                            {isInstalledVersion && (
                                                <span className='flex items-center gap-1 rounded bg-brand-400/20 px-1.5 py-0.5 text-[10px] font-medium text-brand-400'>
                                                    <Check width={10} height={10} fill='currentColor' />
                                                    {t('server.installer.installed')}
                                                </span>
                                            )}
                                        </div>
                                        <div className='mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-cream-400/50'>
                                            {version.game_versions.length > 0 && (
                                                <span className='truncate'>
                                                    {version.game_versions.slice(0, 4).join(', ')}
                                                    {version.game_versions.length > 4 ? '…' : ''}
                                                </span>
                                            )}
                                            {version.loaders.length > 0 && <span>{version.loaders.join(', ')}</span>}
                                            <span>{formatBytes(version.size, locale)}</span>
                                        </div>
                                    </div>
                                    <Button
                                        size='sm'
                                        variant={isInstalledVersion ? 'secondary' : 'attention'}
                                        disabled={installing}
                                        onClick={() => install(version)}
                                        className='flex-shrink-0 gap-1.5'
                                    >
                                        {installing ? (
                                            <Spinner size='small' />
                                        ) : isInstalledVersion ? (
                                            <Check width={16} height={16} fill='currentColor' />
                                        ) : (
                                            <ArrowDownToLine width={16} height={16} fill='currentColor' />
                                        )}
                                        {installing
                                            ? t('server.installer.installing')
                                            : isInstalledVersion
                                              ? t('server.installer.reinstall')
                                              : t('server.installer.install')}
                                    </Button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </Dialog>
    );
};

export default VersionPicker;
