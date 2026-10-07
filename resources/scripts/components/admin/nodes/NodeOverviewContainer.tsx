import { useParams } from 'react-router-dom';
import { useNode } from '@/api/admin/useNodes';
import Spinner from '@/components/elements/Spinner';
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
}) => (
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
            {formatBytes(allocated)} of {formatBytes(total)} allocated
        </p>
    </div>
);

const Stat = ({ label, value }: { label: string; value: string }) => (
    <div className='rounded-xl border border-mocha-400 bg-mocha-500 p-4'>
        <p className='text-xs uppercase tracking-wide text-cream-400/50'>{label}</p>
        <p className='mt-1 break-words text-sm text-cream-100'>{value}</p>
    </div>
);

const NodeOverviewContainer = () => {
    const { id } = useParams<'id'>();
    const { data: node } = useNode(id);

    if (!node) {
        return (
            <div className='flex items-center justify-center py-16'>
                <Spinner centered size={Spinner.Size.LARGE} />
            </div>
        );
    }

    return (
        <div className='space-y-4'>
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                <Resource
                    title='Memory'
                    percent={node.memory_percent}
                    allocated={node.allocated_memory}
                    total={node.total_memory}
                />
                <Resource
                    title='Disk'
                    percent={node.disk_percent}
                    allocated={node.allocated_disk}
                    total={node.total_disk}
                />
            </div>

            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
                <Stat label='FQDN' value={node.fqdn} />
                <Stat label='Internal FQDN' value={node.internal_fqdn || '—'} />
                <Stat label='Scheme' value={node.scheme.toUpperCase()} />
                <Stat label='Location' value={node.location?.short ?? '—'} />
                <Stat label='Daemon' value={node.daemonType} />
                <Stat label='Backup Storage' value={node.backupDisk.replace(/_/g, ' ')} />
                <Stat label='Servers' value={String(node.servers_count)} />
                <Stat label='Maintenance Mode' value={node.maintenance_mode ? 'Enabled' : 'Disabled'} />
            </div>

            {node.daemonType === 'calagopus' && <CalagopusNodePanel nodeId={node.id} />}
        </div>
    );
};

export default NodeOverviewContainer;
