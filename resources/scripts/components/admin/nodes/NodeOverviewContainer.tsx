import { useParams } from 'react-router-dom';
import { useNode, useNodeStatus } from '@/api/admin/useNodes';
import Spinner from '@/components/elements/Spinner';
import { useTranslation } from '@/i18n/I18nProvider';
import { cn } from '@/lib/utils';
import CalagopusNodePanel from './CalagopusNodePanel';

const formatBytes = (bytes: number): string => {
    if (!bytes) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));

    return `${parseFloat((bytes / 1024 ** i).toFixed(1))} ${units[i]}`;
};

const barColor = (percent: number) =>
    percent >= 70 ? 'bg-brand-600' : percent >= 50 ? 'bg-brand-400' : 'bg-hydro-500';

const Resource = ({
    title,
    percent,
    allocated,
    total,
}: {
    title: string;
    percent: number;
    allocated: number;
    total: number;
}) => {
    const { t } = useTranslation();

    return (
        <div className='rounded-xl border border-mocha-400 bg-mocha-500 p-4'>
            <div className='flex items-center justify-between'>
                <h3 className='text-sm font-semibold text-cream-50'>{title}</h3>
                <span className='text-sm text-cream-400/70'>{percent}%</span>
            </div>
            <div className='mt-3 h-2 w-full overflow-hidden rounded-full bg-mocha-400'>
                <div
                    className={cn('h-full rounded-full', barColor(percent))}
                    style={{ width: `${Math.min(100, percent)}%` }}
                />
            </div>
            <p className='mt-2 text-xs text-cream-400/60'>
                {t('admin.nodes.of_allocated', { used: formatBytes(allocated), total: formatBytes(total) })}
            </p>
        </div>
    );
};

const Stat = ({ label, value }: { label: string; value: string }) => (
    <div className='rounded-xl border border-mocha-400 bg-mocha-500 p-4'>
        <p className='text-xs uppercase tracking-wide text-cream-400/50'>{label}</p>
        <p className='mt-1 break-words text-sm text-cream-100'>{value}</p>
    </div>
);

const NodeOverviewContainer = () => {
    const { t } = useTranslation();
    const { id } = useParams<'id'>();
    const { data: node } = useNode(id);
    const { data: status } = useNodeStatus(id);

    if (!node) {
        return (
            <div className='flex items-center justify-center py-16'>
                <Spinner centered size={Spinner.Size.LARGE} />
            </div>
        );
    }

    const daemonVersion = !status
        ? t('admin.nodes.daemon_checking')
        : !status.up
          ? t('admin.nodes.daemon_unreachable')
          : !status.version
            ? t('admin.nodes.daemon_unknown')
            : `v${status.version} (${
                  status.up_to_date === true
                      ? t('admin.nodes.daemon_up_to_date')
                      : status.up_to_date === false
                        ? t('admin.nodes.daemon_update_to', { version: status.latest ?? '' })
                        : t('admin.nodes.daemon_status_unknown')
              })`;

    return (
        <div className='space-y-4'>
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                <Resource
                    title={t('admin.common.memory')}
                    percent={node.memory_percent}
                    allocated={node.allocated_memory}
                    total={node.total_memory}
                />
                <Resource
                    title={t('admin.common.disk')}
                    percent={node.disk_percent}
                    allocated={node.allocated_disk}
                    total={node.total_disk}
                />
            </div>

            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
                <Stat label={t('admin.nodes.daemon_version')} value={daemonVersion} />
                <Stat label={t('admin.common.fqdn')} value={node.fqdn} />
                <Stat label={t('admin.nodes.internal_fqdn')} value={node.internal_fqdn || '—'} />
                <Stat label={t('admin.nodes.scheme')} value={node.scheme.toUpperCase()} />
                <Stat label={t('admin.nodes.location')} value={node.location?.short ?? '—'} />
                <Stat label={t('admin.nodes.daemon')} value={node.daemonType} />
                <Stat label={t('admin.nodes.backup_storage')} value={node.backupDisk.replace(/_/g, ' ')} />
                <Stat label={t('common.server')} value={String(node.servers_count)} />
                <Stat
                    label={t('admin.nodes.maintenance_mode')}
                    value={node.maintenance_mode ? t('common.enabled') : t('common.disabled')}
                />
            </div>

            {node.daemonType === 'calagopus' && <CalagopusNodePanel nodeId={node.id} />}
        </div>
    );
};

export default NodeOverviewContainer;
