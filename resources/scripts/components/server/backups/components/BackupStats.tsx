import { useTranslation } from '@/i18n/I18nProvider';
import type { Translate } from '@/i18n/types';
import { formatBackupStorage } from './backupStorageFormat';

interface BackupStorageInfo {
    used_mb: number;
    legacy_usage_mb: number;
    repository_usage_mb: number;
    rustic_backup_sum_mb: number;
    overhead_mb: number;
    overhead_percent: number;
    needs_pruning: boolean;
    limit_mb: number | null;
    has_limit: boolean;
    usage_percentage: number | null;
    available_mb: number | null;
    is_over_limit: boolean;
}

interface BackupStatsProps {
    backupCount: number;
    backupLimit: number | null;
    storage?: BackupStorageInfo;
    backupStorageLimit?: number | null;
}

const StorageBreakdown = ({ storage }: { storage: BackupStorageInfo }) => {
    const { t, locale } = useTranslation();
    const hasBothUsages = storage.repository_usage_mb > 0 && storage.legacy_usage_mb > 0;

    if (!hasBothUsages) return null;

    return (
        <p className='text-xs text-zinc-400'>
            {storage.repository_usage_mb > 0
                ? `${formatBackupStorage(storage.repository_usage_mb, 1, locale)} ${t('server.backups.deduplicated')}`
                : ''}
            {hasBothUsages && ' + '}
            {storage.legacy_usage_mb > 0
                ? `${formatBackupStorage(storage.legacy_usage_mb, 1, locale)} ${t('server.backups.legacy')}`
                : ''}
        </p>
    );
};

const StorageTooltip = (
    { storage, backupStorageLimit }: { storage: BackupStorageInfo; backupStorageLimit: number | null },
    t: Translate,
    locale: string,
) => {
    const used = formatBackupStorage(storage.used_mb, 2, locale);
    const repo = formatBackupStorage(storage.repository_usage_mb, 2, locale);
    const legacy = formatBackupStorage(storage.legacy_usage_mb, 2, locale);
    const available = formatBackupStorage(storage.available_mb, 2, locale);

    if (backupStorageLimit === null) {
        return t('server.backups.storage_total', { used, repository: repo, legacy });
    }
    return t('server.backups.storage_usage', {
        used,
        limit: formatBackupStorage(backupStorageLimit, 2, locale),
        repository: repo,
        legacy,
        available,
    });
};

const BackupStats = ({ backupCount, backupLimit, storage, backupStorageLimit = null }: BackupStatsProps) => {
    const { t, locale } = useTranslation();

    return (
        <div>
            {backupLimit === null && (
                <p className='text-sm text-zinc-300'>{t('server.backups.backups_count', { count: backupCount })}</p>
            )}
            {backupLimit !== null && backupLimit > 0 && (
                <p className='text-sm text-zinc-300'>
                    {t('server.backups.backups_of_limit', { count: backupCount, limit: backupLimit })}
                </p>
            )}
            {backupLimit === 0 && <p className='text-sm text-red-400'>{t('server.backups.disabled')}</p>}

            {storage && (
                <div className='flex flex-col gap-0.5'>
                    <p
                        className='text-sm text-zinc-300 cursor-help'
                        title={StorageTooltip({ storage, backupStorageLimit }, t, locale)}
                    >
                        <span className='font-medium'>{formatBackupStorage(storage.used_mb, 1, locale)}</span>{' '}
                        {backupStorageLimit === null ? (
                            t('server.backups.storage_used')
                        ) : (
                            <span className='font-medium'>
                                {t('server.backups.of_used', {
                                    size: formatBackupStorage(backupStorageLimit, 1, locale),
                                })}
                            </span>
                        )}
                    </p>
                    <StorageBreakdown storage={storage} />
                </div>
            )}
        </div>
    );
};

export default BackupStats;
