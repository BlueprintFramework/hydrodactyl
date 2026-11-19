import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { httpErrorToHuman } from '@/api/http';
import { getMcjarsBuilds, getMcjarsVersions, type McjarsBuild, type McjarsVersion } from '@/api/server/mcjars';
import Spinner from '@/components/elements/Spinner';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/I18nProvider';
import { formatBytes } from './mcjarsTypes';
import SoftwareCard from './SoftwareCard';
import type { Egg } from './types';

interface Props {
    uuid: string;
    egg: Egg;
    mcjarsType: string;
    isLoading: boolean;
    onBack: () => void;
    onCancel: () => void;
    onInstall: (selection: { version: string; build: string; java: number | null }) => void;
}

const buildKey = (build: McjarsBuild): string =>
    build.build_number != null ? String(build.build_number) : build.name || String(build.id ?? '');

const VersionSelection = ({ uuid, egg, mcjarsType, isLoading, onBack, onCancel, onInstall }: Props) => {
    const { t } = useTranslation();
    const [loadingVersions, setLoadingVersions] = useState(true);
    const [loadingBuilds, setLoadingBuilds] = useState(false);
    const [versions, setVersions] = useState<McjarsVersion[]>([]);
    const [builds, setBuilds] = useState<McjarsBuild[]>([]);
    const [showExperimental, setShowExperimental] = useState(false);
    const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
    const [selectedBuildKey, setSelectedBuildKey] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        setLoadingVersions(true);
        getMcjarsVersions(uuid, mcjarsType)
            .then((list) => {
                if (cancelled) return;
                setVersions(list);
                const firstStable = list.find((v) => !v.experimental && v.type !== 'SNAPSHOT');
                setSelectedVersion((firstStable || list[0])?.id || null);
            })
            .catch((error) => {
                console.error(error);
                toast.error(httpErrorToHuman(error));
            })
            .finally(() => {
                if (!cancelled) setLoadingVersions(false);
            });

        return () => {
            cancelled = true;
        };
    }, [uuid, mcjarsType]);

    useEffect(() => {
        if (!selectedVersion) {
            setBuilds([]);
            setSelectedBuildKey(null);
            return;
        }

        let cancelled = false;
        setLoadingBuilds(true);
        setSelectedBuildKey(null);
        getMcjarsBuilds(uuid, mcjarsType, selectedVersion)
            .then((list) => {
                if (cancelled) return;
                setBuilds(list);
                // Default to the newest build (API returns newest-first).
                setSelectedBuildKey(list[0] ? buildKey(list[0]) : null);
            })
            .catch((error) => {
                console.error(error);
                toast.error(httpErrorToHuman(error));
            })
            .finally(() => {
                if (!cancelled) setLoadingBuilds(false);
            });

        return () => {
            cancelled = true;
        };
    }, [uuid, mcjarsType, selectedVersion]);

    const visibleVersions = useMemo(() => {
        if (showExperimental) return versions;
        return versions.filter((v) => !v.experimental && String(v.type).toUpperCase() !== 'SNAPSHOT');
    }, [versions, showExperimental]);

    const selectedMeta = versions.find((v) => v.id === selectedVersion);
    const selectedBuild = builds.find((b) => buildKey(b) === selectedBuildKey) || builds[0];

    return (
        <SoftwareCard title={t('server.software.versions.title', { software: egg.attributes.name })}>
            <div className='space-y-4'>
                <div className='flex flex-col sm:flex-row gap-3'>
                    <Button variant='secondary' onClick={onBack} className='w-full sm:w-auto'>
                        {t('server.software.versions.back')}
                    </Button>
                    <Button variant='secondary' onClick={onCancel} className='w-full sm:w-auto'>
                        {t('common.cancel')}
                    </Button>
                    <label className='ml-auto flex items-center gap-2 text-sm text-cream-300 cursor-pointer select-none'>
                        <input
                            type='checkbox'
                            checked={showExperimental}
                            onChange={(e) => setShowExperimental(e.target.checked)}
                            className='rounded border-mocha-300'
                        />
                        {t('server.software.versions.show_experimental')}
                    </label>
                </div>

                {loadingVersions ? (
                    <div className='flex flex-col items-center py-16'>
                        <Spinner size='large' />
                        <p className='text-cream-400/70 mt-4'>{t('server.software.versions.loading')}</p>
                    </div>
                ) : visibleVersions.length === 0 ? (
                    <p className='text-cream-400 text-center py-12'>{t('server.software.versions.empty')}</p>
                ) : (
                    <div className='grid grid-cols-1 lg:grid-cols-5 gap-4'>
                        <div className='lg:col-span-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-[28rem] overflow-y-auto pr-1'>
                            {visibleVersions.map((version) => {
                                const isSelected = version.id === selectedVersion;
                                const badge =
                                    version.supported || version.type === 'RELEASE'
                                        ? t('server.software.versions.stable')
                                        : version.type;

                                return (
                                    <button
                                        type='button'
                                        key={version.id}
                                        onClick={() => setSelectedVersion(version.id)}
                                        className={`text-left rounded-lg border px-3 py-2.5 transition-all ${
                                            isSelected
                                                ? 'border-brand-400 bg-brand-500/15'
                                                : 'border-mocha-300/60 bg-mocha-400/50 hover:border-brand-400/40'
                                        }`}
                                    >
                                        <div className='font-semibold text-cream-100 text-sm'>{version.id}</div>
                                        <div className='text-[10px] uppercase tracking-wide text-cream-400/70 mt-1'>
                                            {badge}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        <div className='lg:col-span-2 rounded-xl border border-mocha-300/60 bg-mocha-400/40 p-4 space-y-3'>
                            <h3 className='text-lg font-semibold text-cream-100'>
                                {selectedVersion || t('server.software.versions.pick')}
                            </h3>
                            {loadingBuilds ? (
                                <div className='flex items-center gap-2 text-cream-400/70'>
                                    <Spinner size='small' />
                                    {t('common.loading')}
                                </div>
                            ) : (
                                <>
                                    {builds.length > 1 && (
                                        <label className='block space-y-1.5'>
                                            <span className='text-sm text-cream-400/60'>
                                                {t('server.software.versions.build')}
                                            </span>
                                            <select
                                                value={selectedBuildKey || ''}
                                                onChange={(e) => setSelectedBuildKey(e.target.value || null)}
                                                className='w-full rounded-lg border border-mocha-300/60 bg-mocha-500/60 px-3 py-2 text-sm text-cream-100 focus:outline-none focus:border-brand-400/60'
                                            >
                                                {builds.map((build) => {
                                                    const key = buildKey(build);
                                                    const label =
                                                        build.name ||
                                                        (build.build_number != null ? `#${build.build_number}` : key);

                                                    return (
                                                        <option key={key} value={key}>
                                                            {label}
                                                        </option>
                                                    );
                                                })}
                                            </select>
                                        </label>
                                    )}
                                    <dl className='grid grid-cols-2 gap-2 text-sm'>
                                        <dt className='text-cream-400/60'>{t('server.software.versions.java')}</dt>
                                        <dd className='text-cream-100'>
                                            {selectedBuild?.java || selectedMeta?.java || '—'}
                                        </dd>
                                        {builds.length <= 1 && (
                                            <>
                                                <dt className='text-cream-400/60'>
                                                    {t('server.software.versions.build')}
                                                </dt>
                                                <dd className='text-cream-100'>
                                                    {selectedBuild?.name ||
                                                        (selectedBuild?.build_number != null
                                                            ? `#${selectedBuild.build_number}`
                                                            : selectedMeta?.latest_name) ||
                                                        '—'}
                                                </dd>
                                            </>
                                        )}
                                        <dt className='text-cream-400/60'>{t('server.software.versions.size')}</dt>
                                        <dd className='text-cream-100'>
                                            {formatBytes(selectedBuild?.jar_size || selectedMeta?.jar_size)}
                                        </dd>
                                        <dt className='text-cream-400/60'>{t('server.software.versions.date')}</dt>
                                        <dd className='text-cream-100'>
                                            {(selectedBuild?.created || selectedMeta?.created || '—')
                                                .toString()
                                                .slice(0, 10)}
                                        </dd>
                                    </dl>
                                    {selectedBuild?.changes?.[0] && (
                                        <p className='text-xs text-cream-400/70 line-clamp-3'>
                                            {selectedBuild.changes[0]}
                                        </p>
                                    )}
                                    <Button
                                        className='w-full'
                                        disabled={isLoading || !selectedVersion}
                                        onClick={() => {
                                            if (!selectedVersion) return;
                                            const build =
                                                selectedBuild?.build_number != null
                                                    ? String(selectedBuild.build_number)
                                                    : selectedBuild?.name || 'latest';
                                            onInstall({
                                                version: selectedVersion,
                                                build,
                                                java: selectedBuild?.java ?? selectedMeta?.java ?? null,
                                            });
                                        }}
                                    >
                                        {isLoading && <Spinner size='small' />}
                                        {t('server.software.versions.install')}
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </SoftwareCard>
    );
};

export default VersionSelection;
