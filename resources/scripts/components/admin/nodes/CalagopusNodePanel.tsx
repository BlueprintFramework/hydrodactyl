import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { CalagopusLogFile, CalagopusSystem } from '@/api/admin/nodes';
import {
    getCalagopusLog,
    getCalagopusLogs,
    getCalagopusStats,
    getCalagopusSystem,
    upgradeCalagopus,
} from '@/api/admin/nodes';
import { Input } from '@/components/elements/inputs';
import Spinner from '@/components/elements/Spinner';
import { Button } from '@/components/ui/button';

const formatBytes = (bytes: number): string => {
    if (!bytes) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));

    return `${parseFloat((bytes / 1024 ** i).toFixed(1))} ${units[i]}`;
};

const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className='rounded-xl border border-mocha-400 bg-mocha-500 p-4'>
        <h3 className='mb-3 text-sm font-semibold text-cream-50'>{title}</h3>
        {children}
    </div>
);

/**
 * Calagopus-only node controls: live system information, resource stats, the
 * node's log files and remote self-upgrade. Rendered on the node overview page
 * only for nodes whose daemon is "calagopus".
 */
const CalagopusNodePanel = ({ nodeId }: { nodeId: number | string }) => {
    const [system, setSystem] = useState<CalagopusSystem | null>(null);
    const [stats, setStats] = useState<Record<string, unknown> | null>(null);
    const [logs, setLogs] = useState<CalagopusLogFile[]>([]);
    const [selectedLog, setSelectedLog] = useState<string | null>(null);
    const [logContent, setLogContent] = useState('');
    const [loadingLog, setLoadingLog] = useState(false);

    const [upgradeUrl, setUpgradeUrl] = useState('');
    const [upgradeSha, setUpgradeSha] = useState('');
    const [upgrading, setUpgrading] = useState(false);

    useEffect(() => {
        getCalagopusSystem(nodeId)
            .then(setSystem)
            .catch(() => undefined);
        getCalagopusStats(nodeId)
            .then(setStats)
            .catch(() => undefined);
        getCalagopusLogs(nodeId)
            .then((data) => setLogs(data.log_files ?? []))
            .catch(() => undefined);
    }, [nodeId]);

    const loadLog = async (file: string) => {
        setSelectedLog(file);
        setLoadingLog(true);
        setLogContent('');

        try {
            setLogContent(await getCalagopusLog(nodeId, file, 500));
        } catch {
            toast.error('Failed to load the log file.');
        } finally {
            setLoadingLog(false);
        }
    };

    const submitUpgrade = async () => {
        if (!upgradeUrl || upgradeSha.length !== 64) {
            toast.error('A download URL and a 64 character SHA-256 are required.');
            return;
        }

        setUpgrading(true);

        try {
            const result = await upgradeCalagopus(nodeId, { url: upgradeUrl, sha256: upgradeSha });
            toast.success(
                result.applied ? 'Upgrade applied. The node is restarting.' : 'Upgrade was ignored by the node.',
            );
        } catch {
            toast.error('Failed to request the upgrade.');
        } finally {
            setUpgrading(false);
        }
    };

    if (!system) {
        return (
            <div className='flex items-center justify-center py-8'>
                <Spinner centered size={Spinner.Size.LARGE} />
            </div>
        );
    }

    return (
        <div className='space-y-4'>
            <Card title='Calagopus Node'>
                <dl className='grid grid-cols-2 gap-3 text-sm sm:grid-cols-3 lg:grid-cols-5'>
                    <div>
                        <dt className='text-xs uppercase tracking-wide text-cream-400/50'>Version</dt>
                        <dd className='mt-1 text-cream-100'>{system.version}</dd>
                    </div>
                    <div>
                        <dt className='text-xs uppercase tracking-wide text-cream-400/50'>OS</dt>
                        <dd className='mt-1 text-cream-100'>
                            {system.os} / {system.architecture}
                        </dd>
                    </div>
                    <div>
                        <dt className='text-xs uppercase tracking-wide text-cream-400/50'>CPUs</dt>
                        <dd className='mt-1 text-cream-100'>{system.cpu_count}</dd>
                    </div>
                    <div className='col-span-2'>
                        <dt className='text-xs uppercase tracking-wide text-cream-400/50'>Kernel</dt>
                        <dd className='mt-1 break-words text-cream-100'>{system.kernel_version}</dd>
                    </div>
                </dl>
            </Card>

            <Card title='Live Stats'>
                {stats ? (
                    <pre className='max-h-64 overflow-auto rounded-lg bg-mocha-600 p-3 text-xs text-cream-200'>
                        {JSON.stringify(stats, null, 2)}
                    </pre>
                ) : (
                    <p className='text-sm text-cream-400/60'>No stats available.</p>
                )}
            </Card>

            <Card title='Log Files'>
                {logs.length === 0 ? (
                    <p className='text-sm text-cream-400/60'>No log files were found on the node.</p>
                ) : (
                    <div className='flex flex-wrap gap-2'>
                        {logs.map((log) => (
                            <button
                                key={log.name}
                                type='button'
                                onClick={() => loadLog(log.name)}
                                className={`rounded-lg border px-3 py-1.5 text-xs transition ${
                                    selectedLog === log.name
                                        ? 'border-brand-500 bg-brand-500/10 text-cream-50'
                                        : 'border-mocha-400 text-cream-300 hover:border-mocha-300'
                                }`}
                            >
                                {log.name}
                                <span className='ml-2 text-cream-400/50'>{formatBytes(log.size)}</span>
                            </button>
                        ))}
                    </div>
                )}

                {selectedLog && (
                    <div className='mt-3'>
                        {loadingLog ? (
                            <div className='flex justify-center py-6'>
                                <Spinner centered />
                            </div>
                        ) : (
                            <pre className='max-h-96 overflow-auto rounded-lg bg-mocha-600 p-3 text-xs text-cream-200'>
                                {logContent || 'This log file is empty.'}
                            </pre>
                        )}
                    </div>
                )}
            </Card>

            <Card title='Remote Upgrade'>
                <p className='mb-3 text-sm text-cream-400/60'>
                    This is only available when the node is not running inside a container. The node validates the
                    downloaded binary against the SHA-256 before replacing itself.
                </p>
                <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
                    <Input.Text
                        placeholder='https://example.com/wings-rs-x86_64-linux'
                        value={upgradeUrl}
                        onChange={(e) => setUpgradeUrl(e.target.value)}
                    />
                    <Input.Text
                        placeholder='SHA-256 (64 hex characters)'
                        value={upgradeSha}
                        onChange={(e) => setUpgradeSha(e.target.value)}
                    />
                </div>
                <div className='mt-3'>
                    <Button onClick={submitUpgrade} disabled={upgrading}>
                        {upgrading ? 'Requesting…' : 'Upgrade Node'}
                    </Button>
                </div>
            </Card>
        </div>
    );
};

export default CalagopusNodePanel;
