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
    const hasBothUsages = storage.repository_usage_mb > 0 && storage.legacy_usage_mb > 0;

    if (!hasBothUsages) return null;

    return (
        <p className='text-xs text-zinc-400'>
            {storage.repository_usage_mb > 0 ? `${formatBackupStorage(storage.repository_usage_mb)} deduplicated` : ''}
            {hasBothUsages && ' + '}
            {storage.legacy_usage_mb > 0 ? `${formatBackupStorage(storage.legacy_usage_mb)} legacy` : ''}
        </p>
    );
};

const StorageTooltip = ({
    storage,
    backupStorageLimit,
}: {
    storage: BackupStorageInfo;
    backupStorageLimit: number | null;
}) => {
    const used = formatBackupStorage(storage.used_mb, 2);
    const repo = formatBackupStorage(storage.repository_usage_mb, 2);
    const legacy = formatBackupStorage(storage.legacy_usage_mb, 2);
    const available = formatBackupStorage(storage.available_mb, 2);

    if (backupStorageLimit === null) {
        return `${used} total (Repository: ${repo}, Legacy: ${legacy})`;
    }
    return `${used} used of ${formatBackupStorage(backupStorageLimit, 2)} (Repository: ${repo}, Legacy: ${legacy}, ${available} available)`;
};

const BackupStats = ({ backupCount, backupLimit, storage, backupStorageLimit = null }: BackupStatsProps) => {
    return (
        <div>
            {backupLimit === null && <p className='text-sm text-zinc-300'>{backupCount} backups</p>}
            {backupLimit !== null && backupLimit > 0 && (
                <p className='text-sm text-zinc-300'>
                    {backupCount} of {backupLimit} backups
                </p>
            )}
            {backupLimit === 0 && <p className='text-sm text-red-400'>Backups disabled</p>}

            {storage && (
                <div className='flex flex-col gap-0.5'>
                    <p
                        className='text-sm text-zinc-300 cursor-help'
                        title={StorageTooltip({ storage, backupStorageLimit })}
                    >
                        <span className='font-medium'>{formatBackupStorage(storage.used_mb)}</span>{' '}
                        {backupStorageLimit === null ? (
                            'storage used'
                        ) : (
                            <span className='font-medium'>of {formatBackupStorage(backupStorageLimit)} used</span>
                        )}
                    </p>
                    <StorageBreakdown storage={storage} />
                </div>
            )}
        </div>
    );
};

export default BackupStats;
