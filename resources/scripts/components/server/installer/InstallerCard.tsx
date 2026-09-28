import { ArrowDownToLine, Check } from '@gravity-ui/icons';

import { useState } from 'react';

import type { MarketplaceProject } from '@/api/server/marketplace';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/I18nProvider';
import { cn } from '@/lib/utils';

import type { InstalledEntry } from './installedState';
import { SOURCE_LABELS } from './sources';

interface InstallerCardProps {
    project: MarketplaceProject;
    installedEntry?: InstalledEntry;
    onInstall: (project: MarketplaceProject) => void;
    installing?: boolean;
}

const formatNumber = (n: number): string => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
};

const InstallerCard = ({ project, installedEntry, onInstall, installing }: InstallerCardProps) => {
    const { t } = useTranslation();
    const isInstalled = Boolean(installedEntry);
    // Some marketplace projects have no usable icon (Hangar projects without a
    // custom avatar 404 on the CDN; some Spiget resources have none at all).
    // Track load failures so we degrade to the letter avatar instead of showing
    // a broken-image glyph.
    const [iconFailed, setIconFailed] = useState(false);
    const iconSrc = project.icon && !iconFailed ? project.icon : null;

    return (
        <div
            className={cn(
                'group flex flex-col rounded-2xl border bg-mocha-400/60 p-5 transition',
                isInstalled ? 'border-brand-400/50' : 'border-mocha-300/60',
                'hover:border-brand-400/60 hover:bg-mocha-400/80 hover:shadow-lg hover:shadow-black/20',
            )}
        >
            <div className='flex items-start gap-4'>
                <div className='h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl border border-mocha-300/60 bg-mocha-300/40'>
                    {iconSrc ? (
                        <img
                            src={iconSrc}
                            alt=''
                            className='h-full w-full object-cover'
                            loading='lazy'
                            // Marketplace icons are remote user-uploaded content.
                            referrerPolicy='no-referrer'
                            onError={() => setIconFailed(true)}
                        />
                    ) : (
                        <div className='flex h-full w-full items-center justify-center text-base font-semibold text-cream-400/50'>
                            {(project.title || '?').charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>
                <div className='min-w-0 flex-1'>
                    <div className='flex flex-wrap items-center gap-2'>
                        <h3
                            className='truncate text-sm font-semibold'
                            title={
                                project.url
                                    ? t('server.installer.open_project_page', { title: project.title })
                                    : project.title
                            }
                        >
                            {project.url ? (
                                <a
                                    href={project.url}
                                    target='_blank'
                                    rel='noopener noreferrer'
                                    className='text-cream-400 transition-colors hover:text-brand-400 hover:underline'
                                >
                                    {project.title}
                                </a>
                            ) : (
                                <span className='text-cream-400'>{project.title}</span>
                            )}
                        </h3>
                        <span className='rounded-md bg-mocha-300/60 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-cream-400/70'>
                            {SOURCE_LABELS[project.source] ?? project.source}
                        </span>
                        {isInstalled && (
                            <span
                                title={installedEntry?.version_name}
                                className='flex items-center gap-1 rounded-md bg-brand-400/20 px-1.5 py-0.5 text-[10px] font-medium text-brand-400'
                            >
                                <Check width={11} height={11} fill='currentColor' />
                                {t('server.installer.installed')}
                            </span>
                        )}
                    </div>
                    <p className='mt-0.5 truncate text-xs text-cream-400/60'>
                        {t('server.installer.by_author', { author: project.author || t('common.unknown') })}
                    </p>
                </div>
            </div>

            <p className='mt-3 line-clamp-2 min-h-[2.5rem] text-xs leading-relaxed text-cream-400/70'>
                {project.description || t('server.installer.no_description')}
            </p>

            <div className='mt-3 flex flex-wrap gap-1.5'>
                {project.categories.slice(0, 3).map((category) => (
                    <span
                        key={category}
                        className='rounded-md bg-mocha-300/40 px-1.5 py-0.5 text-[10px] text-cream-400/60'
                    >
                        {category}
                    </span>
                ))}
            </div>

            <div className='mt-auto flex items-center justify-between pt-4'>
                <span className='text-[11px] text-cream-400/50'>
                    {t('server.installer.downloads', { count: formatNumber(project.downloads) })}
                </span>
                <Button
                    size='sm'
                    variant={isInstalled ? 'attention' : 'secondary'}
                    disabled={installing}
                    onClick={() => onInstall(project)}
                    className='gap-1.5'
                >
                    {isInstalled ? (
                        <Check width={16} height={16} fill='currentColor' />
                    ) : (
                        <ArrowDownToLine width={16} height={16} fill='currentColor' />
                    )}
                    {installing
                        ? t('server.installer.installing_ellipsis')
                        : isInstalled
                          ? t('server.installer.manage')
                          : t('server.installer.install')}
                </Button>
            </div>
        </div>
    );
};

export default InstallerCard;
